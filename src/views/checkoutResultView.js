import { escapeHtml } from '../components/header.js';

const states = {
  loading: ['Checking your payment', 'We’re checking the status with the payment provider.'],
  paid: ['Payment confirmed', 'Thank you for shopping Fernvow.'],
  pending: ['Payment is awaiting confirmation', 'Check the status again before placing another order.'],
  cancelled: ['Checkout closed', 'You can return to your bag when you’re ready.'],
  error: ['Payment status is unavailable', 'Check the status again before placing another order.'],
};

export function renderCheckoutResultView({ status, reference }) {
  const [title, message] = states[status] || states.error;
  const retry = status === 'pending' || status === 'error';
  const reopen = status === 'cancelled';

  return `
    <section class="container section-block checkout-result">
      <span class="eyebrow">Checkout</span>
      <div role="status">
        <h1 class="store-heading">${title}</h1>
        <p class="lead-copy">${message}</p>
      </div>
      ${reference ? `<p class="checkout-result__reference">Reference ${escapeHtml(reference)}</p>` : ''}
      ${retry ? '<button type="button" class="btn btn--fern" data-action="check-payment-status">Check payment status</button>' : ''}
      ${reopen ? '<button type="button" class="btn btn--fern" data-action="open-cart">Open bag</button>' : ''}
      <a href="/" class="btn btn--outline">Keep shopping</a>
    </section>
  `;
}
