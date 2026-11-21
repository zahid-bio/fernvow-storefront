import { formatMoney, getProductBySlug } from './data/catalog.js';
import { getPageMetadata, getPageTags, SITE_ORIGIN } from './data/seo.js';
import { createCommerceClient } from './services/commerce.js';
import { beginCheckout, getCheckoutResult, getCheckoutSettings, rememberCheckout } from './services/checkout.js';
import { bindCookiePreferences, consentAllows } from './services/cookieConsent.js';
import { syncGoogleTags } from './services/googleTags.js';
import { syncTikTokConsent, trackTikTok, trackTikTokView } from './services/tiktokPixel.js';
import {
  renderHeader,
  renderMobileMenu,
} from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderCartDrawer } from './components/cartDrawer.js';
import { renderSearchModal, renderSearchResults } from './components/searchModal.js';
import {
  filterAndSortProducts,
  formatProductCount,
  getAdjacentCollection,
  renderHomeCatalogGrid,
  renderHomeView,
} from './views/homeView.js';
import { getPdpMediaOptions, renderPdpMedia, renderProductView } from './views/productView.js';
import { renderRoutineView } from './views/routineView.js';
import { renderBrandView } from './views/brandView.js';
import { renderPoliciesView } from './views/policiesView.js';
import { renderCheckoutResultView } from './views/checkoutResultView.js';

const commerce = createCommerceClient();
const returnParams = new URLSearchParams(window.location.search);
const orderReference = returnParams.get('order');
const checkoutSession = returnParams.get('session_id');
const checkoutSessionPattern = /^cs_live_[A-Za-z0-9_]{16,248}$/;
if (/^[a-f0-9]{32}$/.test(orderReference || '') && checkoutSessionPattern.test(checkoutSession || '')) {
  window.history.replaceState(null, '', `/#/checkout/${orderReference}/${checkoutSession}`);
} else if (returnParams.get('checkout') === 'cancelled') {
  window.history.replaceState(null, '', '/#/checkout/cancelled');
}

const state = {
  route: readRoute(),
  cart: commerce.getCart(),
  activeFilter: 'all',
  sortBy: 'featured',
  pdpQty: 1,
  isCartOpen: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  checkoutMessage: '',
  checkoutEnabled: false,
  shipping: null,
  checkoutResult: { status: 'loading' },
};

let lastTrigger = null;
let checkoutRequest = null;
let disconnectCollectionObserver;

function parsePath(path, allowCheckout = false) {
  const decode = (segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  };
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { name: 'home' };
  }
  if (parts[0] === 'product' && parts[1]) {
    return { name: 'product', slug: decode(parts[1]) };
  }
  if (allowCheckout && parts[0] === 'checkout') {
    if (parts[1] === 'cancelled') return { name: 'checkout', reference: 'cancelled' };
    if (/^[a-f0-9]{32}$/.test(parts[1] || '') && checkoutSessionPattern.test(parts[2] || '')) {
      return { name: 'checkout', reference: parts[1], sessionId: parts[2] };
    }
  }
  if (parts[0] === 'routine') {
    return { name: 'routine' };
  }
  if (parts[0] === 'philosophy' || parts[0] === 'brand') {
    return { name: parts[0] };
  }
  if (parts[0] === 'policies') {
    return { name: 'policies', section: parts[1] ? decode(parts[1]) : 'shipping' };
  }
  return { name: 'home' };
}

function readRoute() {
  const { pathname, hash, search } = window.location;
  if (pathname === '/' && hash.startsWith('#/')) {
    const route = parsePath(hash.slice(1), true);
    const page = getPageMetadata(route);
    if (!page.noindex) window.history.replaceState(null, '', page.path + search);
    return route;
  }
  return parsePath(pathname.replace(/\/index\.html$/, '/'));
}

