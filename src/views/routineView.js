import { getProductBySlug } from '../data/catalog.js';
import { iconSvg } from '../components/header.js';
import { renderProductCard } from './homeView.js';

export function renderRoutineView() {
  const steps = [
    ['Cleanse', 'daily-cleansing-foam'],
    ['Tone, if you like', 'hydrating-toner'],
    ['Moisturize', 'daily-face-moisturizer'],
  ];
  return `
    <div class="container routine-page">
      <header class="routine-page__intro">
        <h1 class="store-heading">Your daily routine</h1>
        <p>Start with a gentle wash, add toner if you like, then smooth on moisturizer.</p>
      </header>
      <img class="routine-page__banner" src="assets/photos/editorial-routine-lineup.jpg"
        alt="Fernvow cleanser, toner and moisturizer arranged on a stone counter" />
      <ol class="shop-grid shop-grid--related routine-page__steps">
        ${steps.map(([label, slug]) => `<li><h2>${label}</h2>${renderProductCard(getProductBySlug(slug))}</li>`).join('')}
      </ol>
      <div class="routine-page__duo">
        <h2 class="store-heading">Prefer two steps?</h2>
        <p>The Daily Duo pairs our cleanser with a light, fragrance-free moisturizer.</p>
        <a class="btn btn--fern" href="#/product/the-daily-duo">Shop The Daily Duo ${iconSvg('icon-arrow-right', 'icon--sm')}</a>
      </div>
    </div>
  `;
}
