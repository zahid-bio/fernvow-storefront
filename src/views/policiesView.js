import { POLICIES } from '../data/policies.js';
import { escapeHtml, iconSvg } from '../components/header.js';

const POLICY_TABS = [
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'returns', label: 'Returns & Exchanges' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms of Use' },
  { id: 'contact', label: 'Contact & Care' },
];

export function renderPoliciesView({ section = 'shipping', checkoutEnabled = false }) {
  const activeId = POLICY_TABS.some((tab) => tab.id === section) ? section : 'shipping';
  const activePolicy = POLICIES[activeId] || POLICIES.shipping;

  return `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Care &amp; Store Policies</span>
        <h1 class="page-hero__title">${escapeHtml(activePolicy.title)}</h1>
        ${!checkoutEnabled && ['shipping', 'returns'].includes(activeId) ? `
          <p class="policy-preview-note">This policy will be confirmed before online orders open.</p>
        ` : ''}
        <p class="lead-copy page-hero__lead">
          ${escapeHtml(activePolicy.summary)}
        </p>
      </div>
    </section>

    <div class="container" style="padding-bottom: clamp(3rem, 6vw, 5.5rem);">
      <div class="policies-layout">
        <nav class="policies-nav" aria-label="Policy sections">
          ${POLICY_TABS.map(
            (tab) => `
            <a
              href="#/policies/${escapeHtml(tab.id)}"
              class="policies-nav__link ${activeId === tab.id ? 'is-active' : ''}"
              ${activeId === tab.id ? 'aria-current="page"' : ''}
            >
              <span>${escapeHtml(tab.label)}</span>
              ${iconSvg('icon-arrow-right', 'icon--sm')}
            </a>
          `
          ).join('')}
        </nav>

        <article class="policy-article">
          <span class="eyebrow">${escapeHtml(activePolicy.eyebrow)}</span>
          <div class="policy-sections">
            ${activePolicy.sections
              .map(
                (block) => `
              <div class="policy-section-block">
                <h2>${escapeHtml(block.heading)}</h2>
                <p>${escapeHtml(block.body)}</p>
              </div>
            `
              )
              .join('')}
          </div>

          ${activeId === 'contact' ? `
            <div><a class="btn btn--fern" href="mailto:care@fernvow.com">Email customer care</a></div>
          ` : ''}
        </article>
      </div>
    </div>
  `;
}
