import { PRODUCTS, formatMoney, getProductBySlug } from '../data/catalog.js';
import { escapeHtml, iconSvg } from '../components/header.js';
import { renderProductCard } from './homeView.js';

const GALLERY_IMAGES = {
  cleanse: 'cleanse',
  tone: 'tone',
  moisturize: 'moisturize',
  bundle: 'duo',
};

const RITUAL_HEADLINES = {
  cleanse: 'Start with a fresh face.',
  tone: 'A little hydration in between.',
  moisturize: 'Finish with a light layer.',
  bundle: 'Two steps, morning or evening.',
};

export function getPdpMediaOptions(product) {
  return [
    { id: 'studio', label: 'Product', src: product.images.primary, alt: product.images.alt },
    {
      id: 'detail',
      label: product.isBundle ? 'The pair' : 'Texture',
      src: `assets/photos/collection-${GALLERY_IMAGES[product.category]}.webp`,
      alt: {
        cleanse: 'Close-up of airy cleansing foam in a ceramic dish',
        tone: 'Clear water rippling in a blush glass dish',
        moisturize: 'An ivory moisturizer swatch on a coral tile',
        bundle: 'Two ivory bottles side by side on a coral ledge',
      }[product.category],
    },
  ];
}

export function renderPdpMedia(media) {
  return `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}" class="pdp-stage__img" fetchpriority="high" />`;
}

function renderIngredients(product) {
  const formulas = product.isBundle
    ? product.bundleComponents.map(({ productSlug }) => getProductBySlug(productSlug))
    : [product];
  return formulas.map((formula) => `
    <div class="pdp-ingredients">
      ${product.isBundle ? `<h3>${escapeHtml(formula.name)}</h3>` : ''}
      <p>${escapeHtml(formula.inci)}</p>
      ${formula.inciNotes ? `<p>${escapeHtml(formula.inciNotes)}</p>` : ''}
    </div>
  `).join('');
}

function detailSection(id, title, content) {
  return `
    <details class="accordion-item" id="${id}">
      <summary class="accordion-trigger">
        <span>${title}</span>${iconSvg('icon-chevron-down', 'accordion-trigger__chevron')}
      </summary>
      <div class="accordion-body">${content}</div>
    </details>
  `;
}

function renderPurchaseButton(product, qty, primary = false) {
  return `
    <button type="button" ${primary ? 'id="pdp-add-btn"' : ''}
      class="btn btn--fern${primary ? ' btn--full' : ''}" data-pdp-add data-action="add-to-cart"
      data-slug="${escapeHtml(product.slug)}" data-qty="${qty}">
      ${iconSvg('icon-bag')}
      <span data-pdp-add-text ${primary ? 'id="pdp-add-btn-text"' : ''}>Add to bag &mdash; ${formatMoney(product.price * qty)}</span>
    </button>
  `;
}

function renderProductStory(product, qty, detailPhoto) {
  const { name, category, images } = product;
  return `
    <section class="product-story" aria-labelledby="product-story-title">
      <div class="product-story__ritual">
        <img src="${escapeHtml(images.editorialImage)}" alt="${escapeHtml(images.editorialAlt)}"
          width="1040" height="780" loading="lazy" decoding="async" />
        <div class="product-story__copy">
          <p class="section-label">How to use</p>
          <h2 class="store-heading" id="product-story-title">${RITUAL_HEADLINES[category]}</h2>
          <p>${escapeHtml(product.shortDescription)}</p>
          <ol class="product-directions product-story__directions">
            ${product.directions.map(({ text }) => `<li>${escapeHtml(text)}</li>`).join('')}
          </ol>
        </div>
      </div>

      <div class="product-story__details">
        <img src="${escapeHtml(detailPhoto.src)}" alt="${escapeHtml(detailPhoto.alt)}"
          width="900" height="675" loading="lazy" decoding="async" />
        <div class="product-story__copy">
          <h2 class="store-heading">A closer look</h2>
          <p>${escapeHtml(product.packaging.bottle)}. ${escapeHtml(product.packaging.pumpOrCap)}.</p>
          <button type="button" class="btn btn--outline" data-action="open-product-ingredients"
            aria-controls="pdp-ingredients">
            See full ingredients ${iconSvg('icon-arrow-up-right', 'icon--sm')}
          </button>
        </div>
      </div>

      <div class="product-story__purchase">
        <div>
          <h2>${escapeHtml(name)}</h2>
          <p>${escapeHtml(product.benefit)}</p>
        </div>
        ${renderPurchaseButton(product, qty)}
      </div>
    </section>
  `;
}

