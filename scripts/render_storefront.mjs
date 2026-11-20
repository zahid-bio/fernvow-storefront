import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { escapeHtml, renderHeader } from '../src/components/header.js';
import { renderFooter } from '../src/components/footer.js';
import { PRODUCTS } from '../src/data/catalog.js';
import { POLICIES } from '../src/data/policies.js';
import { getPageMetadata, getPageTags, SITE_ORIGIN } from '../src/data/seo.js';
import { renderBrandView } from '../src/views/brandView.js';
import { renderHomeView } from '../src/views/homeView.js';
import { renderPoliciesView } from '../src/views/policiesView.js';
import { renderProductView } from '../src/views/productView.js';
import { renderRoutineView } from '../src/views/routineView.js';

const [templatePath, output] = process.argv.slice(2);
const template = readFileSync(templatePath, 'utf-8');
const pages = [
  [{ name: 'home' }, renderHomeView({})],
  ...PRODUCTS.map(({ slug }) => [{ name: 'product', slug }, renderProductView({ slug })]),
  [{ name: 'routine' }, renderRoutineView()],
  [{ name: 'philosophy' }, renderBrandView()],
  ...Object.keys(POLICIES).map((section) => [
    { name: 'policies', section },
    renderPoliciesView({ section, checkoutEnabled: true }),
  ]),
];

const urls = [];
for (const [route, body] of pages) {
  const page = getPageMetadata(route);
  const url = SITE_ORIGIN + page.path;
  const tags = Object.entries(getPageTags(page)).map(([key, value]) => {
    const attr = key.startsWith('og:') ? 'property' : 'name';
    return `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  });
  const data = JSON.stringify(page.structuredData || {}).replaceAll('<', '\\u003c');
  const head = [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    ...tags,
    `<script type="application/ld+json" id="product-structured-data">${data}</script>`,
  ];
  const html = template
    .replace(/<title>[^<]+<\/title>/, () => `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<!-- store-metadata:start -->[\s\S]*?<!-- store-metadata:end -->/, () => head.join('\n  '))
    .replace('<div id="header-root"></div>', () => `<div id="header-root">${renderHeader({ route })}</div>`)
    .replace('<main id="main-content" class="site-main" tabindex="-1"></main>',
      () => `<main id="main-content" class="site-main" tabindex="-1">${body}</main>`)
    .replace('<div id="footer-root"></div>', () => `<div id="footer-root">${renderFooter()}</div>`);
  const file = join(output, page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  urls.push(url);
}

writeFileSync(join(output, 'robots.txt'), `User-agent: *\nDisallow: /api/\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
writeFileSync(join(output, 'sitemap.xml'), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`),
  '</urlset>',
  '',
].join('\n'));
