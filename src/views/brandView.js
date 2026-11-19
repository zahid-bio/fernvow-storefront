import { iconSvg } from '../components/header.js';

export function renderBrandView() {
  return `
    <section class="container routine-page" aria-labelledby="about-title">
      <div class="routine-page__intro">
        <h1 class="store-heading" id="about-title">About Fernvow</h1>
        <p>Simple skincare for the start and end of your day.</p>
      </div>
      <div class="routine-feature brand-feature">
        <img src="assets/photos/editorial-botanical-wall.jpg" alt="Soft fern shadows on a sunlit wall" width="896" height="1200" />
        <div class="routine-feature__copy">
          <h2 class="store-heading">A little time for yourself.</h2>
          <p>We make a gentle cleanser, a refreshing toner and a light moisturizer. Use them together or keep the steps that work for you.</p>
          <a href="#/routine" class="btn btn--fern">See the daily routine ${iconSvg('icon-arrow-right', 'icon--sm')}</a>
        </div>
      </div>
    </section>
  `;
}