export function renderProductView({ slug, qty = 1 }) {
  const product = getProductBySlug(slug);
  if (!product) {
    return `
      <section class="container section-block">
        <h1 class="store-heading">We couldn’t find that product.</h1>
        <a href="#/" class="btn btn--fern">Back to shop</a>
      </section>
    `;
  }

  const mediaOptions = getPdpMediaOptions(product);
  const companions = PRODUCTS.filter((item) => item.slug !== product.slug);
  const scent = {
    'contains-fragrance': 'Light floral scent',
    'fragrance-free': 'Fragrance-free',
  }[product.fragranceStatus] || 'Cleanser has a light floral scent';

  return `
    <div class="container product-page">
      <nav class="product-breadcrumb" aria-label="Breadcrumb">
        <a href="#/">Shop</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHtml(product.name)}</span>
      </nav>
      <div class="product-page__layout">
        <div class="product-page__media">
          <div class="pdp-stage" id="pdp-stage">${renderPdpMedia(mediaOptions[0])}</div>
          <div class="product-gallery" role="group" aria-label="Product images">
            ${mediaOptions.map(({ id, label, src }) => `
              <button type="button" class="product-gallery__button" data-action="set-pdp-media"
                data-media="${id}" data-slug="${slug}" aria-pressed="${String(id === 'studio')}" aria-controls="pdp-stage">
                <img src="${escapeHtml(src)}" alt="" width="40" height="40" />
                <span>${label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <section class="product-page__info" aria-labelledby="product-title">
          <h1 id="product-title">${escapeHtml(product.name)}</h1>
          <p class="product-page__summary">${escapeHtml(product.subtitle)}</p>
          <p class="product-page__facts">${escapeHtml(product.sizeDisplay)} <span aria-hidden="true">·</span> ${escapeHtml(scent)}</p>
          <div class="pdp-price-bar">
            <strong class="pdp-price">${formatMoney(product.price)}</strong>
            ${product.compareAtPrice ? `<del>${formatMoney(product.compareAtPrice)}</del>` : ''}
            ${product.savingsAmount ? `<span class="product-savings">Save ${formatMoney(product.savingsAmount)}</span>` : ''}
          </div>
          <div class="pdp-purchase-row">
            <div class="qty-stepper" role="group" aria-label="Quantity">
              <button type="button" id="pdp-qty-dec" class="qty-stepper__btn" data-action="set-pdp-qty"
                data-price="${product.price}" data-qty="${Math.max(1, qty - 1)}" aria-label="Decrease quantity"
                aria-disabled="${String(qty <= 1)}">${iconSvg('icon-minus')}</button>
              <span id="pdp-qty-val" class="qty-stepper__val" aria-live="polite">${qty}</span>
              <button type="button" id="pdp-qty-inc" class="qty-stepper__btn" data-action="set-pdp-qty"
                data-price="${product.price}" data-qty="${qty + 1}" aria-label="Increase quantity">${iconSvg('icon-plus')}</button>
            </div>
            ${renderPurchaseButton(product, qty, true)}
          </div>

          <dl class="product-quick-facts" aria-label="Formula at a glance">
            <div><dt>Texture</dt><dd>${escapeHtml(product.texture)}</dd></div>
            <div><dt>Finish</dt><dd>${escapeHtml(product.finish)}</dd></div>
            <div><dt>Skin type</dt><dd>${escapeHtml(product.skinTypes)}</dd></div>
          </dl>

          ${product.bundleComponents ? `
            <div class="product-includes">
              <h2>In the set</h2>
              ${product.bundleComponents.map((item) => `
                <a class="store-text-link" href="#/product/${escapeHtml(item.productSlug)}">
                  ${escapeHtml(item.name)} <span>${escapeHtml(item.size)}</span>
                </a>
              `).join('')}
            </div>
          ` : ''}

          <div class="accordion-group">
            ${detailSection('pdp-ingredients', 'Ingredients', renderIngredients(product))}
            ${detailSection('pdp-formula', 'Formula and packaging', `
              <dl class="product-specs">
                <div><dt>pH</dt><dd>${escapeHtml(product.phRange)}</dd></div>
                <div><dt>Fragrance</dt><dd>${escapeHtml(product.fragranceNote)}</dd></div>
              </dl>
              <p>${escapeHtml(product.packaging.recycling)}</p>
            `)}
          </div>
        </section>
      </div>
      ${renderProductStory(product, qty, mediaOptions[1])}
      <section class="product-companions" aria-labelledby="companions-heading">
        <h2 id="companions-heading" class="store-heading">More for your routine</h2>
        <div class="shop-grid shop-grid--related">${companions.map(renderProductCard).join('')}</div>
      </section>
    </div>
  `;
}
