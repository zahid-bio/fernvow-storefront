import { PRODUCTS, formatMoney, getProductBySlug } from '../data/catalog.js';
import { escapeHtml, iconSvg } from '../components/header.js';

const CATEGORIES = [
  { id: 'all', title: 'All skincare', image: 'all' },
  { id: 'cleanse', title: 'Cleansers', image: 'cleanse' },
  { id: 'tone', title: 'Toners', image: 'tone' },
  { id: 'moisturize', title: 'Moisturizers', image: 'moisturize' },
  { id: 'bundle', title: 'The Daily Duo', image: 'duo' },
  { id: 'fragrance-free', title: 'Fragrance-free', image: 'fragrance' },
];

export function getAdjacentCollection(activeFilter, step) {
  const index = CATEGORIES.findIndex(({ id }) => id === activeFilter);
  return CATEGORIES[(index + step + CATEGORIES.length) % CATEGORIES.length];
}

function renderCollectionExplorer(activeFilter) {
  return `
    <div class="collection-explorer" data-collection-explorer>
      <div class="collection-stage">
        <div class="collection-stage__images" aria-hidden="true">
          ${CATEGORIES.map(({ id, image }) => `
            <img src="assets/photos/collection-${image}.webp" alt="" width="900" height="675"
              loading="lazy" decoding="async" data-collection-slide="${id}" class="${id === activeFilter ? 'is-active' : ''}" />
          `).join('')}
        </div>
        <div class="collection-stage__ticker">
          <button type="button" class="collection-step" data-action="step-category" data-step="-1"
            aria-label="Previous category" aria-controls="catalog-grid-slot">
            ${iconSvg('icon-arrow-left')}
            <span class="collection-step__label" aria-hidden="true">${getAdjacentCollection(activeFilter, -1).title}</span>
          </button>
          <div class="collection-stage__titles" aria-hidden="true">
            ${CATEGORIES.map(({ id, title }) => `
              <span data-collection-slide="${id}" class="${id === activeFilter ? 'is-active' : ''}">${title}</span>
            `).join('')}
          </div>
          <button type="button" class="collection-step" data-action="step-category" data-step="1"
            aria-label="Next category" aria-controls="catalog-grid-slot">
            <span class="collection-step__label" aria-hidden="true">${getAdjacentCollection(activeFilter, 1).title}</span>
            ${iconSvg('icon-arrow-right')}
          </button>
        </div>
      </div>

      <div class="collection-filters" role="group" aria-label="Filter skincare">
        ${CATEGORIES.map(({ id, title }) => `
          <button type="button" class="collection-filter" data-action="set-category" data-category="${id}"
            aria-pressed="${String(activeFilter === id)}" aria-controls="catalog-grid-slot">${title}</button>
        `).join('')}
      </div>
    </div>
  `;
}

const QUESTIONS = [
  ['Where should I start?', 'Start with the Daily Cleansing Foam. Add moisturizer afterward if you want a simple two-step routine.'],
  ['Which products are fragrance-free?', 'The Hydrating Toner and Daily Face Moisturizer are fragrance-free. The Daily Cleansing Foam has a light floral scent.'],
  ['Do I need to use all three steps?', 'No. Cleanse and moisturize for a simple routine. Add the toner in between if you like a light layer of hydration.'],
];

export function filterAndSortProducts(activeFilter = 'all', sortBy = 'featured') {
  let products = [...PRODUCTS];
  if (activeFilter === 'fragrance-free') {
    products = products.filter((product) => product.fragranceStatus === 'fragrance-free');
  } else if (activeFilter !== 'all') {
    products = products.filter((product) => product.category === activeFilter);
  }

  if (sortBy === 'price-asc') products.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') products.sort((a, b) => b.price - a.price);
  return products;
}

