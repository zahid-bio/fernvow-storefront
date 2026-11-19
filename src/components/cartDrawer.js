import { formatMoney } from '../data/catalog.js';
import { escapeHtml, iconSvg } from './header.js';

export function renderCartDrawer({ isOpen, cart, isCheckingOut, checkoutMessage, preview }) {
  if (!isOpen) return '';

  const items = cart?.items || [];

  return `
    <div class="drawer-backdrop overlay-backdrop" data-action="close-cart"></div>
    <aside id="cart-drawer" class="cart-drawer overlay-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <div class="cart-drawer__head">
        <h2 id="cart-drawer-title" class="cart-drawer__title">Your bag (${cart?.itemCount || 0})</h2>
        <button type="button" class="icon-btn" data-action="close-cart" aria-label="Close shopping bag">${iconSvg('icon-close')}</button>
      </div>

      <div class="cart-drawer__body">
        ${items.length === 0 ? `
          <div class="cart-drawer__empty">
            <p class="lead-copy">Your bag is empty.</p>
            <a class="btn btn--fern" href="#/" data-action="close-cart">Browse skincare</a>
          </div>
        ` : `
          <div class="cart-items-list">
            ${items.map(({ slug, quantity, product, lineTotal }) => `
              <article class="cart-item">
                <div class="cart-item__media">
                  <img src="${escapeHtml(product.images.primary)}" alt="" width="76" height="90" />
                </div>
                <div class="cart-item__content">
                  <h3 class="cart-item__name"><a href="#/product/${slug}" data-action="close-cart">${escapeHtml(product.name)}</a></h3>
                  <div class="cart-item__controls">
                    <div class="qty-stepper" role="group" aria-label="Quantity for ${escapeHtml(product.name)}">
                      <button type="button" class="qty-stepper__btn" data-action="cart-qty" data-slug="${slug}"
                        data-qty="${quantity - 1}" data-change="decrease" aria-label="Decrease quantity of ${escapeHtml(product.name)}">
                        ${iconSvg('icon-minus')}
                      </button>
                      <span class="qty-stepper__val">${quantity}</span>
                      <button type="button" class="qty-stepper__btn" data-action="cart-qty" data-slug="${slug}"
                        data-qty="${quantity + 1}" data-change="increase" aria-label="Increase quantity of ${escapeHtml(product.name)}">
                        ${iconSvg('icon-plus')}
                      </button>
                    </div>
                    <strong class="cart-item__price">${formatMoney(lineTotal)}</strong>
                  </div>
                  <button type="button" class="cart-remove" data-action="remove-cart-item" data-slug="${slug}"
                    aria-label="Remove ${escapeHtml(product.name)} from bag">Remove</button>
                </div>
              </article>
            `).join('')}
          </div>
        `}
      </div>

      ${items.length ? `
        <div class="cart-drawer__foot">
          <div class="cart-summary-row cart-summary-row--total">
            <span>Subtotal</span><strong>${formatMoney(cart.subtotal)}</strong>
          </div>
          <p class="cart-drawer__note">Shipping and tax are calculated at checkout.</p>
          <button type="button" class="btn btn--fern btn--full" data-action="prepare-checkout"
            aria-disabled="${String(isCheckingOut)}">
            ${isCheckingOut ? 'Opening checkout…' : 'Checkout'}
            ${isCheckingOut ? '' : iconSvg('icon-arrow-right', 'icon--sm')}
          </button>
          ${preview ? '<p class="cart-drawer__note">Store preview. Orders are currently closed.</p>' : ''}
          ${checkoutMessage ? `<p class="cart-checkout-status" role="status">${escapeHtml(checkoutMessage)}</p>` : ''}
        </div>
      ` : ''}
    </aside>
  `;
}
