/** Persistent local shopping bag and Selfnamed SKU expansion. */

import { STOREFRONT_CONFIG } from '../../config/storefront.config.js';
import { getProductBySlug } from '../data/catalog.js';

const DEFAULT_STORAGE_KEY = 'fernvow_preview_cart_v1';
export const DAILY_DUO_OFFER = 'DUO995';

export function getShippingCents(shipping, items) {
  const weight = shipping && items.reduce((grams, { slug, quantity }) => grams + shipping.weightsGrams[slug] * quantity, 0);
  return shipping?.tiers.find(({ maxGrams }) => weight <= maxGrams)?.cents;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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
 * Create a reactive Fernvow commerce client.
 * @param {object} [config=STOREFRONT_CONFIG]
 */
export function createCommerceClient(config = STOREFRONT_CONFIG) {
  const storageKey = config?.cartStorageKey || DEFAULT_STORAGE_KEY;
  let entries = safeReadStorage(storageKey);
  const listeners = new Set();

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

  const applyDuoOffer = (code) => {
    if (code.trim().toUpperCase() !== DAILY_DUO_OFFER) return 'invalid';

    const duo = getProductBySlug('the-daily-duo');
    const quantities = new Map(entries.map(({ slug, quantity }) => [slug, quantity]));
    const existingDuos = quantities.get(duo.slug) || 0;
    const pairs = Math.min(20 - existingDuos, ...duo.bundleComponents.map(({ productSlug, quantity }) =>
      Math.floor((quantities.get(productSlug) || 0) / quantity)
    ));
    if (pairs <= 0) return existingDuos ? 'included' : 'missing';

    for (const { productSlug, quantity } of duo.bundleComponents) {
      quantities.set(productSlug, quantities.get(productSlug) - quantity * pairs);
    }
    quantities.set(duo.slug, existingDuos + pairs);
    commit([...quantities]
      .filter(([, quantity]) => quantity > 0)
      .map(([slug, quantity]) => ({ slug, quantity })));
    return 'applied';
  };

  const subscribe = (listener) => {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    getCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyDuoOffer,
    subscribe,
  };
}
