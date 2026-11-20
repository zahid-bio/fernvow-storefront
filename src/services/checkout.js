const pendingCartKey = 'fernvow_checkout_cart';
let checkoutAttempt;

export async function isCheckoutEnabled() {
  try {
    const response = await fetch('/api/checkout/methods', { cache: 'no-store' });
    return response.ok && (await response.json()).enabled === true;
  } catch {
    return false;
  }
}

async function checkoutRequest(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.message);
    error.name = 'CheckoutError';
    error.status = response.status;
    throw error;
  }
  return payload;
}

function checkoutItems(cart) {
  return cart.items.map(({ slug, quantity }) => ({ slug, quantity })).sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function beginCheckout(cart) {
  const items = checkoutItems(cart);
  const subtotalCents = Math.round(cart.subtotal * 100);
  const fingerprint = JSON.stringify({ items, subtotalCents });
  if (checkoutAttempt?.fingerprint !== fingerprint) {
    checkoutAttempt = { fingerprint, reference: crypto.randomUUID().replaceAll('-', '') };
  }
  const attempt = checkoutAttempt;
  try {
    return await checkoutRequest('/api/checkout', { items, subtotalCents, reference: attempt.reference });
  } catch (error) {
    if (error.status === 409 && checkoutAttempt === attempt) checkoutAttempt = null;
    throw error;
  }
}

export function rememberCheckout(reference, cart) {
  try {
    sessionStorage.setItem(pendingCartKey, JSON.stringify({ reference, items: checkoutItems(cart) }));
  } catch {
    // Confirmation remains available without session storage.
  }
}

export async function getCheckoutResult({ reference, sessionId }, commerce) {
  const result = await checkoutRequest('/api/checkout/status', { reference, sessionId });
  if (result.status === 'paid') {
    try {
      const saved = JSON.parse(sessionStorage.getItem(pendingCartKey));
      if (saved?.reference === reference) {
        sessionStorage.removeItem(pendingCartKey);
        if (JSON.stringify(saved.items) === JSON.stringify(checkoutItems(commerce.getCart()))) {
          commerce.clearCart();
        }
      }
    } catch {
      // Leave the bag alone when the original checkout snapshot is unavailable.
    }
  }
  return result;
}
