"""Server-owned prices and hosted Stripe Checkout Sessions."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

# Keep the display catalog in src/data/catalog.js in sync. The client subtotal
# is checked for stale pricing and is never used to charge a customer.
CATALOG = {
    "daily-cleansing-foam": ("Daily Cleansing Foam", 3495, ("A5852",)),
    "daily-face-moisturizer": ("Daily Face Moisturizer", 3995, ("S0001",)),
    "hydrating-toner": ("Hydrating Toner", 2995, ("A5805",)),
    "the-daily-duo": ("The Daily Duo", 6495, ("A5852", "S0001")),
    "the-daily-trio": ("The Daily Trio", 8995, ("A5852", "A5805", "S0001")),
}
# Upper end of Selfnamed's published packaged-weight ranges for these sizes.
SKU_WEIGHT_GRAMS = {"A5852": 300, "A5805": 300, "S0001": 150}
# Maximum package weight and customer charge in cents. The U.S. supplier
# rates are weight-based. Round up to cover processing on the shipping charge.
US_STANDARD_SHIPPING = (
    (500, 895),
    (1000, 1095),
    (2000, 1095),
    (3000, 1495),
    (5000, 1995),
    (10000, 5995),
    (30000, 9395),
    (50000, 16195),
)
REFERENCE = re.compile(r"[a-f0-9]{32}\Z")
SESSION_ID = re.compile(r"cs_live_[A-Za-z0-9_]{16,248}\Z")
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
    except urllib.error.HTTPError as error:
        if error.code == 404:
            raise CheckoutError(404, "Checkout could not be found.") from None
        if error.code == 409:
            raise CheckoutError(502, "Checkout is opening. Please try again.") from None
        raise CheckoutError(502, "The payment provider is unavailable. Please try again.") from None
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


def standard_shipping_cents(weight_grams):
    for maximum, cents in US_STANDARD_SHIPPING:
        if weight_grams <= maximum:
            return cents
    raise CheckoutError(400, "This bag is too large for online shipping. Contact care@fernvow.com.")


def public_shipping_settings():
    return {
        "weightsGrams": {slug: sum(SKU_WEIGHT_GRAMS[sku] for sku in entry[2]) for slug, entry in CATALOG.items()},
        "tiers": [{"maxGrams": maximum, "cents": cents} for maximum, cents in US_STANDARD_SHIPPING],
    }


class Checkout:
    def __init__(self, origin, *, stripe_key="", stripe_webhook_secret=""):
        self.origin = origin
        self.stripe_key = stripe_key
        self.stripe_webhook_secret = stripe_webhook_secret

        if not self.stripe_key:
            return
        if not self.stripe_key.startswith(("sk_live_", "rk_live_")):
            raise ValueError("Live checkout requires a live Stripe key.")

    @classmethod
    def from_environment(cls, origin):
        env = os.environ
        mode = env.get("FERNVOW_CHECKOUT_MODE", "preview")
        if mode == "preview":
            return cls(origin)
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
        checkout = cls(
            origin, stripe_key=stripe_key, stripe_webhook_secret=webhook_secret,
        )
        account = checkout.stripe("/account")
        if account.get("id") != env["STRIPE_ACCOUNT_ID"]:
            raise ValueError("The Stripe key belongs to a different merchant account.")
        if not account.get("charges_enabled") or not account.get("payouts_enabled"):
            raise ValueError("The Stripe account must be activated for payments and payouts.")
        return checkout

    @property
    def enabled(self):
        return bool(self.stripe_key)

    def stripe(self, path, form=None, reference=None):
        headers = {"Authorization": f"Bearer {self.stripe_key}", "Stripe-Version": "2026-10-28.endive"}
        if reference:
            headers["Idempotency-Key"] = reference
        return request_json(STRIPE_URL + path, headers=headers, form=form)

    def create_stripe_session(self, reference, quantities, subtotal):
        fulfillment = {}
        for slug, quantity in quantities.items():
            for sku in CATALOG[slug][2]:
                fulfillment[sku] = fulfillment.get(sku, 0) + quantity
        shipping = standard_shipping_cents(sum(SKU_WEIGHT_GRAMS[sku] * count for sku, count in fulfillment.items()))
        sku_quantities = json.dumps(fulfillment, separators=(",", ":"), sort_keys=True)
        success = f"{self.origin}/?order={reference}&session_id={{CHECKOUT_SESSION_ID}}"
        cancel = f"{self.origin}/?checkout=cancelled"
        form = {
            "mode": "payment",
            "success_url": success,
            "cancel_url": cancel,
            "client_reference_id": reference,
            "metadata[fernvow_order]": reference,
            "metadata[fernvow_subtotal]": subtotal,
            "metadata[fernvow_shipping]": shipping,
            "metadata[fernvow_skus]": sku_quantities,
            "payment_intent_data[metadata][fernvow_order]": reference,
            "payment_intent_data[metadata][fernvow_skus]": sku_quantities,
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
        return self.stripe("/checkout/sessions", form, reference)

    def create(self, body):
        if not self.enabled:
            raise CheckoutError(503, "That payment method is currently unavailable.")
        reference = body.get("reference")
        if not isinstance(reference, str) or not REFERENCE.fullmatch(reference):
            raise CheckoutError(400, "Invalid checkout reference.")

        quantities, subtotal = resolve_cart(body)
        session = self.create_stripe_session(reference, quantities, subtotal)
        url = session.get("url")
        redirect = urllib.parse.urlsplit(url) if url else None
        if not redirect or redirect.scheme != "https" or redirect.netloc != "checkout.stripe.com":
            raise CheckoutError(502, "The payment provider returned an invalid checkout link.")
        return {"checkoutUrl": url, "reference": reference}

    def status(self, reference, session_id):
        if not (
            self.enabled and isinstance(reference, str) and REFERENCE.fullmatch(reference)
            and isinstance(session_id, str) and SESSION_ID.fullmatch(session_id)
        ):
            raise CheckoutError(404, "Checkout could not be found.")
        session = self.stripe("/checkout/sessions/" + session_id)
        return {"status": self.verify_session(session, reference, session_id)}

    @staticmethod
    def verify_session(session, reference, session_id):
        metadata = session.get("metadata") or {}
        if (
            session.get("id") != session_id or session.get("livemode") is not True
            or session.get("client_reference_id") != reference
            or metadata.get("fernvow_order") != reference
        ):
            raise CheckoutError(404, "Checkout could not be found.")
        subtotal = session.get("amount_subtotal")
        if type(subtotal) is not int or session.get("currency") != "usd" or str(subtotal) != metadata.get("fernvow_subtotal"):
            raise CheckoutError(409, "The payment total could not be verified.")
        if session.get("status") == "complete" and session.get("payment_status") == "paid":
            details = session.get("total_details") or {}
            shipping, tax = details.get("amount_shipping"), details.get("amount_tax")
            if (
                type(shipping) is not int or type(tax) is not int
                or str(shipping) != metadata.get("fernvow_shipping")
                or details.get("amount_discount") != 0
                or session.get("amount_total") != subtotal + shipping + tax
            ):
                raise CheckoutError(409, "The payment total could not be verified.")
            return "paid"
        return "cancelled" if session.get("status") == "expired" else "pending"

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
            reference = (session.get("metadata") or {}).get("fernvow_order")
            session_id = session.get("id")
            if (
                isinstance(reference, str) and REFERENCE.fullmatch(reference)
                and isinstance(session_id, str) and SESSION_ID.fullmatch(session_id)
                and self.verify_session(session, reference, session_id) == "paid"
            ):
                self.stripe(
                    "/checkout/sessions/" + session_id,
                    {"metadata[fernvow_payment_verified]": "true"},
                    "fernvow-verified-" + session_id,
                )
        return {"received": True}
