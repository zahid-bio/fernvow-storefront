# Fernvow

A skincare storefront with a six-category catalog, product details, photo galleries and a persistent shopping bag.

## Run locally

```bash
python3 scripts/build_static.py
python3 scripts/dev_server.py
```

Use Python 3 and Node.js 22 or newer. Open [the local storefront](http://127.0.0.1:4173). Set `PORT=8080` to select a different port. The build writes the public pages and sitemap to `dist/`. Vercel serves those pages and routes checkout through Python functions. Existing hash links resolve to the public product URLs, while private checkout returns continue to use fragments.

## Storefront files

- Product descriptions and display prices live in `src/data/catalog.js`.
- The homepage, product pages and routine guide live in `src/views/`.
- The shopping bag lives in `src/components/cartDrawer.js` and `src/services/commerce.js`. Checkout and authoritative prices live in `scripts/checkout.py`.
- [Product media](docs/product-media.md) documents the TRELLIS.2 and Blender pipeline and the prompts for the six collection images.

## Checkout

The default configuration runs in preview mode and saves the bag in the visitor’s browser. Stripe Checkout handles payments after the live account and server are configured. See the [payment setup guide](docs/payments-setup.md).

## Cookie preferences

Use `consentAllows('analytics')` or `consentAllows('advertising')` from `src/services/cookieConsent.js` before loading a measurement tag or sending an event. Saved choices override regional defaults. `/api/privacy` uses Vercel's country header for the U.S. default and checks the browser's Global Privacy Control header. Optional tags require opt-in when the country is outside the U.S. or unknown. If adding a tag inside Google Tag Manager, configure its consent checks there as well. Keep checkout receipt URLs outside measurement.