function updateDocumentMetadata(route) {
  const page = getPageMetadata(route);
  document.title = page.title;
  document.querySelector('link[rel="canonical"]').href = SITE_ORIGIN + page.path;
  for (const [key, value] of Object.entries(getPageTags(page))) {
    const attribute = key.startsWith('og:') ? 'property' : 'name';
    document.querySelector(`meta[${attribute}="${key}"]`).content = value;
  }
  document.getElementById('product-structured-data').textContent = JSON.stringify(page.structuredData || {});
}

function announce(message) {
  const el = document.getElementById('live-announcer');
  if (!el) return;
  el.textContent = '';
  window.requestAnimationFrame(() => {
    el.textContent = message;
  });
}

function updateHeaderCounts() {
  const count = state.cart?.itemCount || 0;
  const countEl = document.getElementById('header-bag-count');
  if (countEl) {
    countEl.textContent = String(count);
  }
  const bagBtn = document.querySelector('.header-bag-btn');
  if (bagBtn) {
    bagBtn.setAttribute(
      'aria-label',
      `Open shopping bag (${count} ${count === 1 ? 'item' : 'items'})`
    );
  }
  const menuBtn = document.querySelector('[data-action="toggle-mobile-menu"]');
  if (menuBtn) {
    menuBtn.setAttribute('aria-expanded', state.isMobileMenuOpen ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', state.isMobileMenuOpen ? 'Close menu' : 'Open menu');
  }
}

function updateQuickCheckout() {
  const button = document.getElementById('quick-checkout');
  if (!button) return;
  button.hidden = !state.checkoutEnabled || !state.cart.itemCount || state.route.name === 'checkout';
  button.setAttribute('aria-disabled', String(Boolean(checkoutRequest)));
  button.textContent = checkoutRequest ? 'Opening checkout…' : `Checkout · ${formatMoney(state.cart.subtotal)}`;
}

function renderOverlays(animateIn = true) {
  const overlayRoot = document.getElementById('overlay-root');
  if (!overlayRoot) return;

  const html = [
    renderMobileMenu({ isOpen: state.isMobileMenuOpen, route: state.route }),
    renderCartDrawer({
      isOpen: state.isCartOpen,
      cart: state.cart,
      isCheckingOut: Boolean(checkoutRequest),
      checkoutMessage: state.checkoutMessage,
      checkoutEnabled: state.checkoutEnabled,
      shipping: state.shipping,
    }),
    renderSearchModal({ isOpen: state.isSearchOpen, query: state.searchQuery }),
  ]
    .filter(Boolean)
    .join('');

  overlayRoot.innerHTML = html;
  document.documentElement.classList.toggle('has-dialog', Boolean(html));
  updateQuickCheckout();
  for (const id of ['header-root', 'quick-checkout', 'main-content', 'footer-root']) {
    const region = document.getElementById(id);
    if (region) region.inert = Boolean(html);
  }

  const overlayEls = overlayRoot.querySelectorAll(
    '.overlay-backdrop, .overlay-drawer, .overlay-modal'
  );
  if (overlayEls.length === 0) return;

  if (!animateIn) {
    overlayEls.forEach((el) => el.classList.add('is-open'));
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      overlayEls.forEach((el) => el.classList.add('is-open'));
    });
  });
}

function renderActiveViewHtml() {
  switch (state.route.name) {
    case 'product':
      return renderProductView({
        slug: state.route.slug,
        qty: state.pdpQty,
      });
    case 'routine':
      return renderRoutineView();
    case 'philosophy':
    case 'brand':
      return renderBrandView();
    case 'policies':
      return renderPoliciesView({
        section: state.route.section,
        checkoutEnabled: state.checkoutEnabled,
      });
    case 'checkout':
      return renderCheckoutResultView(state.route.reference === 'cancelled'
        ? { status: 'cancelled' }
        : { ...state.checkoutResult, reference: state.route.reference });
    case 'home':
    default:
      return renderHomeView({
        activeFilter: state.activeFilter,
        sortBy: state.sortBy,
      });
  }
}

