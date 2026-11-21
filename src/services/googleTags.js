import { consentAllows } from './cookieConsent.js';

const containerId = 'GTM-5VF96GZH';
let loaded = false;

export function syncGoogleTags() {
  const analytics = consentAllows('analytics');
  const advertising = consentAllows('advertising');
  if (!loaded && !analytics) return false;

  const consent = {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: advertising ? 'granted' : 'denied',
    ad_user_data: advertising ? 'granted' : 'denied',
    ad_personalization: advertising ? 'granted' : 'denied',
  };

  if (loaded) {
    window.gtag('consent', 'update', consent);
    return !analytics;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', consent);
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.append(tag);
  loaded = true;
  return false;
}