export function renderProductCard(product) {
  const slug = escapeHtml(product.slug);
  const name = escapeHtml(product.name);
  return `
    <article class="shop-card">
      <a href="#/product/${slug}" class="shop-card__photo" data-category="${product.category}" tabindex="-1" aria-hidden="true">
        <img src="${escapeHtml(product.images.primary)}" alt="" loading="lazy" width="850" height="950" />
      </a>
      <div class="shop-card__info">
        <h3><a href="#/product/${slug}">${name}</a></h3>
        <p>${escapeHtml(product.benefit)}</p>
        <div class="shop-card__price">
          <strong>${formatMoney(product.price)}</strong>
          ${product.compareAtPrice ? `<del>${formatMoney(product.compareAtPrice)}</del>` : ''}
        </div>
        <button type="button" class="btn btn--outline btn--full" data-action="add-to-cart"
          data-slug="${slug}" aria-label="Add ${name} to bag">
          Add to bag ${iconSvg('icon-plus', 'icon--sm')}
        </button>
      </div>
    </article>
  `;
}

export function renderHomeCatalogGrid(activeFilter = 'all', sortBy = 'featured') {
  const products = filterAndSortProducts(activeFilter, sortBy);
  return `
    <div class="shop-grid" data-filter-count="${products.length}">
      ${products.map(renderProductCard).join('')}
    </div>
  `;
}

export function renderHomeView({ activeFilter = 'all', sortBy = 'featured' }) {
  const foam = getProductBySlug('daily-cleansing-foam');

  return `
    <section class="store-hero container" aria-labelledby="store-title">
      <div class="store-hero__layout">
        <div class="store-hero__copy">
          <p class="section-label">Daily skincare</p>
          <h1 id="store-title">A fresh start<br />for your <em>skin.</em></h1>
          <p>Lift away the day with a soft, airy cleanser that leaves skin feeling clean and comfortable.</p>
          <div class="store-hero__actions">
            <a href="#/product/${foam.slug}" class="btn btn--fern">
              Shop the cleanser ${iconSvg('icon-arrow-right', 'icon--sm')}
            </a>
            <a href="#collection" class="store-text-link" data-action="scroll-collection">Browse all skincare</a>
          </div>
        </div>
        <a href="#/product/${foam.slug}" class="store-hero__art" aria-label="View Daily Cleansing Foam">
          <img src="assets/photos/hero-cleanser.webp" alt="Fernvow Daily Cleansing Foam bottle"
            width="850" height="950" fetchpriority="high" />
          <span class="store-hero__product">
            <span>${escapeHtml(foam.name)}</span>
            <strong>${formatMoney(foam.price)}</strong>
          </span>
        </a>
      </div>
    </section>

    <section class="shop-collection container" id="collection" aria-labelledby="collection-title">
      <div class="shop-collection__heading">
        <h2 class="store-heading" id="collection-title">Shop skincare</h2>
        <div class="shop-sort">
          <label for="catalog-sort-select">Sort by</label>
          <select id="catalog-sort-select" data-action="set-sort">
            <option value="featured"${sortBy === 'featured' ? ' selected' : ''}>Featured</option>
            <option value="price-asc"${sortBy === 'price-asc' ? ' selected' : ''}>Price, low to high</option>
            <option value="price-desc"${sortBy === 'price-desc' ? ' selected' : ''}>Price, high to low</option>
          </select>
        </div>
      </div>
      ${renderCollectionExplorer(activeFilter)}
      <div id="catalog-grid-slot">${renderHomeCatalogGrid(activeFilter, sortBy)}</div>
    </section>

    <section class="container routine-feature" aria-labelledby="routine-feature-title">
      <img src="assets/photos/editorial-lifestyle-portrait.jpg" alt="A woman taking a quiet moment during her skincare routine"
        width="896" height="1200" loading="lazy" />
      <div class="routine-feature__copy">
        <h2 class="store-heading" id="routine-feature-title">Keep it simple.</h2>
        <p>Cleanse, add a little hydration if you like, then moisturize. Find what feels right for your skin.</p>
        <a href="#/routine" class="btn btn--fern">See the daily routine ${iconSvg('icon-arrow-right', 'icon--sm')}</a>
      </div>
    </section>

    <section class="store-faq container" id="faq" aria-labelledby="faq-title">
      <h2 class="store-heading" id="faq-title">Common questions</h2>
      <div class="accordion-group">
        ${QUESTIONS.map(([question, answer]) => `
          <details class="accordion-item">
            <summary class="accordion-trigger">
              <span>${question}</span>${iconSvg('icon-chevron-down', 'accordion-trigger__chevron')}
            </summary>
            <p class="accordion-body">${answer}</p>
          </details>
        `).join('')}
      </div>
    </section>
  `;
}
