# Fernvow

A skincare storefront with a six-category catalog, product details, photo galleries and a persistent shopping bag.

## Run locally

```bash
python3 scripts/dev_server.py
```

Open [the local storefront](http://127.0.0.1:4173). Set `PORT=8080` to select a different port. The Vercel configuration builds the public storefront in `dist/` and serves the checkout through Python functions. Navigation uses hash routes.

## Storefront files

- Product descriptions and display prices live in `src/data/catalog.js`.
- The homepage, product pages and routine guide live in `src/views/`.
- The shopping bag lives in `src/components/cartDrawer.js` and `src/services/commerce.js`. Checkout and authoritative prices live in `scripts/checkout.py`.
- [Product media](docs/product-media.md) documents the TRELLIS.2 and Blender pipeline and the prompts for the six collection images.

## Checkout

The default configuration runs in preview mode and saves the bag in the visitor’s browser. Stripe Checkout handles payments after the live account and server are configured. See the [payment setup guide](docs/payments-setup.md).