function renderRoute() {
  const headerRoot = document.getElementById('header-root');
  const mainEl = document.getElementById('main-content');
  const footerRoot = document.getElementById('footer-root');
  if (!headerRoot || !mainEl || !footerRoot) return;

  updateDocumentMetadata(state.route);

  headerRoot.innerHTML = renderHeader({
    route: state.route,
    cart: state.cart,
    isMobileMenuOpen: state.isMobileMenuOpen,
  });

  disconnectCollectionObserver?.();
  mainEl.innerHTML = renderActiveViewHtml();
  const explorer = mainEl.querySelector('[data-collection-explorer]');
  disconnectCollectionObserver = explorer ? bindCollectionControls(explorer) : null;

  footerRoot.innerHTML = renderFooter();

  renderOverlays(false);
}

function closeAllOverlays({ restoreFocus = true } = {}) {
  const hadOverlay = state.isCartOpen || state.isMobileMenuOpen || state.isSearchOpen;
  state.isCartOpen = false;
  state.isMobileMenuOpen = false;
  state.isSearchOpen = false;
  state.checkoutMessage = '';
  checkoutRequest = null;

  if (hadOverlay) {
    updateHeaderCounts();
    renderOverlays(false);
    if (restoreFocus) {
      const target = lastTrigger?.isConnected && !lastTrigger.hidden
        ? lastTrigger
        : document.querySelector('[data-action="open-cart"]');
      target?.focus();
    }
    lastTrigger = null;
  }
}

function focusElementSoon(selector) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) {
        el.focus();
      }
    });
  });
}

function updateCatalogInPlace() {
  const slot = document.getElementById('catalog-grid-slot');
  if (!slot) return;
  const products = filterAndSortProducts(state.activeFilter, state.sortBy);
  slot.innerHTML = renderHomeCatalogGrid(products);
  document.querySelector('[data-collection-count]').textContent = formatProductCount(products.length);
  return products.length;
}

function syncCategoryTicker(explorer, animate = false) {
  const track = explorer.querySelector('.cat-ticker__track');
  const selected = track.querySelector('[aria-selected="true"]');
  track.classList.toggle('is-sliding', animate);
  track.style.setProperty('--ticker-offset', `${-(selected.offsetLeft + selected.offsetWidth / 2)}px`);
}

function selectCollection(id) {
  if (id === state.activeFilter) return;
  const explorer = document.querySelector('[data-collection-explorer]');
  state.activeFilter = id;
  for (const photo of explorer.querySelectorAll('.cat-stage__bg')) {
    photo.classList.toggle('is-active', photo.dataset.cat === id);
  }
  for (const tab of explorer.querySelectorAll('.cat-ticker__btn')) {
    const selected = tab.dataset.category === id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  syncCategoryTicker(explorer, true);

  const count = updateCatalogInPlace();
  const panel = document.getElementById('catalog-grid-slot');
  panel.setAttribute('aria-labelledby', `collection-tab-${id}`);
  panel.firstElementChild.classList.add('is-filtered');
  const title = explorer.querySelector('.cat-ticker__btn[aria-selected="true"] .cat-ticker__title').textContent;
  announce(`${title}. ${formatProductCount(count)} shown.`);
}

function stepCollection(step) {
  selectCollection(getAdjacentCollection(state.activeFilter, step).id);
}

function bindCollectionControls(explorer) {
  const stage = explorer.querySelector('.cat-stage');
  syncCategoryTicker(explorer);
  const resizeObserver = new ResizeObserver(() => syncCategoryTicker(explorer));
  resizeObserver.observe(stage);
  document.fonts.ready.then(() => {
    if (explorer.isConnected) syncCategoryTicker(explorer);
  });

  explorer.querySelector('[role="tablist"]').addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const tabs = [...explorer.querySelectorAll('.cat-ticker__btn')];
    switch (event.key) {
      case 'ArrowLeft': stepCollection(-1); break;
      case 'ArrowRight': stepCollection(1); break;
      case 'Home': selectCollection(tabs[0].dataset.category); break;
      case 'End': selectCollection(tabs.at(-1).dataset.category); break;
      default: return;
    }
    event.preventDefault();
    explorer.querySelector('.cat-ticker__btn[aria-selected="true"]').focus({ preventScroll: true });
  });

  let touchStart;
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary || event.target.closest('button')) return;
    touchStart = { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', (event) => {
    if (!touchStart || !event.isPrimary || event.pointerType !== 'touch') return;
    const x = event.clientX - touchStart.x;
    const y = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(x) >= 40 && Math.abs(x) > Math.abs(y) * 1.4) stepCollection(x < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { touchStart = null; });
  return () => resizeObserver.disconnect();
}

