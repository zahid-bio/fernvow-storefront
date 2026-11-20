"""Regression tests for Stripe checkout with all network calls replaced."""

import hashlib
import hmac
import json
import tempfile
import time
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from checkout import Checkout, CheckoutError


class CheckoutTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.checkout = Checkout(
            "https://store.example", Path(directory.name) / "checkout.sqlite3",
            stripe_key="sk_live_fixture", stripe_webhook_secret="whsec_fixture", shipping=595,
        )
        self.reference = "f" * 32
        self.cart = {
            "reference": self.reference,
            "items": [{"slug": "the-daily-duo", "quantity": 2}, {"slug": "daily-cleansing-foam", "quantity": 1}],
            "subtotalCents": 16485,
        }
        self.session = {"id": "cs_live_fixture", "url": "https://checkout.stripe.com/c/pay/cs_live_fixture"}

    def test_create_uses_server_prices_and_a_stable_reference(self):
        with patch.object(self.checkout, "stripe", return_value=self.session) as stripe:
            first = self.checkout.create(self.cart)
            retry = self.checkout.create(self.cart)
        self.assertEqual(first, retry)
        stripe.assert_called_once()
        path, form, key = stripe.call_args.args
        self.assertEqual(path, "/checkout/sessions")
        self.assertEqual(key, self.reference)
        self.assertEqual(form["line_items[1][price_data][unit_amount]"], 6495)
        self.assertEqual(form["line_items[1][quantity]"], 2)
        self.assertEqual(form["shipping_options[0][shipping_rate_data][fixed_amount][amount]"], 595)
        self.assertEqual(form["automatic_tax[enabled]"], "true")
        self.assertNotIn("payment_method_types[0]", form)
        with closing(self.checkout.connect()) as database:
            row = database.execute("SELECT fulfillment FROM checkout_orders").fetchone()
        self.assertEqual(json.loads(row["fulfillment"]), {"A5852": 3, "S0001": 2})

    def test_rejects_changed_prices_and_a_changed_retry(self):
        with patch.object(self.checkout, "stripe", return_value=self.session) as stripe:
            with self.assertRaisesRegex(CheckoutError, "pricing has changed"):
                self.checkout.create({**self.cart, "subtotalCents": 1})
            stripe.assert_not_called()
            self.checkout.create(self.cart)
            different_items = [{"slug": "daily-cleansing-foam", "quantity": 1}]
            with self.assertRaisesRegex(CheckoutError, "Start a new checkout"):
                self.checkout.create({**self.cart, "items": different_items, "subtotalCents": 3495})
            stripe.assert_called_once()

    def test_verifies_payment_and_webhook_before_recording_paid(self):
        pending = {
            "id": self.session["id"], "client_reference_id": self.reference, "livemode": True,
            "currency": "usd", "amount_subtotal": 16485, "amount_total": 17080,
            "status": "open", "payment_status": "unpaid",
        }
        paid = {
            **pending, "status": "complete", "payment_status": "paid", "amount_total": 18080,
            "total_details": {"amount_shipping": 595, "amount_discount": 0, "amount_tax": 1000},
        }
        event = json.dumps({
            "type": "checkout.session.completed",
            "data": {"object": {"id": self.session["id"]}},
        }).encode()
        stamp = int(time.time())
        digest = hmac.new(b"whsec_fixture", f"{stamp}.".encode() + event, hashlib.sha256).hexdigest()
        with patch.object(self.checkout, "stripe", side_effect=[self.session, pending, {**paid, "amount_total": 1}, paid]):
            self.checkout.create(self.cart)
            self.assertEqual(self.checkout.status(self.reference), {"status": "pending"})
            with self.assertRaisesRegex(CheckoutError, "could not be verified"):
                self.checkout.status(self.reference)
            with self.assertRaisesRegex(CheckoutError, "Invalid webhook signature"):
                self.checkout.stripe_webhook(event, f"t={stamp},v1={'0' * 64}")
            self.assertEqual(self.checkout.stripe_webhook(event, f"t={stamp},v1={digest}"), {"received": True})
            self.assertEqual(self.checkout.status(self.reference), {"status": "paid"})

    def test_live_startup_rejects_a_key_for_another_merchant(self):
        env = {
            "FERNVOW_CHECKOUT_MODE": "live", "FERNVOW_SHIPPING_CENTS": "595",
            "STRIPE_ACCOUNT_ID": "acct_expected", "STRIPE_SECRET_KEY": "sk_live_fixture",
            "STRIPE_WEBHOOK_SECRET": "whsec_fixture",
        }
        with patch.dict("os.environ", env, clear=True), patch.object(Checkout, "stripe", return_value={
            "id": "acct_other", "charges_enabled": True, "payouts_enabled": True,
        }):
            with self.assertRaisesRegex(ValueError, "different merchant account"):
                Checkout.from_environment("https://store.example", self.checkout.database)


if __name__ == "__main__":
    unittest.main()
