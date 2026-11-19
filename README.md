# Fernvow

A static skincare storefront with a six-category catalog, product details, photo galleries and a persistent shopping bag.

## Run locally

```bash
python3 scripts/dev_server.py
```

Open [the local storefront](http://127.0.0.1:4173). Set `PORT=8080` to select a different port. Any static host can serve the storefront with `index.html` at the site root. Navigation uses hash routes.

## Storefront files

- Product descriptions, retail prices and Shopify variant IDs live in `src/data/catalog.js`.
- The homepage, product pages and routine guide live in `src/views/`.
- The shopping bag and Shopify adapter live in `src/components/cartDrawer.js` and `src/services/commerce.js`.
- [Product media](docs/product-media.md) documents the TRELLIS.2 and Blender pipeline and the prompts for the six collection images.

## Checkout

The initial configuration runs in preview mode. The bag is saved in the visitor’s browser. To enable paid orders, connect the Selfnamed variants, set a Shopify domain and public Storefront API token in `config/storefront.config.js`, and switch `mode` to `shopify`. See the [Shopify setup guide](docs/shopify-selfnamed-setup.md) for bundle configuration and checkout verification.

The store sends shoppers directly to Shopify checkout after creating the cart. Keep Admin API credentials outside the storefront.
