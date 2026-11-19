import { PRODUCTS, formatMoney, getProductBySlug, getProductScentLabel } from '../data/catalog.js';
import { escapeHtml, iconSvg } from '../components/header.js';

const TICKER_ITEMS = [
  { id: 'cleanse', title: 'cleansing', label: 'Cleanse', image: 'cleanse' },
  { id: 'tone', title: 'toning', label: 'Tone', image: 'tone' },
  { id: 'all', title: 'all formulas', label: 'All', image: 'all' },
  { id: 'moisturize', title: 'moisturizing', label: 'Moisturize', image: 'moisturize' },
  { id: 'bundle', title: 'the duo', label: 'The Duo', image: 'duo' },
  { id: 'fragrance-free', title: 'fragrance-free', label: 'Fragrance-free', image: 'fragrance' },
];

export function getAdjacentCollection(activeFilter, step) {
  const index = TICKER_ITEMS.findIndex(({ id }) => id === activeFilter);
  return TICKER_ITEMS[(index + step + TICKER_ITEMS.length) % TICKER_ITEMS.length];
}

export function formatProductCount(count) {
  return `${count} ${count === 1 ? 'product' : 'products'}`;
}

function renderCollectionExplorer(activeFilter, sortBy, productCount) {
  return `
    <div data-collection-explorer>
      <div class="cat-stage">
        <div class="cat-stage__bgs" aria-hidden="true">
          ${TICKER_ITEMS.map(({ id, image }) => `
            <picture class="cat-stage__bg ${id === activeFilter ? 'is-active' : ''}" data-cat="${id}">
              <source media="(max-width: 640px)" srcset="assets/photos/ticker-${image}-mobile.webp" width="720" height="720" />
              <img src="assets/photos/ticker-${image}-wide.webp" alt="" width="1600" height="640"
                loading="lazy" decoding="async"${id === activeFilter ? '' : ' fetchpriority="low"'} />
            </picture>
          `).join('')}
        </div>
        <div class="cat-ticker-viewport" role="tablist" aria-label="Skincare categories">
          <div class="cat-ticker__track">
            ${TICKER_ITEMS.map(({ id, title, label }) => `
              <button type="button" role="tab" id="collection-tab-${id}" class="cat-ticker__btn"
                data-action="set-category" data-category="${id}" aria-selected="${String(id === activeFilter)}"
                tabindex="${id === activeFilter ? '0' : '-1'}" aria-controls="catalog-grid-slot">
                <span class="cat-ticker__title">${title}</span>
                <span class="cat-ticker__short" aria-hidden="true">${label}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="cat-stage__controls" role="group" aria-label="Browse categories">
          <button type="button" class="cat-stage__arrow cat-stage__arrow--prev" data-action="step-category"
            data-step="-1" aria-label="Previous category" aria-controls="catalog-grid-slot">
            ${iconSvg('icon-chevron-down', 'icon--sm')}
          </button>
          <button type="button" class="cat-stage__arrow cat-stage__arrow--next" data-action="step-category"
            data-step="1" aria-label="Next category" aria-controls="catalog-grid-slot">
            ${iconSvg('icon-chevron-down', 'icon--sm')}
          </button>
        </div>
      </div>
      <div class="container collection-tools">
        <p class="collection-tools__count" data-collection-count>${formatProductCount(productCount)}</p>
        <div class="shop-sort">
          <label for="catalog-sort-select">Sort by</label>
          <select id="catalog-sort-select" data-action="set-sort">
            <option value="featured"${sortBy === 'featured' ? ' selected' : ''}>Featured</option>
            <option value="price-asc"${sortBy === 'price-asc' ? ' selected' : ''}>Price, low to high</option>
            <option value="price-desc"${sortBy === 'price-desc' ? ' selected' : ''}>Price, high to low</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

const QUESTIONS = [
  ['Where should I start?', 'Start with the <a href="#/product/daily-cleansing-foam">Daily Cleansing Foam</a>. For a simple two-step routine, <a href="#/product/the-daily-duo">The Daily Duo</a> pairs it with moisturizer.'],
  ['Which products are fragrance-free?', 'The <a href="#/product/hydrating-toner">Hydrating Toner</a> and <a href="#/product/daily-face-moisturizer">Daily Face Moisturizer</a> are fragrance-free. The Daily Cleansing Foam has a light floral scent.'],
  ['Do I need to use all three steps?', 'Cleanse and moisturize for a simple routine. Add the <a href="#/product/hydrating-toner">Hydrating Toner</a> in between if you like a light layer of hydration.'],
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
      <a href="#/product/${slug}" class="shop-card__photo" tabindex="-1" aria-hidden="true">
        <img src="${escapeHtml(product.images.primary)}" alt="" loading="lazy" width="960" height="1200" />
      </a>
      <div class="shop-card__info">
        <h3><a href="#/product/${slug}">${name}</a></h3>
        <p>${escapeHtml(product.benefit)}</p>
        <p class="shop-card__facts">
          ${escapeHtml(product.sizeDisplay)} <span aria-hidden="true">·</span> ${escapeHtml(getProductScentLabel(product))}
        </p>
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

export function renderHomeCatalogGrid(products) {
  return `
    <div class="shop-grid">
      ${products.map(renderProductCard).join('')}
    </div>
  `;
}

function renderHeroFeature(product, slot) {
  return `
    <a href="#/product/${product.slug}" class="hero-feature hero-feature--${slot}">
      <img src="${escapeHtml(product.images.editorialImage)}" alt="" width="480" height="360" decoding="async" />
      <span class="hero-feature__text">
        <span>${escapeHtml(product.name)}</span>
        <strong>${formatMoney(product.price)}</strong>
      </span>
      ${iconSvg('icon-arrow-up-right', 'hero-feature__arrow')}
    </a>
  `;
}

export function renderHomeView({ activeFilter = 'all', sortBy = 'featured' }) {
  const foam = getProductBySlug('daily-cleansing-foam');
  const duo = getProductBySlug('the-daily-duo');
  const products = filterAndSortProducts(activeFilter, sortBy);

  return `
    <section class="store-hero container" aria-labelledby="store-title">
      <div class="store-hero__layout">
        <div class="store-hero__copy">
          <h1 id="store-title">Make time for <em>your skin.</em></h1>
          <p>An airy cleanse, a splash of hydration, and a soft finish.</p>
        </div>

        <div class="store-hero__art">
          <img src="assets/photos/campaign-lineup.webp"
            alt="Fernvow moisturizer, cleanser and toner on a coral stone shelf"
            width="990" height="660" fetchpriority="high" />
        </div>

        <div class="store-hero__bar">
          <span class="store-hero__steps">Cleanse <span aria-hidden="true">/</span> Tone <span aria-hidden="true">/</span> Moisturize</span>
          <a href="#collection" class="btn store-hero__shop" data-action="scroll-collection">
            Shop the collection ${iconSvg('icon-chevron-down', 'icon--sm')}
          </a>
          <a href="#/routine" class="store-hero__routine">
            See the daily routine ${iconSvg('icon-arrow-right', 'icon--sm')}
          </a>
        </div>

        ${renderHeroFeature(foam, 'start')}
        ${renderHeroFeature(duo, 'duo')}
      </div>
    </section>

    <section class="shop-collection" id="collection" aria-labelledby="collection-title">
      <h2 class="sr-only" id="collection-title">Shop skincare</h2>
      ${renderCollectionExplorer(activeFilter, sortBy, products.length)}
      <div id="catalog-grid-slot" class="container" role="tabpanel" tabindex="0"
        aria-labelledby="collection-tab-${activeFilter}">${renderHomeCatalogGrid(products)}</div>
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
