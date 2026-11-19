import { PRODUCTS, formatMoney, getProductBySlug } from '../data/catalog.js';
import { escapeHtml, iconSvg } from '../components/header.js';
import { renderProductCard } from './homeView.js';

const GALLERY_IMAGES = {
  cleanse: 'cleanse',
  tone: 'tone',
  moisturize: 'moisturize',
  bundle: 'duo',
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
    ...(product.images.model ? [{
      id: 'model',
      label: 'View in 3D',
      src: product.images.model,
      alt: `Interactive 3D view of ${product.name}`,
    }] : []),
  ];
}

export function renderPdpMedia(product, media) {
  if (media.id === 'model') {
    return `
      <model-viewer class="pdp-stage__model"
        src="${escapeHtml(media.src)}" poster="${escapeHtml(product.images.primary)}"
        alt="${escapeHtml(media.alt)}" camera-controls touch-action="pan-y" interaction-prompt="none"
        camera-orbit="172deg 80deg 105%"
        shadow-intensity="1">
      </model-viewer>
      <p class="pdp-model-hint">Drag or use the arrow keys to turn.</p>
    `;
  }
  return `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}" class="pdp-stage__img" data-media-kind="${media.id}" fetchpriority="high" />`;
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

function detailSection(title, content) {
  return `
    <details class="accordion-item">
      <summary class="accordion-trigger">
        <span>${title}</span>${iconSvg('icon-chevron-down', 'accordion-trigger__chevron')}
      </summary>
      <div class="accordion-body">${content}</div>
    </details>
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
          <div class="pdp-stage" id="pdp-stage">${renderPdpMedia(product, mediaOptions[0])}</div>
          <div class="product-gallery" role="group" aria-label="Product images">
            ${mediaOptions.map(({ id, label, src }) => `
              <button type="button" class="product-gallery__button" data-action="set-pdp-media"
                data-media="${id}" data-slug="${slug}" aria-pressed="${String(id === 'studio')}" aria-controls="pdp-stage">
                ${id === 'model' ? iconSvg('icon-label-spec') : `<img src="${escapeHtml(src)}" alt="" width="40" height="40" />`}
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
            <button type="button" id="pdp-add-btn" class="btn btn--fern btn--full" data-action="add-to-cart"
              data-slug="${slug}" data-qty="${qty}">
              ${iconSvg('icon-bag')}
              <span id="pdp-add-btn-text">Add to bag &mdash; ${formatMoney(product.price * qty)}</span>
            </button>
          </div>

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
            ${detailSection('How to use', `
              <ol class="product-directions">${product.directions.map(({ text }) => `<li>${escapeHtml(text)}</li>`).join('')}</ol>
            `)}
            ${detailSection('Ingredients', renderIngredients(product))}
            ${detailSection('Formula and packaging', `
              <dl class="product-specs">
                <div><dt>Skin type</dt><dd>${escapeHtml(product.skinTypes)}</dd></div>
                <div><dt>Texture</dt><dd>${escapeHtml(product.texture)}</dd></div>
                <div><dt>pH</dt><dd>${escapeHtml(product.phRange)}</dd></div>
                <div><dt>Fragrance</dt><dd>${escapeHtml(product.fragranceNote)}</dd></div>
                <div><dt>Bottle</dt><dd>${escapeHtml(product.packaging.bottle)}</dd></div>
                <div><dt>Closure</dt><dd>${escapeHtml(product.packaging.pumpOrCap)}</dd></div>
              </dl>
              <p>${escapeHtml(product.packaging.recycling)}</p>
            `)}
          </div>
        </section>
      </div>
      <section class="product-companions" aria-labelledby="companions-heading">
        <h2 id="companions-heading" class="store-heading">More for your routine</h2>
        <div class="shop-grid shop-grid--related">${companions.map(renderProductCard).join('')}</div>
      </section>
    </div>
  `;
}
