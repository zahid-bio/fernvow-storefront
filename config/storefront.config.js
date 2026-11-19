/**
 * Fernvow Storefront Configuration
 *
 * Single configuration entry point for switching between local Preview Mode
 * (zero-backend static preview) and live Shopify Storefront GraphQL API mode.
 *
 * Never commit real private tokens or Admin API secrets to client-side files.
 */

export const STOREFRONT_CONFIG = {
  brandName: 'Fernvow',
  mode: 'preview', // 'preview' | 'shopify'
  currency: 'USD',
  locale: 'en-US',
  market: 'US',
  domainPending: 'fernvow.com',

  shopify: {
    // Example: 'fernvow.myshopify.com'
    storeDomain: '',
    // Public Storefront API access token (never an Admin API secret)
    storefrontAccessToken: '',
    apiVersion: '2026-01',
    country: 'US',
    language: 'EN',
  },

  fulfillment: {
    partner: 'Selfnamed',
    originRegion: 'Charlotte, NC, USA',
    // Selfnamed warns against unsupported 3rd-party Shopify bundle apps.
    // Model The Daily Duo cleanly via native Shopify Bundles or two-SKU expansion.
    bundleStrategy: 'two-sku-expansion', // 'native-shopify-bundle' | 'two-sku-expansion'
    nativeBundleVariantId: '',
  },

  preview: {
    cartStorageKey: 'fernvow_preview_cart_v1',
    statusLabel: 'Preview Mode · Sample Catalog & Draft Policies',
  },
};
