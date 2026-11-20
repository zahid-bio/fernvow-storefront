export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function iconSvg(id, extraClass = '') {
  const cls = extraClass ? `icon ${extraClass}` : 'icon';
  return `<svg class="${cls}" aria-hidden="true"><use href="assets/icons/fernvow-icons.svg#${escapeHtml(id)}"></use></svg>`;
}

export const NAV_ITEMS = [
  { label: 'Shop', hash: '#/', match: (route) => route.name === 'home' },
  { label: 'Routine', hash: '#/routine', match: (route) => route.name === 'routine' },
  {
    label: 'About',
    hash: '#/philosophy',
    match: (route) => route.name === 'brand' || route.name === 'philosophy',
  },
];

export function renderHeader({ route, cart, isMobileMenuOpen = false }) {
  const itemCount = cart?.itemCount || 0;

  const navLinksHtml = NAV_ITEMS.map((item) => {
    const active = item.match(route);
    return `<a href="${item.hash}" class="site-nav__link ${active ? 'is-active' : ''}" ${
      active ? 'aria-current="page"' : ''
    }>${escapeHtml(item.label)}</a>`;
  }).join('');

  return `
    <header class="site-header" id="site-header">
      <div class="container site-header__inner">
        <a href="#/" class="site-brand" aria-label="Fernvow home">
          <span class="site-brand__word">fernvow</span>
        </a>

        <nav class="site-nav" aria-label="Main navigation">
          ${navLinksHtml}
        </nav>

        <div class="site-header__actions">
          <button
            type="button"
            class="header-action-link"
            data-action="open-search"
            aria-label="Search skincare"
          >
            ${iconSvg('icon-search', 'icon--sm')}
            <span class="header-action-link__label">Search</span>
          </button>

          <button
            type="button"
            class="header-bag-btn"
            data-action="open-cart"
            aria-label="Open shopping bag (${itemCount} ${itemCount === 1 ? 'item' : 'items'})"
          >
            ${iconSvg('icon-bag', 'icon--sm')}
            <span class="header-action-link__label">Bag</span>
            <span id="header-bag-count" class="header-bag-btn__count">${itemCount}</span>
          </button>

          <button
            type="button"
            class="icon-btn menu-trigger"
            data-action="toggle-mobile-menu"
            aria-label="${isMobileMenuOpen ? 'Close menu' : 'Open menu'}"
            aria-expanded="${isMobileMenuOpen ? 'true' : 'false'}"
            aria-controls="mobile-nav-drawer"
          >
            ${iconSvg(isMobileMenuOpen ? 'icon-close' : 'icon-menu')}
          </button>
        </div>
      </div>
    </header>
  `;
}

export function renderMobileMenu({ isOpen, route }) {
  if (!isOpen) return '';

  const mobileLinksHtml = [
    ...NAV_ITEMS,
    { label: 'Care & Policies', hash: '#/policies/shipping', match: (r) => r.name === 'policies' },
  ]
    .map((item) => {
      const active = item.match(route);
      return `<a href="${item.hash}" class="mobile-nav-drawer__link ${active ? 'is-active' : ''}" data-close-mobile-menu ${
        active ? 'aria-current="page"' : ''
      }><span>${escapeHtml(item.label)}</span>${iconSvg('icon-arrow-right', 'icon--sm')}</a>`;
    })
    .join('');

  return `
    <div class="mobile-nav-backdrop overlay-backdrop" data-action="close-mobile-menu"></div>
    <aside
      id="mobile-nav-drawer"
      class="mobile-nav-drawer overlay-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      <div class="mobile-nav-drawer__head">
        <span class="site-brand__word">fernvow</span>
        <button
          type="button"
          class="icon-btn"
          data-action="close-mobile-menu"
          aria-label="Close navigation menu"
        >
          ${iconSvg('icon-close')}
        </button>
      </div>
      <nav class="mobile-nav-drawer__links" aria-label="Mobile navigation links">
        ${mobileLinksHtml}
      </nav>
    </aside>
  `;
}
