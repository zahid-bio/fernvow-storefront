/**
 * Fernvow Commerce Client
 *
 * Dual-mode commerce layer:
 * - 'preview': localStorage-persisted sample cart + deterministic two-SKU
 *   Selfnamed fulfillment expansion + actionable live-launch blocker report.
 * - 'shopify': executes Shopify Storefront GraphQL `cartCreate` mutation
 *   and returns the live `checkoutUrl`.
 */

import { STOREFRONT_CONFIG } from '../../config/storefront.config.js';
import { getProductBySlug } from '../data/catalog.js';

const DEFAULT_STORAGE_KEY = 'fernvow_preview_cart_v1';

const CART_CREATE_MUTATION = `
  mutation fernvowCartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function isPlaceholderGid(gid) {
  return !gid || typeof gid !== 'string' || gid.includes('PENDING_');
}

function safeReadStorage(storageKey) {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
    return rows
      .filter((row) => row && typeof row.slug === 'string' && getProductBySlug(row.slug))
      .map((row) => ({
        slug: row.slug,
        quantity: Math.max(1, Math.floor(Number(row.quantity) || 1)),
      }));
  } catch {
    return [];
  }
}

function safeWriteStorage(storageKey, entries) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify({ items: entries }));
  } catch {
    // Ignore storage quota or restricted-mode errors in preview.
  }
}

/**
 * Expand cart items into individual Selfnamed fulfillment SKUs,
 * aggregating duplicate SKUs cleanly across singles and The Daily Duo.
 * @param {Array<{slug: string, quantity: number, product: object}>} items
 */
function buildFulfillmentLines(items) {
  const bySku = new Map();

  const appendSku = (supplierSku, name, size, quantity, sourceItemSlug) => {
    const existing = bySku.get(supplierSku);
    if (existing) {
      existing.quantity += quantity;
      if (!existing._sources.includes(sourceItemSlug)) {
        existing._sources.push(sourceItemSlug);
        existing.sourceItemSlug = existing._sources.join(', ');
      }
    } else {
      bySku.set(supplierSku, {
        supplierSku,
        name,
        size,
        quantity,
        sourceItemSlug,
        _sources: [sourceItemSlug],
      });
    }
  };

  for (const item of items) {
    const { product, quantity } = item;
    if (product.isBundle && Array.isArray(product.bundleComponents)) {
      for (const component of product.bundleComponents) {
        appendSku(
          component.supplierSku,
          component.name,
          component.size,
          component.quantity * quantity,
          product.slug
        );
      }
    } else {
      appendSku(
        product.supplierSku,
        product.name,
        product.sizeDisplay,
        quantity,
        product.slug
      );
    }
  }

  return Array.from(bySku.values()).map(({ _sources, ...line }) => line);
}

/**
 * Map cart items to Shopify Storefront `CartLineInput` lines.
 * Supports either native Shopify Bundle variant or clean two-SKU expansion.
 */
function buildShopifyLines(items, config) {
  const bundleStrategy = config?.fulfillment?.bundleStrategy || 'two-sku-expansion';
  const nativeBundleVariantId = config?.fulfillment?.nativeBundleVariantId || '';
  const mergedLines = new Map();

  const addLine = (merchandiseId, quantity, label) => {
    const existing = mergedLines.get(merchandiseId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      mergedLines.set(merchandiseId, { merchandiseId, quantity, label });
    }
  };

  for (const item of items) {
    const { product, quantity } = item;
    if (product.isBundle && Array.isArray(product.bundleComponents)) {
      const configuredBundleGid =
        nativeBundleVariantId ||
        (!isPlaceholderGid(product.shopifyVariantPlaceholderId)
          ? product.shopifyVariantPlaceholderId
          : '');

      if (bundleStrategy === 'native-shopify-bundle' && configuredBundleGid) {
        addLine(configuredBundleGid, quantity, product.name);
      } else if (bundleStrategy === 'native-shopify-bundle') {
        addLine(product.shopifyVariantPlaceholderId, quantity, product.name);
      } else {
        for (const component of product.bundleComponents) {
          const componentProduct = getProductBySlug(component.productSlug);
          const componentGid =
            componentProduct?.shopifyVariantPlaceholderId ||
            `gid://shopify/ProductVariant/PENDING_${component.supplierSku}`;
          addLine(componentGid, component.quantity * quantity, component.name);
        }
      }
    } else {
      addLine(product.shopifyVariantPlaceholderId, quantity, product.name);
    }
  }

  return Array.from(mergedLines.values());
}

