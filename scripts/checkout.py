"""Server-owned prices and hosted Stripe Checkout Sessions."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import sqlite3
import time
import urllib.parse
import urllib.request
from contextlib import closing

# Keep the display catalog in src/data/catalog.js in sync. The client subtotal
# is checked for stale pricing and is never used to charge a customer.
CATALOG = {
    "daily-cleansing-foam": ("Daily Cleansing Foam", 3495, ("A5852",)),
    "daily-face-moisturizer": ("Daily Face Moisturizer", 3995, ("S0001",)),
    "hydrating-toner": ("Hydrating Toner", 2995, ("A5805",)),
    "the-daily-duo": ("The Daily Duo", 6495, ("A5852", "S0001")),
}
REFERENCE = re.compile(r"[a-f0-9]{32}\Z")
STRIPE_URL = "https://api.stripe.com/v1"


class CheckoutError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def request_json(url, *, headers, form=None):
    method = "GET"
    data = None
    if form is not None:
        method = "POST"
        data = urllib.parse.urlencode(form).encode()
        headers = {**headers, "Content-Type": "application/x-www-form-urlencoded"}

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response)
    except (OSError, ValueError):
        raise CheckoutError(502, "The payment provider is unavailable. Please try again.") from None


def resolve_cart(body):
    items = body.get("items")
    if not isinstance(items, list) or not 1 <= len(items) <= len(CATALOG):
        raise CheckoutError(400, "Add products to your bag before checking out.")

    quantities = {}
    for item in items:
        if not isinstance(item, dict):
            raise CheckoutError(400, "Your bag contains an invalid item.")
        slug, quantity = item.get("slug"), item.get("quantity")
        if not isinstance(slug, str) or slug not in CATALOG or slug in quantities:
            raise CheckoutError(400, "Your bag contains an invalid item.")
        if type(quantity) is not int or not 1 <= quantity <= 20:
            raise CheckoutError(400, "Choose up to 20 of each product per checkout.")
        quantities[slug] = quantity

    subtotal = sum(CATALOG[slug][1] * quantity for slug, quantity in quantities.items())
    if body.get("subtotalCents") != subtotal:
        raise CheckoutError(409, "Your bag pricing has changed. Reload before checking out.")
    return dict(sorted(quantities.items())), subtotal


class Checkout:
    def __init__(self, origin, database, *, stripe_key="", stripe_webhook_secret="", shipping=0):
        self.origin = origin
        self.database = database
        self.stripe_key = stripe_key
        self.stripe_webhook_secret = stripe_webhook_secret
        self.shipping = shipping

        if not self.stripe_key:
            return
        if not self.stripe_key.startswith(("sk_live_", "rk_live_")):
            raise ValueError("Live checkout requires a live Stripe key.")

        database.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        with closing(self.connect()) as db, db:
            db.execute("""
                CREATE TABLE IF NOT EXISTS checkout_orders (
                    reference TEXT PRIMARY KEY,
                    cart TEXT NOT NULL,
                    subtotal INTEGER NOT NULL,
                    shipping INTEGER NOT NULL,
                    fulfillment TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    provider_id TEXT UNIQUE,
                    checkout_url TEXT,
                    paid_at INTEGER
                )
            """)

    @classmethod
    def from_environment(cls, origin, database):
        env = os.environ
        mode = env.get("FERNVOW_CHECKOUT_MODE", "preview")
        if mode == "preview":
            return cls(origin, database)
        if mode != "live":
            raise ValueError("FERNVOW_CHECKOUT_MODE must be preview or live.")
        if urllib.parse.urlsplit(origin).scheme != "https":
            raise ValueError("Live checkout requires a public HTTPS origin.")
        stripe_key = env.get("STRIPE_SECRET_KEY", "").strip()
        webhook_secret = env.get("STRIPE_WEBHOOK_SECRET", "").strip()
        if not stripe_key or not webhook_secret.startswith("whsec_"):
            raise ValueError("Live checkout requires a Stripe key and webhook signing secret.")
        if not re.fullmatch(r"acct_[A-Za-z0-9]+", env.get("STRIPE_ACCOUNT_ID", "")):
            raise ValueError("Set STRIPE_ACCOUNT_ID to the Fernvow live account ID.")
        if not env.get("FERNVOW_SHIPPING_CENTS", "").strip():
            raise ValueError("Set the actual shipping rate before enabling live checkout.")

        shipping = int(env.get("FERNVOW_SHIPPING_CENTS") or "0")
        if not 0 <= shipping <= 100000:
            raise ValueError("Invalid shipping amount.")
        checkout = cls(origin, database, stripe_key=stripe_key, stripe_webhook_secret=webhook_secret, shipping=shipping)
        account = checkout.stripe("/account")
        if account.get("id") != env["STRIPE_ACCOUNT_ID"]:
            raise ValueError("The Stripe key belongs to a different merchant account.")
        if not account.get("charges_enabled") or not account.get("payouts_enabled"):
            raise ValueError("The Stripe account must be activated for payments and payouts.")
        return checkout

    @property
    def enabled(self):
        return bool(self.stripe_key)

    def connect(self):
        connection = sqlite3.connect(self.database)
        connection.row_factory = sqlite3.Row
        return connection

    def stripe(self, path, form=None, reference=None):
        headers = {"Authorization": f"Bearer {self.stripe_key}", "Stripe-Version": "2026-10-28.endive"}
        if reference:
            headers["Idempotency-Key"] = reference
        return request_json(STRIPE_URL + path, headers=headers, form=form)

    def create_stripe_session(self, order, quantities):
        reference = order["reference"]
        success = f"{self.origin}/?order={reference}"
        cancel = f"{self.origin}/?checkout=cancelled"
        shipping = order["shipping"]
        form = {
            "mode": "payment",
            "success_url": success,
            "cancel_url": cancel,
            "client_reference_id": reference,
            "payment_intent_data[metadata][fernvow_order]": reference,
            "adaptive_pricing[enabled]": "false",
            "automatic_tax[enabled]": "true",
            "shipping_options[0][shipping_rate_data][tax_behavior]": "exclusive",
            "shipping_address_collection[allowed_countries][0]": "US",
            "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
            "shipping_options[0][shipping_rate_data][display_name]": "Standard shipping",
            "shipping_options[0][shipping_rate_data][fixed_amount][amount]": shipping,
            "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "usd",
        }
        for index, (slug, quantity) in enumerate(quantities.items()):
            name, price, _ = CATALOG[slug]
            prefix = f"line_items[{index}]"
            form.update({
                f"{prefix}[quantity]": quantity,
                f"{prefix}[price_data][product_data][name]": name,
                f"{prefix}[price_data][unit_amount]": price,
                f"{prefix}[price_data][currency]": "usd",
                f"{prefix}[price_data][tax_behavior]": "exclusive",
            })
        session = self.stripe("/checkout/sessions", form, reference)
        return session["id"], session["url"]

    def create(self, body):
        if not self.enabled:
            raise CheckoutError(503, "That payment method is currently unavailable.")
        reference = body.get("reference")
        if not isinstance(reference, str) or not REFERENCE.fullmatch(reference):
            raise CheckoutError(400, "Invalid checkout reference.")

        quantities, subtotal = resolve_cart(body)
        cart = json.dumps(quantities)
        fulfillment = {}
        for slug, quantity in quantities.items():
            for sku in CATALOG[slug][2]:
                fulfillment[sku] = fulfillment.get(sku, 0) + quantity

        with closing(self.connect()) as db:
            with db:
                db.execute("""
                    INSERT OR IGNORE INTO checkout_orders
                    (reference, cart, subtotal, shipping, fulfillment, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (reference, cart, subtotal, self.shipping, json.dumps(fulfillment), int(time.time())))
            order = db.execute("SELECT * FROM checkout_orders WHERE reference = ?", (reference,)).fetchone()
            if order["cart"] != cart or order["paid_at"]:
                raise CheckoutError(409, "Start a new checkout from your bag.")
            if time.time() - order["created_at"] > 1800:
                raise CheckoutError(409, "This checkout has expired. Try again to start a new checkout.")
            if order["checkout_url"]:
                return {"checkoutUrl": order["checkout_url"], "reference": reference}

            provider_id, url = self.create_stripe_session(order, quantities)
            redirect = urllib.parse.urlsplit(url)
            if redirect.scheme != "https" or redirect.netloc != "checkout.stripe.com":
                raise CheckoutError(502, "The payment provider returned an invalid checkout link.")
            with db:
                db.execute("""
                    UPDATE checkout_orders SET provider_id = ?, checkout_url = ?
                    WHERE reference = ? AND provider_id IS NULL
                """, (provider_id, url, reference))
            saved = db.execute("SELECT checkout_url FROM checkout_orders WHERE reference = ?", (reference,)).fetchone()
            return {"checkoutUrl": saved["checkout_url"], "reference": reference}

    def stripe_status(self, order):
        session = self.stripe("/checkout/sessions/" + urllib.parse.quote(order["provider_id"], safe=""))
        if (
            session["id"] != order["provider_id"]
            or session["client_reference_id"] != order["reference"]
            or session["livemode"] is not True
            or session["currency"] != "usd"
            or session["amount_subtotal"] != order["subtotal"]
        ):
            raise CheckoutError(409, "The payment total could not be verified.")
        if session["status"] == "complete" and session["payment_status"] == "paid":
            details = session["total_details"]
            if (details["amount_shipping"] != order["shipping"]
                    or details["amount_discount"] != 0
                    or session["amount_total"] != order["subtotal"] + order["shipping"] + details["amount_tax"]):
                raise CheckoutError(409, "The payment total could not be verified.")
            return "paid"
        return "cancelled" if session["status"] == "expired" else "pending"

    def status(self, reference):
        if not isinstance(reference, str) or not REFERENCE.fullmatch(reference) or not self.enabled:
            raise CheckoutError(404, "Checkout could not be found.")
        with closing(self.connect()) as db:
            order = db.execute("SELECT * FROM checkout_orders WHERE reference = ?", (reference,)).fetchone()
            if not order or not order["provider_id"]:
                raise CheckoutError(404, "Checkout could not be found.")
            if order["paid_at"]:
                status = "paid"
            else:
                status = self.stripe_status(order)
                if status == "paid":
                    with db:
                        db.execute("UPDATE checkout_orders SET paid_at = ? WHERE reference = ? AND paid_at IS NULL",
                                   (int(time.time()), reference))
            return {"status": status}

    def stripe_webhook(self, payload, signature):
        if not self.stripe_webhook_secret or not self.enabled:
            raise CheckoutError(404, "Webhook is unavailable.")
        fields = [entry.split("=", 1) for entry in signature.split(",") if "=" in entry]
        try:
            stamp = next(int(value) for name, value in fields if name == "t")
        except (StopIteration, ValueError):
            raise CheckoutError(400, "Invalid webhook signature.") from None
        digest = hmac.new(self.stripe_webhook_secret.encode(), f"{stamp}.".encode() + payload, hashlib.sha256).hexdigest()
        if abs(time.time() - stamp) > 300 or not any(
            name == "v1" and re.fullmatch(r"[0-9a-f]{64}", value) and hmac.compare_digest(digest, value)
            for name, value in fields
        ):
            raise CheckoutError(400, "Invalid webhook signature.")

        event = json.loads(payload)
        if event.get("type") in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
            session = event["data"]["object"]
            with closing(self.connect()) as db:
                order = db.execute(
                    "SELECT reference FROM checkout_orders WHERE provider_id = ?",
                    (session["id"],),
                ).fetchone()
            if order:
                self.status(order["reference"])
        return {"received": True}
