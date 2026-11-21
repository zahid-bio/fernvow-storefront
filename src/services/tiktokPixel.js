import { getProductBySlug } from '../data/catalog.js';
import { consentAllows } from './cookieConsent.js';

const pixelId = 'DC0DQJBC77U7MFIGUD5G';
const campaignKey = 'fernvow-tiktok-campaign';
const duoLaunchCampaign = 'us_daily_duo_launch';
const sdkUrl = 'https://analytics.tiktok.com/i18n/pixel/events.js';
let initialized = false;
let landedFromDuoAd;

export function getTikTokCampaign() {
  if (!consentAllows('advertising')) return null;
  if (landedFromDuoAd) return duoLaunchCampaign;
  try {
    return sessionStorage.getItem(campaignKey) === duoLaunchCampaign ? duoLaunchCampaign : null;
  } catch {
    return null;
  }
}

function loadPixel() {
  if (!consentAllows('advertising')) return null;
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

export function syncTikTokConsent(previouslyAllowed) {
  if (landedFromDuoAd === undefined) {
    const landing = new URLSearchParams(window.location.search);
    landedFromDuoAd = landing.get('utm_source') === 'tiktok' && landing.get('utm_campaign') === duoLaunchCampaign;
  }
  const allowed = consentAllows('advertising');
  try {
    if (!allowed && previouslyAllowed) sessionStorage.removeItem(campaignKey);
  } catch {
    // Storage may be disabled by the browser.
  }
  try {
    if (initialized && allowed !== previouslyAllowed) {
      if (allowed) window.ttq?.grantConsent();
      else window.ttq?.revokeConsent();
    }
  } catch {
    // A blocked SDK never interrupts the storefront.
  }
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
    if (landedFromDuoAd && consentAllows('advertising')) sessionStorage.setItem(campaignKey, duoLaunchCampaign);
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
