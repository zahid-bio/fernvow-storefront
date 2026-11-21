const preferencesKey = 'fernvow-cookie-preferences';
const noticeKey = 'fernvow-cookie-notice-seen';
const essentialOnly = { analytics: false, advertising: false };
const automaticChoices = { analytics: true, advertising: true };
let preferences = null;
let automatic = false;
let privacySignal = false;

export function isMeasurementPage() {
  const { hostname, pathname, hash, search } = window.location;
  const query = new URLSearchParams(search);
  return hostname === 'fernvow.com' && !/^\/checkout(?:\/|$)/.test(pathname)
    && !/^#\/checkout(?:\/|$)/.test(hash)
    && !['order', 'session_id', 'checkout'].some((key) => query.has(key));
}

function allowedChoices() {
  const choices = preferences ?? (automatic ? automaticChoices : essentialOnly);
  return {
    analytics: choices.analytics,
    advertising: choices.advertising && !privacySignal && navigator.globalPrivacyControl !== true,
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

async function regionalPrivacySettings() {
  try {
    const response = await fetch('/api/privacy', { cache: 'no-store', signal: AbortSignal.timeout(2500) });
    if (response.ok) return await response.json();
  } catch {
    // Keep optional tags off until a visitor chooses when their region is unknown.
  }
  return {};
}

export function bindCookiePreferences(onChange) {
  const panel = document.getElementById('cookie-preferences');
  const settings = panel.querySelector('details');
  const title = panel.querySelector('h2');
  const analytics = panel.querySelector('[name="analytics"]');
  const advertising = panel.querySelector('[name="advertising"]');
  const allowAll = panel.querySelector('[data-cookie-action="allow"]');
  const dismiss = panel.querySelector('[data-cookie-action="dismiss"]');
  const notice = panel.querySelector('[data-cookie-notice]');
  let trigger;
  let noticeSeen = false;
  let initialized = false;

  preferences = storedPreferences();
  try {
    noticeSeen = sessionStorage.getItem(noticeKey) === '1';
  } catch {
    // The notice can still be dismissed for this page.
  }

  const initialize = (settings) => {
    automatic = settings.automaticMeasurement === true;
    privacySignal = settings.globalPrivacyControl === true || navigator.globalPrivacyControl === true;
    advertising.disabled = privacySignal;
    if (privacySignal) allowAll.textContent = 'Allow analytics';
    if (automatic) {
      notice.textContent = 'We use cookies for analytics and advertising measurement. You can choose your settings or keep essential storage only.';
      allowAll.hidden = true;
      dismiss.hidden = false;
    }
    panel.hidden = Boolean(preferences) || (automatic && noticeSeen) || !isMeasurementPage();
    initialized = true;
    onChange(essentialOnly);
  };
  if (isMeasurementPage()) regionalPrivacySettings().then(initialize);
  else initialize({});

  document.addEventListener('click', (event) => {
    const control = event.target instanceof Element && event.target.closest('[data-cookie-preferences], [data-cookie-action]');
    if (!control || !initialized || window.location.hostname !== 'fernvow.com') return;

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
    if (action === 'dismiss') {
      noticeSeen = true;
      try { sessionStorage.setItem(noticeKey, '1'); } catch { /* Storage may be unavailable. */ }
    } else {
      preferences = {
        analytics: action === 'allow' || (action === 'save' && analytics.checked),
        advertising: !privacySignal && (action === 'allow' || (action === 'save' && advertising.checked)),
      };
      try { localStorage.setItem(preferencesKey, JSON.stringify(preferences)); } catch { /* Storage may be unavailable. */ }
    }
    panel.hidden = true;
    settings.open = false;
    if (trigger?.isConnected) trigger.focus();
    trigger = null;
    if (action !== 'dismiss') onChange(previous);
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !trigger) return;
    panel.hidden = true;
    settings.open = false;
    if (trigger.isConnected) trigger.focus();
    trigger = null;
  });

  window.addEventListener('storage', (event) => {
    if (!initialized || (event.key !== preferencesKey && event.key !== null)) return;
    const previous = allowedChoices();
    preferences = storedPreferences();
    panel.hidden = Boolean(preferences) || (automatic && noticeSeen) || !isMeasurementPage();
    onChange(previous);
  });
}
