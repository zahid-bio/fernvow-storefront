const preferencesKey = 'fernvow-cookie-preferences';
const essentialOnly = { analytics: false, advertising: false };
let preferences = null;

export function isMeasurementPage() {
  const { hostname, pathname, hash, search } = window.location;
  const query = new URLSearchParams(search);
  return hostname === 'fernvow.com' && !/^\/checkout(?:\/|$)/.test(pathname)
    && !/^#\/checkout(?:\/|$)/.test(hash)
    && !['order', 'session_id', 'checkout'].some((key) => query.has(key));
}

function allowedChoices() {
  return {
    analytics: preferences?.analytics === true,
    advertising: preferences?.advertising === true && navigator.globalPrivacyControl !== true,
  };
}

export function consentAllows(category) {
  return isMeasurementPage() && allowedChoices()[category] === true;
}

function storedPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey));
    if (typeof saved?.analytics === 'boolean' && typeof saved.advertising === 'boolean') return saved;

    // The earlier prompt only covered TikTok advertising measurement.
    const legacy = localStorage.getItem('fernvow-tiktok-measurement');
    if (legacy === 'allow' || legacy === 'decline') return { analytics: false, advertising: legacy === 'allow' };
  } catch {
    // A visitor can still choose for this page without persistent storage.
  }
  return null;
}

export function bindCookiePreferences(onChange) {
  const panel = document.getElementById('cookie-preferences');
  const settings = panel.querySelector('details');
  const title = panel.querySelector('h2');
  const analytics = panel.querySelector('[name="analytics"]');
  const advertising = panel.querySelector('[name="advertising"]');
  const allowAll = panel.querySelector('[data-cookie-action="allow"]');
  const globalPrivacyControl = navigator.globalPrivacyControl === true;
  let trigger;

  advertising.disabled = globalPrivacyControl;
  if (globalPrivacyControl) allowAll.textContent = 'Allow analytics';
  preferences = storedPreferences();
  panel.hidden = Boolean(preferences) || !isMeasurementPage();
  onChange(essentialOnly);

  document.addEventListener('click', (event) => {
    const control = event.target instanceof Element && event.target.closest('[data-cookie-preferences], [data-cookie-action]');
    if (!control || window.location.hostname !== 'fernvow.com') return;

    const previous = allowedChoices();
    if (control.hasAttribute('data-cookie-preferences')) {
      trigger = control;
      analytics.checked = previous.analytics;
      advertising.checked = previous.advertising;
      settings.open = true;
      panel.hidden = false;
      title.focus();
      return;
    }

    const action = control.dataset.cookieAction;
    preferences = {
      analytics: action === 'allow' || (action === 'save' && analytics.checked),
      advertising: !globalPrivacyControl && (action === 'allow' || (action === 'save' && advertising.checked)),
    };
    try {
      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    } catch {
      // Use the in-memory preferences when browser storage is unavailable.
    }
    panel.hidden = true;
    settings.open = false;
    if (trigger?.isConnected) trigger.focus();
    trigger = null;
    onChange(previous);
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !trigger) return;
    panel.hidden = true;
    settings.open = false;
    if (trigger.isConnected) trigger.focus();
    trigger = null;
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== preferencesKey && event.key !== null) return;
    const previous = allowedChoices();
    preferences = storedPreferences();
    panel.hidden = Boolean(preferences) || !isMeasurementPage();
    onChange(previous);
  });
}
