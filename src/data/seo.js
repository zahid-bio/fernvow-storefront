import { getProductBySlug } from './catalog.js';
import { POLICIES } from './policies.js';

export const SITE_ORIGIN = 'https://fernvow.com';
const lineup = '/assets/photos/editorial-routine-lineup.jpg';
const home = {
  path: '/',
  title: 'Fernvow | Daily Skincare for Cleansing and Hydration',
  description: 'Shop Fernvow’s Daily Cleansing Foam, Hydrating Toner, Daily Face Moisturizer and skincare sets for a simple morning or evening routine.',
  image: lineup,
  imageAlt: 'Fernvow cleanser, toner and moisturizer on a sunlit stone shelf',
};

export function getPageMetadata(route) {
  switch (route.name) {
    case 'product': {
      const product = getProductBySlug(route.slug);
      if (!product) return { ...home, title: 'Product Not Found | Fernvow', noindex: true };
      const path = `/product/${product.slug}`;
      return {
        path,
        title: `${product.name} | Fernvow`,
        description: product.subtitle,
        image: `/${product.images.primary}`,
        imageAlt: product.images.alt,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.subtitle,
          url: `${SITE_ORIGIN}${path}`,
          image: [product.images.primary, product.images.editorialImage].map((image) => `${SITE_ORIGIN}/${image}`),
          sku: product.id,
          brand: { '@type': 'Brand', name: 'Fernvow' },
          offers: {
            '@type': 'Offer',
            url: `${SITE_ORIGIN}${path}`,
            priceCurrency: 'USD',
            price: product.price.toFixed(2),
          },
        },
      };
    }
    case 'routine':
      return { ...home, path: '/routine', title: 'Daily Skincare Routine | Fernvow',
        description: 'See how to use your Fernvow cleanser, hydrating toner and moisturizer in a morning or evening skincare routine.' };
    case 'brand':
    case 'philosophy':
      return { ...home, path: '/philosophy', title: 'About Fernvow | Daily Skincare',
        description: 'Meet Fernvow and the idea behind our first skincare collection of daily formulas and sets.' };
    case 'policies': {
      const policy = POLICIES[route.section] || POLICIES.shipping;
      return { ...home, path: `/policies/${policy.slug}`, title: `${policy.title} | Fernvow`,
        description: policy.summary };
    }
    case 'checkout':
      return { ...home, title: 'Checkout | Fernvow', noindex: true };
    default:
      return home;
  }
}

export function getPageTags(page) {
  return {
    description: page.description,
    robots: page.noindex ? 'noindex' : 'index, follow',
    'og:type': page.structuredData ? 'product' : 'website',
    'og:site_name': 'Fernvow',
    'og:title': page.title,
    'og:description': page.description,
    'og:url': SITE_ORIGIN + page.path,
    'og:image': SITE_ORIGIN + page.image,
    'og:image:alt': page.imageAlt,
    'twitter:card': 'summary_large_image',
  };
}