async function startCheckout(trigger) {
  if (!state.checkoutEnabled || !state.cart.itemCount || checkoutRequest) return;
  const drawerButton = '#cart-drawer [data-action="prepare-checkout"]';

  const request = {};
  const cart = state.cart;
  checkoutRequest = request;
  state.checkoutMessage = '';
  renderOverlays(false);
  if (state.isCartOpen) focusElementSoon(drawerButton);
  else announce('Opening checkout…');
  try {
    const result = await beginCheckout(cart);
    if (checkoutRequest !== request) return;
    rememberCheckout(result.reference, cart);
    trackTikTok('InitiateCheckout', cart.items, cart.subtotal);
    window.location.assign(result.checkoutUrl);
  } catch (error) {
    if (checkoutRequest === request) {
      state.checkoutMessage = error.name === 'CheckoutError'
        ? error.message : 'We couldn’t open checkout. Please try again.';
      if (trigger.id === 'quick-checkout') {
        lastTrigger = trigger;
        state.isMobileMenuOpen = false;
        state.isSearchOpen = false;
        state.isCartOpen = true;
      }
    }
  } finally {
    if (checkoutRequest === request) {
      checkoutRequest = null;
      renderOverlays(false);
      if (state.isCartOpen) focusElementSoon(drawerButton);
    }
  }
}

async function checkPaymentStatus() {
  const { route } = state;
  if (route.name !== 'checkout' || route.reference === 'cancelled') return;
  state.checkoutResult = { status: 'loading' };
  renderRoute();
  document.getElementById('main-content').focus({ preventScroll: true });
  try {
    const result = await getCheckoutResult(route, commerce);
    if (state.route !== route) return;
    state.checkoutResult = result;
  } catch {
    if (state.route !== route) return;
    state.checkoutResult.status = 'error';
  }
  renderRoute();
  document.getElementById('main-content').focus({ preventScroll: true });
}

function scrollToCollection({ focusTab = false, behavior = 'instant' } = {}) {
  const section = document.getElementById('collection');
  if (!section) return;
  if (focusTab) {
    section.querySelector('.cat-ticker__btn[aria-selected="true"]')?.focus({ preventScroll: true });
  }
  section.scrollIntoView({ block: 'start', behavior });
}

