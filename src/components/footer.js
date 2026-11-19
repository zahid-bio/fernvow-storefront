export function renderFooter() {
  return `
    <footer class="site-footer store-footer" id="site-footer">
      <div class="container store-footer__inner">
        <div class="store-footer__brand">
          <a href="#/" class="site-brand" aria-label="Fernvow home"><span class="site-brand__word">fernvow</span></a>
          <p>Everyday skincare, made simple.</p>
        </div>
        <nav aria-label="Footer shop links">
          <h2>Explore</h2>
          <a href="#/">Shop skincare</a>
          <a href="#/routine">Daily routine</a>
          <a href="#/philosophy">About Fernvow</a>
        </nav>
        <nav aria-label="Customer care">
          <h2>Help</h2>
          <a href="#/policies/shipping">Shipping</a>
          <a href="#/policies/returns">Returns</a>
          <a href="#/policies/contact">Contact</a>
        </nav>
        <div class="store-footer__legal">
          <span>&copy; ${new Date().getFullYear()} Fernvow</span>
          <a href="#/policies/privacy">Privacy</a>
          <a href="#/policies/terms">Terms</a>
        </div>
      </div>
    </footer>
  `;
}
