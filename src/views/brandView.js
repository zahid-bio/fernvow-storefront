import { iconSvg } from '../components/header.js';

export function renderBrandView() {
  return `
    <section class="container routine-page" aria-labelledby="about-title">
      <header class="routine-page__intro">
        <h1 class="store-heading" id="about-title">About Fernvow</h1>
      </header>
      <div class="routine-feature brand-feature">
        <img src="assets/photos/editorial-botanical-wall.jpg" alt="Soft fern shadows on a sunlit wall" width="896" height="1200" />
        <div class="routine-feature__copy">
          <h2 class="store-heading">A little time for yourself.</h2>
          <p>Fernvow is for the few minutes you spend at the sink, when you’re getting ready in the morning or washing the day away. We make skincare that feels good to put on and is easy to make part of a routine.</p>
          <a href="#/routine" class="btn btn--fern">See the daily routine ${iconSvg('icon-arrow-right', 'icon--sm')}</a>
        </div>
      </div>
      <section class="brand-approach" aria-labelledby="brand-approach-title">
        <h2 class="store-heading" id="brand-approach-title">What we pay attention to.</h2>
        <div class="brand-approach__points">
          <div>
            <h3>How it feels at the sink</h3>
            <p>An airy foam should rinse clean. A toner should feel light under the next layer. A daily moisturizer should leave skin comfortable. We think about the experience of using each formula, from the first pump to the finish.</p>
          </div>
          <div>
            <h3>What you’re reaching for</h3>
            <p>Every product page tells you when to use the formula, what the texture and finish feel like, and whether it’s fragrance-free. You’ll find the full ingredient list there too.</p>
          </div>
        </div>
      </section>
      <section class="brand-collection" aria-labelledby="brand-collection-title">
        <div>
          <h2 class="store-heading" id="brand-collection-title">Our first collection.</h2>
          <p>We’re starting with a cleansing foam, a hydrating toner, and a daily face moisturizer. As Fernvow grows, we plan to bring the same care to more products you can reach for every day.</p>
        </div>
        <a class="btn btn--fern" href="#collection">Shop the collection ${iconSvg('icon-arrow-right', 'icon--sm')}</a>
      </section>
    </section>
  `;
}