function followStorefrontLink(event, target) {
  const link = target.closest('a[href^="/"]');
  if (!link || link.target || link.hasAttribute('download') || event.defaultPrevented ||
      event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin) return false;
  event.preventDefault();
  if (url.href !== window.location.href) window.history.pushState(null, '', url);
  handleLocationChange();
  return true;
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const actionEl = target.closest('[data-action]');
  const modalPanel = target.closest('[data-stop-propagation]');
  if (followStorefrontLink(event, target)) return;
  if (modalPanel && !modalPanel.contains(actionEl)) return;
  if (!actionEl) {
    if (target.closest('[data-close-mobile-menu]')) closeAllOverlays({ restoreFocus: false });
    return;
  }

  const action = actionEl.dataset.action;
  if (actionEl.getAttribute('aria-disabled') === 'true') return;

  switch (action) {
    case 'open-cart': {
      lastTrigger = actionEl;
      const wasOpen = state.isCartOpen;
      state.isMobileMenuOpen = false;
      state.isSearchOpen = false;
      state.isCartOpen = true;
      updateHeaderCounts();
      renderOverlays(!wasOpen);
      focusElementSoon('#cart-drawer [data-action="close-cart"]');
      break;
    }
    case 'close-cart': {
      closeAllOverlays();
      break;
    }
    case 'toggle-mobile-menu': {
      if (!state.isMobileMenuOpen) lastTrigger = actionEl;
      state.isCartOpen = false;
      state.isSearchOpen = false;
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
      updateHeaderCounts();
      renderOverlays(state.isMobileMenuOpen);
      if (state.isMobileMenuOpen) {
        focusElementSoon('#mobile-nav-drawer [data-action="close-mobile-menu"]');
      }
      break;
    }
    case 'close-mobile-menu': {
      closeAllOverlays();
      break;
    }
    case 'open-search': {
      lastTrigger = actionEl;
      state.isMobileMenuOpen = false;
      state.isCartOpen = false;
      state.isSearchOpen = true;
      updateHeaderCounts();
      renderOverlays(true);
      focusElementSoon('#search-catalog-input');
      break;
    }
    case 'close-search': {
      const isLink = actionEl.tagName === 'A';
      closeAllOverlays({ restoreFocus: !isLink });
      break;
    }
    case 'scroll-collection': {
      event.preventDefault();
      scrollToCollection({ focusTab: true, behavior: 'auto' });
      break;
    }
    case 'set-category': {
      selectCollection(actionEl.dataset.category);
      break;
    }
    case 'step-category': {
      stepCollection(Number(actionEl.dataset.step));
      break;
    }
    case 'set-pdp-media': {
      const product = getProductBySlug(state.route.slug);
      if (!product) break;
      const media = getPdpMediaOptions(product).find(({ id }) => id === actionEl.dataset.media);
      if (!media || actionEl.getAttribute('aria-pressed') === 'true') break;

      const stage = document.getElementById('pdp-stage');
      stage.innerHTML = renderPdpMedia(media);
      for (const button of document.querySelectorAll('[data-action="set-pdp-media"]')) {
        button.setAttribute('aria-pressed', String(button === actionEl));
      }

      break;
    }
    case 'set-pdp-qty': {
      const nextQty = Math.max(1, Number(actionEl.dataset.qty) || 1);
      const price = Number(actionEl.dataset.price) || 0;
      state.pdpQty = nextQty;
      const valEl = document.getElementById('pdp-qty-val');
      const decBtn = document.getElementById('pdp-qty-dec');
      const incBtn = document.getElementById('pdp-qty-inc');
      if (valEl) valEl.textContent = String(nextQty);
      if (decBtn) {
        decBtn.dataset.qty = String(Math.max(1, nextQty - 1));
        decBtn.setAttribute('aria-disabled', String(nextQty <= 1));
      }
      if (incBtn) incBtn.dataset.qty = String(nextQty + 1);
      for (const button of document.querySelectorAll('[data-pdp-add]')) {
        button.dataset.qty = String(nextQty);
        button.querySelector('[data-pdp-add-text]').textContent = `Add to bag — ${formatMoney(price * nextQty)}`;
      }
      const selectedQty = document.querySelector('[data-pdp-selected-qty]');
      selectedQty.textContent = `${nextQty} selected`;
      selectedQty.hidden = nextQty === 1;
      break;
    }
    case 'add-to-cart': {
      const slug = actionEl.dataset.slug;
      const qty = Math.max(1, Number(actionEl.dataset.qty) || 1);
      const product = getProductBySlug(slug);
      if (product) {
        const wasOpen = state.isCartOpen;
        if (!wasOpen) lastTrigger = actionEl;
        state.isCartOpen = true;
        state.isMobileMenuOpen = false;
        state.isSearchOpen = false;
        commerce.addItem(slug, qty);
        trackTikTok('AddToCart', [{ product, quantity: qty }], product.price * qty);
        updateHeaderCounts();
        renderOverlays(!wasOpen);
        announce(`Added ${qty} × ${product.name} to your bag.`);
        focusElementSoon('#cart-drawer [data-action="close-cart"]');
      }
      break;
    }
    case 'cart-qty':
    case 'remove-cart-item': {
      const { slug, qty, change } = actionEl.dataset;
      if (action === 'cart-qty') commerce.updateQuantity(slug, Number(qty));
      else commerce.removeItem(slug);
      const item = state.cart.items.find((line) => line.slug === slug);
      if (item && change) {
        focusElementSoon(`[data-slug="${CSS.escape(slug)}"][data-change="${change}"]`);
        announce(`${item.product.name} quantity ${item.quantity}.`);
      } else {
        focusElementSoon('#cart-drawer [data-action="close-cart"]');
        announce(`Removed ${getProductBySlug(slug).name} from your bag.`);
      }
      break;
    }
    case 'prepare-checkout': {
      startCheckout(actionEl);
      break;
    }
    case 'check-payment-status': {
      checkPaymentStatus();
      break;
    }
    default:
      break;
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.dataset.action === 'set-sort') {
    state.sortBy = target.value || 'featured';
    const count = updateCatalogInPlace();
    announce(`${formatProductCount(count)} shown.`);
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === 'search-catalog-input') {
    state.searchQuery = target.value;
    document.getElementById('search-results-slot').innerHTML = renderSearchResults(state.searchQuery);
  }
});

