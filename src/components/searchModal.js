import { PRODUCTS, formatMoney } from '../data/catalog.js';
import { escapeHtml, iconSvg } from './header.js';

function filterProductsByQuery(query) {
  const terms = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  return PRODUCTS.filter((product) => {
    const searchable = [
      product.name, product.subtitle, product.stepLabel, product.category,
      product.shortDescription, product.skinTypes, product.fragranceBadge, product.inci, product.sizeDisplay,
    ].join(' ').toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

export function renderSearchResults(query) {
  const matches = filterProductsByQuery(query);
  return `
    <p class="search-count-label" role="status">${matches.length} ${matches.length === 1 ? 'product' : 'products'}</p>
    <div class="search-results">
      ${matches.length === 0 ? `<p>No results for “${escapeHtml(query)}”. Try “cleanser” or “toner”.</p>` : matches.map((product) => `
        <a href="/product/${product.slug}" class="search-result-card" data-action="close-search">
          <img src="/${escapeHtml(product.images.primary)}" alt="" class="search-result-card__img" width="60" height="60" />
          <span class="cart-item__name">${escapeHtml(product.name)}</span>
          <strong>${formatMoney(product.price)}</strong>
        </a>
      `).join('')}
    </div>
  `;
}

export function renderSearchModal({ isOpen, query }) {
  if (!isOpen) return '';
  return `
    <div class="modal-backdrop overlay-backdrop" data-action="close-search">
      <div class="modal-panel overlay-modal" role="dialog" aria-modal="true" aria-labelledby="search-modal-title" data-stop-propagation>
        <div class="modal-panel__head">
          <h2 id="search-modal-title" class="modal-panel__title">Search skincare</h2>
          <button type="button" class="icon-btn" data-action="close-search" aria-label="Close search">
            ${iconSvg('icon-close')}
          </button>
        </div>
        <div class="modal-panel__body">
          <div class="field-group">
            <label for="search-catalog-input" class="field-label">Product name or ingredient</label>
            <input id="search-catalog-input" type="search" class="field-input" value="${escapeHtml(query)}"
              placeholder="Try cleanser, toner or aloe" autocomplete="off" />
          </div>
          <div id="search-results-slot">${renderSearchResults(query)}</div>
        </div>
      </div>
    </div>
  `;
}
