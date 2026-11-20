# Fernvow payments

Fernvow uses Stripe-hosted Checkout for cards and eligible wallets. The server builds each order using its own catalog and confirms payments through Stripe before recording them as paid. Stripe shows the methods eligible for the buyer and device. [Stripe Checkout payment methods](https://docs.stripe.com/payments/checkout/payment-methods)

## Activate Fernvow’s Stripe account

1. Select Fernvow in the [Stripe Dashboard](https://dashboard.stripe.com/) and choose **Activate payments**. Complete Stripe’s business verification, payout bank information and public business details. [Stripe account setup](https://docs.stripe.com/get-started/account/set-up)
2. In Fernvow’s live payment method settings, verify **Cards**, **Apple Pay**, **Google Pay** and **Link**. Review **Cash App Pay** and **Amazon Pay** if the account offers them. Checkout selects from eligible methods automatically. Stripe handles Apple Pay domain validation for its hosted page. [Stripe payment methods](https://docs.stripe.com/payments/payment-methods), [Apple Pay](https://docs.stripe.com/apple-pay), [Google Pay](https://docs.stripe.com/google-pay)
3. Confirm the US destinations, flat shipping charge and fulfillment process with Selfnamed. Approve the storefront policies accordingly. Configure Stripe Tax with the relevant registrations and the product and shipping tax codes before opening orders. Stripe Checkout calculates tax on the shipping address. [Stripe Tax on Checkout](https://docs.stripe.com/tax/checkout), [Selfnamed custom-platform guidance](https://help.selfnamed.com/en/collections/19078182-other-platforms-custom-apis)

## Connect the hosted store

1. Serve the site and checkout API on the same HTTPS origin. Run the WSGI app with a production server such as Gunicorn behind the host’s HTTPS proxy. Use persistent storage for the checkout database and back it up. Keep `FERNVOW_CHECKOUT_MODE=preview` during deployment.

   ```sh
   gunicorn --chdir scripts --bind 127.0.0.1:4173 --threads 4 'web:create_app()'
   ```

2. Add a live Stripe event destination at `/api/webhooks/stripe` on the public HTTPS origin. Subscribe to the snapshot events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Keep the endpoint signing secret in the host’s secret settings. [Stripe webhook setup](https://docs.stripe.com/webhooks)
3. Set the private environment values below, then set `FERNVOW_CHECKOUT_MODE=live` and restart. At startup, the app checks that the key belongs to the stated Stripe account and that charges and payouts are enabled.

   | Setting | Value |
   | --- | --- |
   | `FERNVOW_PUBLIC_ORIGIN` | The public HTTPS origin, with no route suffix |
   | `FERNVOW_STATE_DIR` | A private persistent directory for `checkout-live.sqlite3` |
   | `FERNVOW_SHIPPING_CENTS` | The approved flat rate in cents, or `0` for free shipping |
   | `STRIPE_ACCOUNT_ID` | Fernvow’s live merchant account ID from Stripe |
   | `STRIPE_SECRET_KEY` | A live Stripe key. If restricted, allow reading the account and reading and creating Checkout Sessions |
   | `STRIPE_WEBHOOK_SECRET` | The live endpoint’s signing secret |

4. Confirm that a single product and The Daily Duo show the correct total in Stripe Checkout, including shipping and tax. Check Apple Pay with an eligible Apple Wallet device and Google Pay with an eligible Google Wallet device. Use an owner-authorized order to verify the return page, webhook delivery, order record, receipt, fulfillment and refund.
5. Reconcile with Stripe and ship from verified paid orders. The database stores priced items, Selfnamed SKU quantities and a Stripe Checkout Session ID for each order. For The Daily Duo it records both individual SKUs while Stripe charges the bundle price. Retrieve the verified order’s shipping details in Stripe. Selfnamed order submission is currently manual. [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment)

## PayPal

PayPal requires a separate PayPal Business account for Fernvow. Stripe’s built-in PayPal option is unavailable for US merchants. A separate PayPal Orders integration needs the merchant’s live credentials, destination-based shipping and tax, and capture and reconciliation against Fernvow’s order records. [Stripe PayPal eligibility](https://support.stripe.com/questions/paypal-payment-method-availability), [PayPal merchant API setup](https://developer.paypal.com/api/rest/)