document.addEventListener('keydown', (event) => {
  const dialog = document.querySelector('#overlay-root [role="dialog"]');
  if (!dialog) return;
  if (event.key === 'Escape') {
    closeAllOverlays();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = [...dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]')]
    .filter((element) => !element.disabled && element.getClientRects().length);
  const first = focusable[0];
  const last = focusable.at(-1);
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first?.focus();
  }
});

function handleLocationChange() {
  const nextRoute = readRoute();
  const routeChanged =
    nextRoute.name !== state.route.name ||
    nextRoute.slug !== state.route.slug ||
    nextRoute.reference !== state.route.reference ||
    nextRoute.sessionId !== state.route.sessionId ||
    nextRoute.section !== state.route.section;

  closeAllOverlays({ restoreFocus: false });
  if (routeChanged) {
    state.route = nextRoute;
    state.pdpQty = 1;
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderRoute();
    trackTikTokView(nextRoute);
    if (window.location.hash !== '#collection') document.getElementById('main-content').focus({ preventScroll: true });
    checkPaymentStatus();
  }
  if (window.location.hash === '#collection') scrollToCollection();
}

window.addEventListener('hashchange', handleLocationChange);
window.addEventListener('popstate', handleLocationChange);

commerce.subscribe((nextCart) => {
  checkoutRequest = null;
  state.checkoutMessage = '';
  state.cart = nextCart;
  updateHeaderCounts();
  if (state.isCartOpen) {
    renderOverlays(false);
  } else {
    updateQuickCheckout();
  }
});

renderRoute();
bindCookiePreferences((previous) => {
  const reload = syncGoogleTags();
  syncTikTokConsent(previous.advertising);
  if (reload) window.location.reload();
  else if (!previous.advertising && consentAllows('advertising')) trackTikTokView(state.route);
});
const storeIntro = document.getElementById('store-intro');
const opensAtCollection = window.location.hash === '#collection';
if (state.route.name !== 'home' || opensAtCollection) {
  storeIntro?.remove();
} else {
  storeIntro?.classList.add('is-ready');
}
if (opensAtCollection) scrollToCollection();
checkPaymentStatus();
getCheckoutSettings().then(({ enabled, shipping }) => {
  if (enabled !== true) return;
  state.checkoutEnabled = true;
  if (shipping?.weightsGrams && Array.isArray(shipping.tiers)) state.shipping = shipping;
  updateQuickCheckout();
  if (state.isCartOpen) {
    renderOverlays(false);
    focusElementSoon('#cart-drawer [data-action="close-cart"]');
  }
  if (state.route.name === 'policies') renderRoute();
});
