# Fernvow payments

Fernvow uses Stripe-hosted Checkout for cards and eligible wallets. The server builds each order using its own catalog and confirms payments through Stripe before recording them as paid. Stripe shows the methods eligible for the buyer and device. [Stripe Checkout payment methods](https://docs.stripe.com/payments/checkout/payment-methods)

## Activate Fernvow’s Stripe account

1. Select Fernvow in the [Stripe Dashboard](https://dashboard.stripe.com/) and choose **Activate payments**. Complete Stripe’s business verification, payout bank information and public business details. [Stripe account setup](https://docs.stripe.com/get-started/account/set-up)
2. Fernvow’s live configuration has **Cards**, **Apple Pay**, **Google Pay**, **Link**, **Cash App Pay**, **Amazon Pay**, and **Klarna** enabled. Checkout selects from eligible methods automatically. Stripe handles Apple Pay domain validation for its hosted page. [Stripe payment methods](https://docs.stripe.com/payments/payment-methods), [Apple Pay](https://docs.stripe.com/apple-pay), [Google Pay](https://docs.stripe.com/google-pay)
3. Confirm the US destinations, flat shipping charge and fulfillment process with Selfnamed. Approve the storefront policies accordingly. Configure Stripe Tax with the relevant registrations and the product and shipping tax codes before opening orders. Stripe Checkout calculates tax on the shipping address. [Stripe Tax on Checkout](https://docs.stripe.com/tax/checkout), [Selfnamed custom-platform guidance](https://help.selfnamed.com/en/collections/19078182-other-platforms-custom-apis)

## Connect the hosted store

1. Import the GitHub repository with the root directory set to the repository root in a Vercel team on a commercial plan. The deployment config publishes the static storefront and runs the checkout API as Vercel Python functions. Add `fernvow.com` and `www.fernvow.com` to the project, with `www` redirecting to the apex. In Cloudflare, set the DNS records to the exact targets shown in Vercel and use DNS-only mode. Keep `FERNVOW_CHECKOUT_MODE=preview` until the HTTPS origin is ready. [Vercel custom domains](https://vercel.com/docs/domains/set-up-custom-domain)

2. Add a live Stripe event destination at `/api/webhooks/stripe` on the public HTTPS origin. Subscribe to the snapshot events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Keep the endpoint signing secret in the host’s secret settings. [Stripe webhook setup](https://docs.stripe.com/webhooks)
3. Set the private environment values below, then set `FERNVOW_CHECKOUT_MODE=live` and restart. At startup, the app checks that the key belongs to the stated Stripe account and that charges and payouts are enabled.

   | Setting | Value |
   | --- | --- |
   | `FERNVOW_PUBLIC_ORIGIN` | The public HTTPS origin, with no route suffix |
   | `FERNVOW_SHIPPING_CENTS` | The approved flat rate in cents, or `0` for free shipping |
   | `FERNVOW_FREE_SHIPPING_MINIMUM_CENTS` | Optional merchandise subtotal in cents that qualifies for free shipping |
   | `STRIPE_ACCOUNT_ID` | Fernvow’s live merchant account ID from Stripe |
   | `STRIPE_SECRET_KEY` | A live Stripe key. If restricted, allow account reads and Checkout Session writes and reads |
   | `STRIPE_WEBHOOK_SECRET` | The live endpoint’s signing secret |

4. Confirm that a single product and The Daily Duo show the correct total in Stripe Checkout, including shipping and tax. Check Apple Pay with an eligible Apple Wallet device and Google Pay with an eligible Google Wallet device. Use an owner-authorized order to verify the return page, webhook delivery, order record, receipt, fulfillment and refund.
5. Reconcile and ship from verified paid orders in Stripe. Checkout stores the order reference, totals, and Selfnamed SKU quantities on the Stripe session. It also stores the order reference and SKU quantities on the payment. The webhook verifies payment and marks the Stripe session. For The Daily Duo, Stripe charges the bundle price and the metadata lists both SKUs. Retrieve shipping details in Stripe and submit those orders to Selfnamed manually. [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment)

## PayPal

PayPal requires a separate PayPal Business account for Fernvow. Stripe’s built-in PayPal option is unavailable for US merchants. A separate PayPal Orders integration needs the merchant’s live credentials, destination-based shipping and tax, and capture and reconciliation against Fernvow’s order records. [Stripe PayPal eligibility](https://support.stripe.com/questions/paypal-payment-method-availability), [PayPal merchant API setup](https://developer.paypal.com/api/rest/)
