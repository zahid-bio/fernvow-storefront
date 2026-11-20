"""Regression tests for Stripe checkout with network calls replaced."""

import hashlib
import hmac
import json
import time
import unittest
from unittest.mock import patch

from checkout import Checkout, CheckoutError


class CheckoutTests(unittest.TestCase):
    def setUp(self):
        self.checkout = Checkout(
            "https://store.example", stripe_key="sk_live_fixture",
            stripe_webhook_secret="whsec_fixture", shipping=595,
        )
        self.reference = "f" * 32
        self.cart = {
            "reference": self.reference,
            "items": [{"slug": "the-daily-duo", "quantity": 2}, {"slug": "daily-cleansing-foam", "quantity": 1}],
            "subtotalCents": 16485,
        }
        self.session_id = "cs_live_checkout_session_fixture"
        self.checkout_url = "https://checkout.stripe.com/c/pay/" + self.session_id
        self.session = {
            "id": self.session_id, "client_reference_id": self.reference, "livemode": True,
            "currency": "usd", "amount_subtotal": 16485,
            "metadata": {
                "fernvow_order": self.reference, "fernvow_subtotal": "16485", "fernvow_shipping": "595",
            },
        }

    def test_create_uses_server_prices_and_stable_stripe_idempotency_key(self):
        with patch.object(self.checkout, "stripe", return_value={"url": self.checkout_url}) as stripe:
            first = self.checkout.create(self.cart)
            retry = self.checkout.create(self.cart)
        self.assertEqual(first, retry)
        self.assertEqual(first["checkoutUrl"], self.checkout_url)
        self.assertEqual(stripe.call_args_list[0], stripe.call_args_list[1])
        path, form, key = stripe.call_args.args
        self.assertEqual(path, "/checkout/sessions")
        self.assertEqual(key, self.reference)
        self.assertTrue(form["success_url"].endswith("&session_id={CHECKOUT_SESSION_ID}"))
        self.assertEqual(form["line_items[1][price_data][unit_amount]"], 6495)
        self.assertEqual(form["line_items[1][quantity]"], 2)
        self.assertEqual(form["shipping_options[0][shipping_rate_data][fixed_amount][amount]"], 595)
        self.assertEqual(form["automatic_tax[enabled]"], "true")
        self.assertNotIn("payment_method_types[0]", form)
        self.assertEqual(json.loads(form["payment_intent_data[metadata][fernvow_skus]"]), {"A5852": 3, "S0001": 2})

    def test_free_shipping_uses_validated_merchandise_subtotal(self):
        self.checkout.free_shipping_minimum = 6000
        with patch.object(self.checkout, "stripe", return_value={"url": self.checkout_url}) as stripe:
            for slug, quantity, subtotal, shipping in (
                ("hydrating-toner", 2, 5990, 595),
                ("the-daily-duo", 1, 6495, 0),
            ):
                with self.subTest(subtotal=subtotal):
                    self.checkout.create({
                        "reference": self.reference,
                        "items": [{"slug": slug, "quantity": quantity}],
                        "subtotalCents": subtotal,
                    })
                    form = stripe.call_args.args[1]
                    self.assertEqual(form["shipping_options[0][shipping_rate_data][fixed_amount][amount]"], shipping)
                    self.assertEqual(form["metadata[fernvow_shipping]"], shipping)

    def test_rejects_changed_prices_and_wrong_session_references(self):
        with patch.object(self.checkout, "stripe", return_value=self.session) as stripe:
            with self.assertRaisesRegex(CheckoutError, "pricing has changed"):
                self.checkout.create({**self.cart, "subtotalCents": 1})
            stripe.assert_not_called()
            with self.assertRaisesRegex(CheckoutError, "could not be found"):
                self.checkout.status("a" * 32, self.session_id)
            stripe.assert_called_once_with("/checkout/sessions/" + self.session_id)

    def test_verifies_payment_and_webhook_before_marking_paid(self):
        pending = {**self.session, "status": "open", "payment_status": "unpaid"}
        paid = {
            **self.session, "status": "complete", "payment_status": "paid", "amount_total": 18080,
            "total_details": {"amount_shipping": 595, "amount_discount": 0, "amount_tax": 1000},
        }
        event = json.dumps({"type": "checkout.session.completed", "data": {"object": paid}}).encode()
        stamp = int(time.time())
        digest = hmac.new(b"whsec_fixture", f"{stamp}.".encode() + event, hashlib.sha256).hexdigest()
        with patch.object(self.checkout, "stripe", side_effect=[pending, {**paid, "amount_total": 1}, paid, {}]) as stripe:
            self.assertEqual(self.checkout.status(self.reference, self.session_id), {"status": "pending"})
            with self.assertRaisesRegex(CheckoutError, "could not be verified"):
                self.checkout.status(self.reference, self.session_id)
            self.assertEqual(self.checkout.status(self.reference, self.session_id), {"status": "paid"})
            with self.assertRaisesRegex(CheckoutError, "Invalid webhook signature"):
                self.checkout.stripe_webhook(event, f"t={stamp},v1={'0' * 64}")
            self.assertEqual(self.checkout.stripe_webhook(event, f"t={stamp},v1={digest}"), {"received": True})
            stripe.assert_called_with(
                "/checkout/sessions/" + self.session_id,
                {"metadata[fernvow_payment_verified]": "true"},
                "fernvow-verified-" + self.session_id,
            )

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
                Checkout.from_environment("https://store.example")


if __name__ == "__main__":
    unittest.main()
