/**
 * Fernvow Product Catalog
 *
 * All ingredient lists (INCI), pH ranges, fragrance disclosures, directions,
 * and packaging resin details reflect exact formulation specifications.
 */

export const CATALOG_META = {
  brand: 'Fernvow',
  currency: 'USD',
  market: 'US',
};

/**
 * Format a numeric USD price cleanly for customer display.
 * @param {number} amount
 * @param {string} [currency='USD']
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatMoney(amount, currency = 'USD', locale = 'en-US') {
  const numeric = Number(amount);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

const DAILY_CLEANSING_FOAM_INCI =
  'Aqua/Water, Cocamidopropyl Betaine, Rosa Damascena (Rose) Flower Water*, Glycerin, Sucrose Cocoate, Sodium Levulinate, Lactic Acid, Sodium Anisate, Calendula Officinalis (Calendula) Flower Extract*, Chamomilla Recutita (Chamomile) Flower Extract*, Parfum/Fragrance, Benzyl Alcohol, Sodium Benzoate, Potassium Sorbate';

const DAILY_FACE_MOISTURIZER_INCI =
  'Aloe Barbadensis (Aloe) Leaf Juice*, Glycerin, Simmondsia Chinensis (Jojoba) Seed Oil*, Pentylene Glycol, Polyglyceryl-3 Stearate, Cetearyl Alcohol, Sodium PCA, Coco-Caprylate/Caprate, Isoamyl Laurate, Caprylic/Capric Triglyceride, Aqua/Water, Hydrolyzed Rhodophyceae Extract, Mangifera Indica (Mango) Seed Butter*, Xanthan Gum, Cellulose, Octyldodecanol, Potassium Hydroxide, Sodium Hyaluronate, Ascorbyl Palmitate, Sodium Phytate, Tocopherol, Hydrolyzed Hyaluronic Acid';

const HYDRATING_TONER_INCI =
  'Aqua/Water, Rosa Damascena (Rose) Flower Water*, Glycerin**, Sodium PCA, Benzyl Alcohol, Chamomilla Recutita (Chamomile) Flower Extract*, Fragaria Ananassa (Strawberry) Fruit Extract*, Sodium Benzoate, Potassium Sorbate, Sodium Hyaluronate, Lactic Acid, Citric Acid';

export const PRODUCTS = [
  {
    id: 'fernvow-daily-cleansing-foam',
    slug: 'daily-cleansing-foam',
    handle: 'daily-cleansing-foam',
    name: 'Daily Cleansing Foam',
    shortName: 'Cleansing Foam',
    benefit: 'Fresh, clean skin that feels comfortable.',
    subtitle: 'A soft foam that lifts away everyday buildup and leaves skin feeling fresh and comfortable.',
    isHero: true,
    isBundle: false,
    category: 'cleanse',
    stepNumber: '01',
    stepLabel: 'Step 01 · Cleanse',
    price: 34.95,
    compareAtPrice: null,
    savingsAmount: 0,
    sizeDisplay: '150 mL / 5.07 fl oz',
    supplierSku: 'A5852',
    shopifyVariantPlaceholderId: 'gid://shopify/ProductVariant/PENDING_A5852',
    fragranceStatus: 'contains-fragrance',
    fragranceBadge: 'Lightly Scented · Soft Floral',
    fragranceNote:
      'Lightly scented with Parfum/Fragrance (soft spring bloom and rice powder note). See full INCI declaration below.',
    skinTypes: 'All skin types',
    phRange: '4.7–5.1',
    texture: 'Light foaming fluid',
    finish: 'Clean, rinsed finish',
    shortDescription:
      'A gentle daily foaming cleanser formulated with rose flower water, calendula, and chamomile extracts to lift away makeup and daily buildup.',
    editorialSummary:
      'Built as the calm first step of the Fernvow routine, this cloud-light foaming fluid cleanses morning and evening at a skin-balanced pH of 4.7–5.1.',
    routineRole:
      'First step morning and evening to lift away makeup and daily buildup without stripping.',
    keyHighlights: [
      'Skin-balanced pH 4.7–5.1 light foaming fluid for all skin types',
      'Formulated with Rosa Damascena flower water, calendula, and chamomile extracts',
      'Lightly scented with a soft spring bloom and rice powder floral note (contains Parfum/Fragrance)',
      '150 mL / 5.07 fl oz HDPE #2 bottle with PP #5 foaming pump',
    ],
    directions: [
      { step: 1, text: 'Wet the face with lukewarm water.' },
      { step: 2, text: 'Dispense one to two pumps of airy foam into clean hands.' },
      {
        step: 3,
        text: 'Massage gently over face for a few seconds to lift away makeup and impurities.',
      },
      { step: 4, text: 'Rinse thoroughly with lukewarm water, then pat the skin dry.' },
      {
        step: 5,
        text: 'Use morning and evening as your first step, before toner and moisturizer.',
      },
    ],
    inci: DAILY_CLEANSING_FOAM_INCI,
    inciNotes: '*Ingredients from organic farming.',
    packaging: {
      bottle: 'HDPE #2 (High-Density Polyethylene)',
      pumpOrCap: 'PP #5 (Polypropylene) foaming pump & cap',
      recycling:
        'Separate the PP #5 pump and cap from the HDPE #2 bottle before recycling according to local guidance.',
    },
    images: {
      primary: 'assets/photos/daily-cleansing-foam-photo.webp',
      model: 'assets/models/daily-cleansing-foam.glb',
      editorialImage: 'assets/photos/ritual-cleanse.webp',
      editorialAlt: 'Hands working cleanser into a foam beside the Daily Cleansing Foam bottle',
      vectorConcept: 'assets/products/daily-cleansing-foam.svg',
      labelSpec: 'assets/products/label-spec-foam.svg',
      alt: 'Fernvow Daily Cleansing Foam 150 mL matte white bottle with foaming pump',
      previewCaption: '150 mL / 5.07 fl oz matte foaming bottle in sunlit travertine light.',
    },
    bundleComponents: null,
  },
  {
    id: 'fernvow-the-daily-duo',
    slug: 'the-daily-duo',
    handle: 'the-daily-duo',
    name: 'The Daily Duo',
    shortName: 'The Daily Duo',
    benefit: 'Cleanse and moisturize in two easy steps.',
    subtitle: 'Our airy cleanser and light face moisturizer for a simple morning or evening routine.',
    isHero: false,
    isBundle: true,
    category: 'bundle',
    stepNumber: '01 + 03',
    stepLabel: 'Step 01 + 03 · Complete Pair',
    price: 64.95,
    compareAtPrice: 74.90,
    savingsAmount: 9.95,
    sizeDisplay: '150 mL + 50 mL',
    supplierSku: 'A5852 + S0001',
    shopifyVariantPlaceholderId: 'gid://shopify/ProductVariant/PENDING_DAILY_DUO_BUNDLE',
    fragranceStatus: 'mixed-duo',
    fragranceBadge: 'Foam: Lightly Scented · Cream: Fragrance-Free',
    fragranceNote:
      'Pairs the lightly scented Daily Cleansing Foam (contains Parfum/Fragrance) with the completely fragrance-free Daily Face Moisturizer (no added Parfum/Fragrance).',
    skinTypes: 'All skin types, including dry & sensitive',
    phRange: 'Foam pH 4.7–5.1 · Cream pH 5.0–5.3',
    texture: 'Airy foam + weightless cream',
    finish: 'Clean rinse followed by soft, dewy comfort',
    shortDescription:
      'Our two-step daily core routine pairing the 150 mL Daily Cleansing Foam with the 50 mL fragrance-free Daily Face Moisturizer — save $9.95.',
    editorialSummary:
      'Cleanse and comfort morning and evening with two complementary daily formulas — save $9.95 compared to purchasing separately.',
    routineRole:
      'Two-step morning and evening core routine covering both cleansing and daily hydration.',
    keyHighlights: [
      'Includes full-size Daily Cleansing Foam (150 mL / 5.07 fl oz)',
      'Includes full-size Daily Face Moisturizer (50 mL / 1.69 fl oz)',
      'Saves $9.95 compared to the $74.90 combined single-item price',
      'Complementary pH balance across both steps (4.7–5.3)',
    ],
    directions: [
      {
        step: 1,
        text: 'Step 01 — Cleanse: Wet face with lukewarm water, massage Daily Cleansing Foam gently over skin, rinse thoroughly, and pat dry.',
      },
      {
        step: 2,
        text: 'Step 03 — Moisturize: Apply a small amount of fragrance-free Daily Face Moisturizer to clean skin (after toning, if used) and massage until absorbed.',
      },
      {
        step: 3,
        text: 'Repeat morning and evening for steady daily barrier comfort.',
      },
    ],
    inci:
      `Daily Cleansing Foam (150 mL): ${DAILY_CLEANSING_FOAM_INCI}\n\nDaily Face Moisturizer (50 mL): ${DAILY_FACE_MOISTURIZER_INCI}`,
    inciNotes: '*Ingredients from organic farming.',
    packaging: {
      bottle: 'Foam: HDPE #2 bottle · Moisturizer: PP #5 airless bottle',
      pumpOrCap: 'Foam: PP #5 foaming pump · Moisturizer: Mono-material PP #5 airless actuator',
      recycling:
        'Foam: separate PP #5 pump from HDPE #2 bottle before recycling. Moisturizer: mono-material PP #5 (no separation needed).',
    },
    images: {
      primary: 'assets/photos/the-daily-duo-photo.webp',
      model: 'assets/models/the-daily-duo.glb',
      editorialImage: 'assets/photos/ritual-duo.webp',
      editorialAlt: 'The Daily Duo on folded linen beside a ceramic tray',
      vectorConcept: 'assets/products/the-daily-duo.svg',
      labelSpec: null,
      alt: 'Fernvow The Daily Duo featuring Daily Cleansing Foam 150 mL and Daily Face Moisturizer 50 mL',
      previewCaption: 'Full-size 150 mL Daily Cleansing Foam paired with the 50 mL Daily Face Moisturizer.',
    },
    bundleComponents: [
      {
        productSlug: 'daily-cleansing-foam',
        name: 'Daily Cleansing Foam',
        size: '150 mL / 5.07 fl oz',
        supplierSku: 'A5852',
        quantity: 1,
        unitPrice: 34.95,
        fragranceBadge: 'Lightly Scented · Soft Floral',
      },
      {
        productSlug: 'daily-face-moisturizer',
        name: 'Daily Face Moisturizer',
        size: '50 mL / 1.69 fl oz',
        supplierSku: 'S0001',
        quantity: 1,
        unitPrice: 39.95,
        fragranceBadge: 'Fragrance-Free',
      },
    ],
  },
  {
    id: 'fernvow-daily-face-moisturizer',
    slug: 'daily-face-moisturizer',
    handle: 'daily-face-moisturizer',
    name: 'Daily Face Moisturizer',
    shortName: 'Face Moisturizer',
    benefit: 'Soft skin with a light, comfortable finish.',
    subtitle: 'A light daily cream that leaves skin feeling soft and hydrated.',
    isHero: false,
    isBundle: false,
    category: 'moisturize',
    stepNumber: '03',
    stepLabel: 'Step 03 · Moisturize',
    price: 39.95,
    compareAtPrice: null,
    savingsAmount: 0,
    sizeDisplay: '50 mL / 1.69 fl oz',
    supplierSku: 'S0001',
    shopifyVariantPlaceholderId: 'gid://shopify/ProductVariant/PENDING_S0001',
    fragranceStatus: 'fragrance-free',
    fragranceBadge: 'Fragrance-Free',
    fragranceNote:
      'Fragrance-free formula with zero added Parfum/Fragrance in the complete INCI ingredient list.',
    skinTypes: 'All skin types, including sensitive and dehydrated skin',
    phRange: '5.0–5.3',
    texture: 'Light silky cream',
    finish: 'Soft dewy, non-greasy',
    shortDescription:
      'A fragrance-free daily cream with aloe leaf juice, jojoba seed oil, mango seed butter, and multi-weight hyaluronic acid for comfortable hydration.',
    editorialSummary:
      'Formulated without added fragrance for all skin types including sensitive and dehydrated skin, this airless-pump light cream leaves a soft, dewy finish without heaviness.',
    routineRole:
      'Final moisturizing step morning and evening after cleansing (and after Hydrating Toner, if used).',
    keyHighlights: [
      'Completely fragrance-free (no added Parfum/Fragrance)',
      'pH 5.0–5.3 light cream with a soft dewy, non-greasy finish',
      'Made with aloe leaf juice, jojoba seed oil, mango seed butter, sodium PCA & hyaluronic acid',
      '50 mL / 1.69 fl oz mono-material PP #5 airless bottle',
    ],
    directions: [
      { step: 1, text: 'Apply to clean skin after cleansing (and toning, if used).' },
      { step: 2, text: 'Dispense one pump and massage gently over the face until absorbed.' },
      { step: 3, text: 'Use morning and evening.' },
    ],
    inci: DAILY_FACE_MOISTURIZER_INCI,
    inciNotes: '*Ingredients from organic farming.',
    packaging: {
      bottle: 'PP #5 (Polypropylene) airless bottle',
      pumpOrCap: 'PP #5 (Polypropylene) airless pump & cap',
      recycling:
        'Mono-material PP #5 across bottle, actuator, and cap — no separation required before local recycling.',
    },
    images: {
      primary: 'assets/photos/daily-face-moisturizer-photo.webp',
      model: 'assets/models/daily-face-moisturizer.glb',
      editorialImage: 'assets/photos/ritual-moisturize.webp',
      editorialAlt: 'A small amount of face moisturizer applied to the back of a hand',
      vectorConcept: 'assets/products/daily-face-moisturizer.svg',
      labelSpec: 'assets/products/label-spec-moisturizer.svg',
      alt: 'Fernvow Daily Face Moisturizer 50 mL slim matte white airless pump bottle',
      previewCaption: '50 mL / 1.69 fl oz mono-material airless dispenser designed for clean dosing.',
    },
    bundleComponents: null,
  },
  {
    id: 'fernvow-hydrating-toner',
    slug: 'hydrating-toner',
    handle: 'hydrating-toner',
    name: 'Hydrating Toner',
    shortName: 'Hydrating Toner',
    benefit: 'A light layer of hydration after cleansing.',
    subtitle: 'A refreshing, water-light toner for a little extra hydration after you cleanse.',
    isHero: false,
    isBundle: false,
    category: 'tone',
    stepNumber: '02',
    stepLabel: 'Step 02 · Tone',
    price: 29.95,
    compareAtPrice: null,
    savingsAmount: 0,
    sizeDisplay: '200 mL / 6.76 fl oz',
    supplierSku: 'A5805',
    shopifyVariantPlaceholderId: 'gid://shopify/ProductVariant/PENDING_A5805',
    fragranceStatus: 'fragrance-free',
    fragranceBadge: 'Fragrance-Free',
    fragranceNote:
      'Fragrance-free with zero added Parfum/Fragrance; carries only the subtle natural botanical character of rose flower water and chamomile.',
    skinTypes: 'Dry, dehydrated, or tired skin',
    phRange: '4.70–5.10',
    texture: 'Water-light fluid',
    finish: 'Weightless, refreshed',
    shortDescription:
      'A water-light hydrating bridge with rose flower water, chamomile, strawberry fruit extract, sodium PCA, and sodium hyaluronate.',
    editorialSummary:
      'Crafted as a weightless hydration bridge between cleansing and moisturizing, this 200 mL fragrance-free toner replenishes moisture before sealing in cream.',
    routineRole:
      'Optional second step morning and evening pressed into clean skin right before Daily Face Moisturizer.',
    keyHighlights: [
      'Completely fragrance-free (zero added Parfum/Fragrance)',
      'pH 4.70–5.10 water-light fluid with a weightless finish',
      'Made with rose flower water, sodium PCA, chamomile, strawberry extract & sodium hyaluronate',
      '200 mL / 6.76 fl oz PET #1 bottle with PP #5 disc-top cap',
    ],
    directions: [
      { step: 1, text: 'Apply to clean skin right after cleansing.' },
      {
        step: 2,
        text: 'Splash a few drops into palms and press gently across face, or sweep with a soft pad. Avoid direct contact with eyes.',
      },
      { step: 3, text: 'Follow with Daily Face Moisturizer.' },
      { step: 4, text: 'Use morning and evening.' },
    ],
    inci: HYDRATING_TONER_INCI,
    inciNotes: '*Ingredients from organic farming. **Made using organic ingredients.',
    packaging: {
      bottle: 'PET #1 (Polyethylene Terephthalate)',
      pumpOrCap: 'PP #5 (Polypropylene) disc-top cap',
      recycling:
        'Separate the PP #5 disc-top cap from the PET #1 bottle before recycling according to local guidance.',
    },
    images: {
      primary: 'assets/photos/hydrating-toner-photo.webp',
      model: 'assets/models/hydrating-toner.glb',
      editorialImage: 'assets/photos/ritual-tone.webp',
      editorialAlt: 'Drops of toner falling into a hand beside the Hydrating Toner bottle',
      vectorConcept: 'assets/products/hydrating-toner.svg',
      labelSpec: 'assets/products/label-spec-toner.svg',
      alt: 'Fernvow Hydrating Toner 200 mL matte white bottle with disc-top cap',
      previewCaption: '200 mL / 6.76 fl oz disc-top bottle crafted for generous daily layering.',
    },
    bundleComponents: null,
  },
];

/**
 * Look up a single product by slug.
 * @param {string} slug
 * @returns {object|null}
 */
export function getProductBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  return PRODUCTS.find((product) => product.slug === slug) || null;
}
