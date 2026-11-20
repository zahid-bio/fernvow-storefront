import { getProductBySlug } from '../data/catalog.js';
import { iconSvg } from '../components/header.js';
import { renderProductCard } from './homeView.js';

export function renderRoutineView() {
  const steps = [
    ['Cleanse', 'daily-cleansing-foam'],
    ['Tone', 'hydrating-toner'],
    ['Moisturize', 'daily-face-moisturizer'],
  ];
  return `
    <div class="container routine-page">
      <header class="routine-page__intro">
        <h1 class="store-heading">Your daily routine</h1>
        <p>Start with a gentle cleanse, follow with a layer of Hydrating Toner, and finish with Daily Face Moisturizer.</p>
      </header>
      <img class="routine-page__banner" src="/assets/photos/editorial-routine-lineup.jpg"
        alt="Fernvow cleanser, toner and moisturizer arranged on a stone counter" />
      <ol class="shop-grid shop-grid--related routine-page__steps">
        ${steps.map(([label, slug]) => `<li><h2>${label}</h2>${renderProductCard(getProductBySlug(slug))}</li>`).join('')}
      </ol>
      <div class="routine-page__sets">
        <h2 class="store-heading">Shop the full routine.</h2>
        <p>The Daily Trio brings all three full-size formulas together.</p>
        <div class="routine-page__set-links">
          <a class="btn btn--fern" href="/product/the-daily-trio">Shop The Daily Trio ${iconSvg('icon-arrow-right', 'icon--sm')}</a>
          <a class="store-text-link" href="/product/the-daily-duo">Shop the two-step Duo</a>
        </div>
      </div>
    </div>
  `;
}
