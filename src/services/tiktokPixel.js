import { getProductBySlug } from '../data/catalog.js';

const pixelId = 'DC0DQJBC77U7MFIGUD5G';
const consentKey = 'fernvow-tiktok-measurement';
const campaignKey = 'fernvow-tiktok-campaign';
const duoLaunchCampaign = 'us_daily_duo_launch';
const sdkUrl = 'https://analytics.tiktok.com/i18n/pixel/events.js';
let preference;
let initialized = false;
let landedFromDuoAd = false;

function isPublicStorefront() {
  const { hostname, hash, search } = window.location;
  const params = new URLSearchParams(search);
  return hostname === 'fernvow.com' && !/^#\/checkout(?:\/|$)/.test(hash)
    && !params.has('order') && !params.has('session_id') && !params.has('checkout');
}

function canMeasure() {
  return isPublicStorefront() && navigator.globalPrivacyControl !== true && preference === 'allow';
}

export function getTikTokCampaign() {
  if (!canMeasure()) return null;
  if (landedFromDuoAd) return duoLaunchCampaign;
  try {
    return sessionStorage.getItem(campaignKey) === duoLaunchCampaign ? duoLaunchCampaign : null;
  } catch {
    return null;
  }
}

function loadPixel() {
  if (!canMeasure()) return null;
  if (initialized) return window.ttq;

  // Bootstrap the queue used by TikTok's manual installation snippet.
  window.TiktokAnalyticsObject = 'ttq';
  const ttq = window.ttq = window.ttq || [];
  ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias',
    'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
  ttq.setAndDefer = (queue, method) => {
    queue[method] = (...args) => queue.push([method, ...args]);
  };
  ttq.methods.forEach((method) => ttq.setAndDefer(ttq, method));
  ttq.instance = (id) => {
    const queue = ttq._i[id] || [];
    ttq.methods.forEach((method) => ttq.setAndDefer(queue, method));
    return queue;
  };
  ttq.load = (id, options = {}) => {
    ttq._i ||= {};
    ttq._t ||= {};
    ttq._o ||= {};
    ttq._i[id] = [];
    ttq._i[id]._u = sdkUrl;
    ttq._t[id] = Date.now();
    ttq._o[id] = options;
    const script = document.createElement('script');
    script.async = true;
    script.src = `${sdkUrl}?sdkid=${encodeURIComponent(id)}&lib=ttq`;
    document.head.append(script);
  };
  ttq.load(pixelId);
  ttq.grantConsent();
  initialized = true;
  return ttq;
}

export function bindTikTokPreferences(onAllow) {
  const panel = document.getElementById('tiktok-measurement');
  if (!panel || window.location.hostname !== 'fernvow.com') return;
  const landing = new URLSearchParams(window.location.search);
  landedFromDuoAd = landing.get('utm_source') === 'tiktok' && landing.get('utm_campaign') === duoLaunchCampaign;
  try {
    preference = localStorage.getItem(consentKey);
  } catch {
    // A visitor in a restricted browser can still make a choice for this page.
  }
  if (navigator.globalPrivacyControl === true) panel.querySelector('[data-tiktok-choice="allow"]').disabled = true;
  panel.hidden = Boolean(preference) || navigator.globalPrivacyControl === true || !isPublicStorefront();
  document.addEventListener('click', (event) => {
    const control = event.target instanceof Element && event.target.closest('[data-tiktok-choice], [data-tiktok-preferences]');
    if (!control || !isPublicStorefront()) return;
    if (control.hasAttribute('data-tiktok-preferences')) {
      panel.hidden = false;
      panel.querySelector('[data-tiktok-choice="decline"]').focus();
      return;
    }
    const previous = preference;
    preference = control.dataset.tiktokChoice === 'allow' && navigator.globalPrivacyControl !== true ? 'allow' : 'decline';
    try {
      localStorage.setItem(consentKey, preference);
    } catch {
      // Use the in-memory choice when browser storage is unavailable.
    }
    if (preference === 'decline') {
      try { sessionStorage.removeItem(campaignKey); } catch { /* Storage may be unavailable. */ }
    }
    panel.hidden = true;
    if (preference === previous) return;
    try {
      if (preference === 'allow') {
        if (initialized) window.ttq?.grantConsent();
        onAllow();
      } else {
        window.ttq?.revokeConsent();
      }
    } catch {
      // The storefront remains usable if an extension blocks the SDK.
    }
  });
}

export function trackTikTok(event, items, value) {
  try {
    loadPixel()?.track(event, {
      content_type: 'product',
      contents: items.map(({ product, quantity }) => ({
        content_id: product.slug,
        content_name: product.name,
        quantity,
        price: product.price,
      })),
      value: Math.round(value * 100) / 100,
      currency: 'USD',
    });
  } catch {
    // Tracking never interrupts product browsing or checkout.
  }
}

export function trackTikTokView(route) {
  if (route.name === 'checkout') return;
  try {
    if (landedFromDuoAd && canMeasure()) sessionStorage.setItem(campaignKey, duoLaunchCampaign);
  } catch {
    // The current-page campaign is still available without session storage.
  }
  try {
    loadPixel()?.page();
    const product = route.name === 'product' && getProductBySlug(route.slug);
    if (product) trackTikTok('ViewContent', [{ product, quantity: 1 }], product.price);
  } catch {
    // Tracking never interrupts navigation.
  }
}
