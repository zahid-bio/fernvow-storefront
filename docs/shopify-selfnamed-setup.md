# Fernvow — Shopify & Selfnamed Integration Runbook

This runbook documents the exact steps to transition Fernvow from **Preview Mode** (`STOREFRONT_CONFIG.mode = 'preview'`) to live US commerce powered by **Shopify Storefront GraphQL API** and **Selfnamed** fulfillment.

---

## 1. Selfnamed Shopify App & Product Sync

1. **Install the Selfnamed App** from the Shopify App Store into your Shopify store (`your-store.myshopify.com`).
2. **Connect & Map the Three Core SKUs** in Selfnamed using your approved Fernvow print labels (once Selfnamed print dielines and MoCRA details are finalized):
   - `A5852` — **Daily Cleansing Foam** (`150 mL / 5.07 fl oz`) → Draft retail `$34.95 USD`
   - `S0001` — **Daily Face Moisturizer** (`50 mL / 1.69 fl oz`) → Draft retail `$39.95 USD`
   - `A5805` — **Hydrating Toner** (`200 mL / 6.76 fl oz`) → Draft retail `$29.95 USD`
3. **Verify SKU Integrity:** Ensure each synced Shopify product variant carries the matching Selfnamed SKU (`A5852`, `S0001`, `A5805`) and that inventory/fulfillment location is assigned to **Selfnamed**.
4. **Record Shopify ProductVariant GIDs:** From Shopify Admin / GraphQL Admin API, copy the real `gid://shopify/ProductVariant/...` IDs for each product and replace the `PENDING_*` placeholders in `src/data/catalog.js`.

---

## 2. Fulfillment Settings, Billing & Order Control

- **Billing Method in Selfnamed:** Add a valid payment method inside Selfnamed so fulfillment invoices clear promptly when orders are submitted.
- **Automatic vs. "Request Fulfilment" (Recommended at Launch):**
  - Selfnamed supports both **Automatic** order sync and manual **"Request Fulfilment"** per order.
  - **Recommendation:** Start in **"Request Fulfilment"** mode during soft launch / first live orders so you can verify SKU mapping, customer shipping addresses, and Daily Duo line expansion before switching to automatic fulfillment.
- **US Shipping Profiles (Shopify Admin → Settings → Shipping and delivery):**
  - Align the shipping origin/profile for Selfnamed-assigned products with Selfnamed's US fulfillment hub (**Charlotte, NC**).
  - Configure clear US flat-rate or threshold shipping rules that match what you publish in `src/data/policies.js` (`POLICIES.shipping`). Verify live rates and handling times inside the Selfnamed app before publishing shipping estimates.

---

## 3. Handling *The Daily Duo* (`A5852` + `S0001`) Safely

Selfnamed explicitly **warns against unsupported 3rd-party Shopify bundle apps** that alter order line items in ways their fulfillment webhook cannot parse.

Our commerce layer (`src/services/commerce.js`) models The Daily Duo (`$64.95` vs `$74.90`, saving `$9.95`) cleanly with two supported paths:

### Option A (Recommended for Live `$64.95` Bundle Checkout): Native Shopify Bundles / Cart Transform
1. Install Shopify's official **Shopify Bundles** app (free, native Cart Transform).
2. Create **The Daily Duo** product in Shopify composed of `1× A5852` + `1× S0001` priced at `$64.95 USD`.
3. Native Shopify Bundles expands the bundle automatically at checkout into the two constituent fulfillment SKUs (`A5852` + `S0001`) so Selfnamed receives exact individual SKUs.
4. Set `STOREFRONT_CONFIG.fulfillment.bundleStrategy = 'native-shopify-bundle'` and set `STOREFRONT_CONFIG.fulfillment.nativeBundleVariantId` (and `shopifyVariantPlaceholderId` in `src/data/catalog.js`) to the live Shopify Bundle variant GID.

### Option B (Fallback): Two-SKU Expansion + Automatic Shopify Bundle Discount
1. Keep `STOREFRONT_CONFIG.fulfillment.bundleStrategy = 'two-sku-expansion'`.
2. When a buyer checks out with **The Daily Duo**, `prepareCheckout()` expands the bundle into constituent lines (`1× A5852` + `1× S0001`) before calling `cartCreate`.
3. Configure an **Automatic Discount** (or Shopify Function) in Shopify Admin that applies `$9.95` off when both `A5852` and `S0001` are present in the cart so the checkout total matches `$64.95`.

---

## 4. Storefront GraphQL API Credentials

1. In Shopify Admin, go to **Settings → Apps and sales channels → Develop apps** (or Headless channel) and enable **Storefront API**.
2. Grant strictly the minimum required **Storefront API scopes**:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
   *(Never place a Shopify Admin API secret in client-side code or `config/storefront.config.js`!)*
3. Update `config/storefront.config.js`:
   - `shopify.storeDomain`: `'your-store.myshopify.com'`
   - `shopify.storefrontAccessToken`: `'<public-storefront-access-token>'`
   - `shopify.apiVersion`: `'2026-01'`
4. `src/services/commerce.js` automatically runs the Storefront GraphQL `cartCreate` mutation against `https://<storeDomain>/api/2026-01/graphql.json` and sends the shopper directly to `cart.checkoutUrl`.

---

## 5. Sandbox Test Checklist (Before Public Launch)

- [ ] **Preview Aggregation Check:** In Preview Mode, add `1× Daily Cleansing Foam` + `1× The Daily Duo` and verify Checkout Preview shows `A5852 × 2` and `S0001 × 1` (`3` total units, `$99.90` subtotal, `$9.95` savings).
- [ ] **Storefront API `cartCreate` Test:** Temporarily switch `mode` to `'shopify'` in a staging branch with real variant GIDs and verify `prepareCheckout()` returns a valid `https://.../cart/c/...` `checkoutUrl` with zero `userErrors`.
- [ ] **Shopify Bogus Gateway / Test Order:** Place a test order containing a single SKU (`A5805`) and a bundle (`The Daily Duo`), confirm `$9.95` bundle pricing applies, confirm US shipping rates calculate properly, and verify the order appears in Selfnamed under **Request Fulfilment** with exact SKUs `A5852` and `S0001`.
- [ ] **Domain & CORS Check:** Verify `fernvow.com` DNS points cleanly to your static host or Shopify custom domain, and test Storefront API calls from the live origin.

---

## 6. Live Launch Gate (Sign-Off Required Before `mode: 'shopify'`)

Do **not** switch `STOREFRONT_CONFIG.mode` to `'shopify'` until every item below is complete:
1. Legal entity name, US mailing address, support email (`fernvow.com`), and MoCRA Responsible Person label contact confirmed and updated in `src/data/policies.js` and final Selfnamed print files.
2. All `[PENDING OWNER CONFIRMATION]` tags removed from `src/data/policies.js` and replaced with approved Shipping, Returns, Privacy, Terms, and Contact copy.
3. Official Selfnamed print dielines approved for `A5852`, `S0001`, and `A5805`, and SVG preview placeholders updated with approved product photography/renders.
4. Any desired ECOCERT, vegan/allergen, or study wording formally licensed/verified (or kept excluded).
5. `STOREFRONT_CONFIG.mode` changed from `'preview'` to `'shopify'` and `.env.example` / deployment variables updated.