/**
 * Create a reactive Fernvow commerce client.
 * @param {object} [config=STOREFRONT_CONFIG]
 */
export function createCommerceClient(config = STOREFRONT_CONFIG) {
  const storageKey = config?.preview?.cartStorageKey || DEFAULT_STORAGE_KEY;
  let entries = safeReadStorage(storageKey);
  const listeners = new Set();

  const getMode = () => (config?.mode === 'shopify' ? 'shopify' : 'preview');

  const getCart = () => {
    const items = [];
    let itemCount = 0;
    let subtotal = 0;
    let compareAtSubtotal = 0;

    for (const entry of entries) {
      const product = getProductBySlug(entry.slug);
      if (!product) continue;
      const quantity = Math.max(1, Math.floor(Number(entry.quantity) || 1));
      const lineTotal = roundMoney(product.price * quantity);
      const lineCompareAt = roundMoney((product.compareAtPrice || product.price) * quantity);

      items.push({
        slug: product.slug,
        quantity,
        product,
        lineTotal,
      });

      itemCount += quantity;
      subtotal = roundMoney(subtotal + lineTotal);
      compareAtSubtotal = roundMoney(compareAtSubtotal + lineCompareAt);
    }

    const fulfillmentLines = buildFulfillmentLines(items);
    const totalUnits = fulfillmentLines.reduce((sum, line) => sum + line.quantity, 0);
    const bundleSavings = roundMoney(Math.max(0, compareAtSubtotal - subtotal));

    return {
      items,
      itemCount,
      totalUnits,
      subtotal,
      compareAtSubtotal,
      bundleSavings,
      fulfillmentLines,
    };
  };

  const notify = () => {
    const snapshot = getCart();
    for (const listener of listeners) {
      try {
        listener(snapshot);
      } catch {
        // Keep other subscribers unaffected if one listener throws.
      }
    }
    return snapshot;
  };

  const commit = (nextEntries) => {
    entries = nextEntries;
    safeWriteStorage(storageKey, entries);
    return notify();
  };

  const addItem = (slug, quantity = 1) => {
    const product = getProductBySlug(slug);
    const qty = Math.floor(Number(quantity));
    if (!product || !Number.isFinite(qty) || qty <= 0) {
      return getCart();
    }

    const next = entries.map((entry) => ({ ...entry }));
    const existing = next.find((entry) => entry.slug === product.slug);
    if (existing) {
      existing.quantity += qty;
    } else {
      next.push({ slug: product.slug, quantity: qty });
    }
    return commit(next);
  };

  const updateQuantity = (slug, quantity) => {
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      return removeItem(slug);
    }
    const product = getProductBySlug(slug);
    if (!product) return getCart();

    const exists = entries.some((entry) => entry.slug === slug);
    if (!exists) {
      return addItem(slug, qty);
    }

    const next = entries.map((entry) =>
      entry.slug === slug ? { ...entry, quantity: qty } : { ...entry }
    );
    return commit(next);
  };

  const removeItem = (slug) => {
    const next = entries.filter((entry) => entry.slug !== slug);
    return commit(next);
  };

  const clearCart = () => commit([]);

  const subscribe = (listener) => {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const prepareCheckout = async () => {
    const cart = getCart();
    const mode = getMode();
    const shopifyLines = buildShopifyLines(cart.items, config);

    const summary = {
      itemCount: cart.itemCount,
      totalUnits: cart.totalUnits,
      subtotal: cart.subtotal,
      compareAtSubtotal: cart.compareAtSubtotal,
      bundleSavings: cart.bundleSavings,
      currency: config?.currency || 'USD',
    };

    const fulfillmentPayload = {
      partner: config?.fulfillment?.partner || 'Selfnamed',
      originRegion: config?.fulfillment?.originRegion || 'Charlotte, NC, USA',
      bundleStrategy: config?.fulfillment?.bundleStrategy || 'two-sku-expansion',
      market: config?.market || 'US',
      currency: config?.currency || 'USD',
      totalUnits: cart.totalUnits,
      lines: cart.fulfillmentLines,
      shopifyLines: shopifyLines.map(({ merchandiseId, quantity }) => ({
        merchandiseId,
        quantity,
      })),
    };

    if (mode === 'preview') {
      const blockers = [];
      if (cart.items.length === 0) {
        blockers.push('Your bag is currently empty — add at least one product to preview checkout.');
      }
      blockers.push(
        'Storefront is running in Preview Mode (`STOREFRONT_CONFIG.mode === "preview"`).',
        'Connect a Shopify store domain and public Storefront API access token in `config/storefront.config.js`.',
        'Install the Selfnamed Shopify app, connect SKUs A5852, S0001, and A5805, and replace all `PENDING_*` ProductVariant GIDs in `src/data/catalog.js`.',
        'Configure The Daily Duo using native Shopify Bundles (recommended) or an automatic two-SKU discount (avoid unsupported 3rd-party bundle apps).',
        'Confirm US shipping rates, legal policies, and MoCRA Responsible Person label details, then switch `mode` to `"shopify"`.'
      );

      return {
        mode: 'preview',
        isLive: false,
        checkoutUrl: null,
        fulfillmentPayload,
        summary,
        blockers,
      };
    }

    // Live Shopify Storefront GraphQL mode
    const blockers = [];
    const storeDomain = (config?.shopify?.storeDomain || '').trim();
    const accessToken = (config?.shopify?.storefrontAccessToken || '').trim();
    const apiVersion = (config?.shopify?.apiVersion || '2026-01').trim();

    if (cart.items.length === 0) {
      blockers.push('Your bag is empty — add at least one item before starting checkout.');
    }
    if (!storeDomain) {
      blockers.push('Missing `shopify.storeDomain` in `config/storefront.config.js`.');
    }
    if (!accessToken) {
      blockers.push('Missing `shopify.storefrontAccessToken` in `config/storefront.config.js`.');
    }

    const unresolvedLines = shopifyLines.filter((line) => isPlaceholderGid(line.merchandiseId));
    if (unresolvedLines.length > 0) {
      blockers.push(
        `Placeholder Shopify ProductVariant GIDs remain for: ${unresolvedLines
          .map((line) => line.label)
          .join(', ')}.`
      );
    }

    if (blockers.length > 0) {
      return {
        mode: 'shopify',
        isLive: false,
        checkoutUrl: null,
        fulfillmentPayload,
        summary,
        blockers,
      };
    }

    if (typeof fetch !== 'function') {
      return {
        mode: 'shopify',
        isLive: false,
        checkoutUrl: null,
        fulfillmentPayload,
        summary,
        blockers: ['Global `fetch` is unavailable in the current runtime environment.'],
      };
    }

    const endpoint = `https://${storeDomain}/api/${apiVersion}/graphql.json`;
    const variables = {
      input: {
        lines: shopifyLines.map(({ merchandiseId, quantity }) => ({
          merchandiseId,
          quantity,
        })),
        buyerIdentity: {
          countryCode: config?.shopify?.country || 'US',
        },
      },
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': accessToken,
        },
        body: JSON.stringify({
          query: CART_CREATE_MUTATION,
          variables,
        }),
      });

      if (!response.ok) {
        return {
          mode: 'shopify',
          isLive: false,
          checkoutUrl: null,
          fulfillmentPayload,
          summary,
          blockers: [`Shopify Storefront API returned HTTP ${response.status}.`],
        };
      }

      const payload = await response.json();
      if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
        return {
          mode: 'shopify',
          isLive: false,
          checkoutUrl: null,
          fulfillmentPayload,
          summary,
          blockers: payload.errors.map((err) => err.message || 'Unknown Shopify GraphQL error'),
        };
      }

      const cartResult = payload?.data?.cartCreate;
      const userErrors = cartResult?.userErrors || [];
      if (userErrors.length > 0) {
        return {
          mode: 'shopify',
          isLive: false,
          checkoutUrl: null,
          fulfillmentPayload,
          summary,
          blockers: userErrors.map((err) => err.message || 'Shopify cartCreate error'),
        };
      }

      const checkoutUrl = cartResult?.cart?.checkoutUrl || null;
      if (!checkoutUrl) {
        return {
          mode: 'shopify',
          isLive: false,
          checkoutUrl: null,
          fulfillmentPayload,
          summary,
          blockers: ['Shopify cartCreate succeeded without returning a checkoutUrl.'],
        };
      }

      return {
        mode: 'shopify',
        isLive: true,
        cartId: cartResult.cart.id,
        checkoutUrl,
        fulfillmentPayload,
        summary,
        blockers: [],
      };
    } catch (error) {
      return {
        mode: 'shopify',
        isLive: false,
        checkoutUrl: null,
        fulfillmentPayload,
        summary,
        blockers: [error?.message || 'Network failure while contacting Shopify Storefront API.'],
      };
    }
  };

  return {
    getMode,
    getCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subscribe,
    prepareCheckout,
  };
}
