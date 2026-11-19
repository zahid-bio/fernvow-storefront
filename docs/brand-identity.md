# Fernvow Brand Identity & Packaging Specification

> **Status:** Concept & Digital Storefront System (`PREVIEW CONCEPT — PENDING SELFNAMED PRINT DIELINE`)\
> **Aesthetic Direction:** Quiet luxury, high-contrast editorial serif restraint, sunlit botanical warmth on alabaster plaster (`Sonnette` editorial poise + `Nestify` structural clarity).

---

## 1. Logo Anatomy & Asset Suite

Fernvow's mark pairs two pure-vector geometric elements crafted entirely from cubic Bézier `<path>` outlines (zero `<text>` dependencies in standalone logo files, ensuring identical rendering across all browsers, print proofs, and favicons):

1. **Botanical Fern Frond + Open Vow-Arc Emblem (`64 × 64`):**
   - **Vow-Arc:** A `1.45px` open circular ring (`r = 24`, centered at `32, 33`) leaving a `70°` breathing gap at the upper right where the frond tip emerges freely, anchored by a delicate `1.4px` spore/dew point along the arc path.
   - **Fern Frond:** A tapered calligraphic rachis rising from the lower base of the arc with 13 alternating lanceolate pinnae drawn as closed organic Bézier silhouettes.
2. **Pure-Vector Wordmark `fernvow` (`360 × 72`):**
   - Custom lowercase high-contrast editorial serif vector paths (`4.5` unit main stems, `1.25–1.35` unit crossbars and hairlines, teardrop ball terminals on `f` and `r`, bracketed baseline serifs, optical kerning).

### Logo Files (`assets/brand/`)

| File | ViewBox | Colorway | Primary Use |
| :--- | :--- | :--- | :--- |
| `fernvow-emblem.svg` | `0 0 64 64` | Obsidian `#181B17` | Stamps, footer seals, editorial accents |
| `fernvow-emblem-fern.svg` | `0 0 64 64` | Deep Fern `#3E4F3D` | Packaging PDP headers, botanical badges |
| `fernvow-wordmark.svg` | `0 0 360 72` | Obsidian `#181B17` | Editorial headers, minimal lockups |
| `fernvow-wordmark-light.svg` | `0 0 360 72` | Alabaster `#F6F4EF` | Dark Obsidian surfaces |
| `fernvow-lockup-horizontal.svg` | `0 0 430 72` | Obsidian `#181B17` | Primary desktop & mobile header |
| `fernvow-lockup-stacked.svg` | `0 0 280 140` | Obsidian `#181B17` | Packaging cards, center-aligned modals |
| `fernvow-lockup-light.svg` | `0 0 430 72` | Alabaster `#F6F4EF` | Dark footer / editorial overlays |
| `fernvow-favicon.svg` | `0 0 32 32` | Alabaster `#F6F4EF` tile + `#181B17` mark | Browser tab & app icon |

### Clear Space & Minimum Sizes
- **Clear Space:** Maintain minimum clear space equal to `1×` the cap-height of the `f` ascender (`~42%` of lockup height) on all four sides of any lockup, and `0.25×` diameter around the standalone emblem.
- **Minimum Digital Sizes:**
  - Emblem: `24 × 24 px` (`16 × 16 px` reserved strictly for the `fernvow-favicon.svg` tile variant with thickened `2.1` arc stroke).
  - Wordmark: `96 px` wide.
  - Horizontal Lockup: `124 px` wide.
  - Stacked Lockup: `110 px` wide.
- **Misuse Guardrails:** Never stretch non-proportionally, apply drop shadows to logo paths, swap to unapproved web-font `<text>` fallbacks inside logo files, or place dark marks on low-contrast oat/stone backgrounds without checking contrast.

---

## 2. Color Tokens

| Token Name | Hex / RGBA | Role |
| :--- | :--- | :--- |
| **Obsidian Ink** | `#181B17` | Primary typography, borders, primary dark marks, dark surfaces |
| **Warm Sunlit Alabaster** | `#F6F4EF` | Primary canvas background, light text/marks on Obsidian |
| **Crisp Paper** | `#FFFFFF` | Elevated product surfaces, studio specular highlights |
| **Oat** | `#ECE8DF` | Secondary surface bands, trust strip, architectural plinths |
| **Deep Fern** | `#3E4F3D` | Botanical accent, step labels, Fragrance-Free indicators |
| **Muted Stone** | `#595D56` | Secondary metadata, INCI legends, captions |
| **Hairline** | `rgba(24, 27, 23, 0.14)` | `1px` architectural rules, card dividers, label boundaries |

---

## 3. Typography Pairing (Web & Packaging)

- **Editorial Display / Product Titles:** Tall condensed high-contrast editorial serif (`Cormorant Garamond` / `Playfair Display` on web; pure vector paths for brand wordmark; `Georgia` fallback inside self-contained SVG packaging renders).
- **UI Body, Technical Specs & INCI:** Clean geometric grotesk sans (`Inter` / `Plus Jakarta Sans` on web; `'Helvetica Neue', Arial, sans-serif` inside standalone SVG spec previews) with generous tracking (`+0.12em` to `+0.22em`) for uppercase step eyebrows (`STEP 01 · CLEANSE`).

---

## 4. Bespoke Iconography (`assets/icons/fernvow-icons.svg`)

All 25 storefront and ritual icons live in a single `<defs>`/`<symbol>` SVG sprite (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.35"`, `stroke-linecap="round"`, `stroke-linejoin="round"`):

- **Navigation & Commerce:** `icon-bag`, `icon-search`, `icon-menu`, `icon-close`, `icon-arrow-right`, `icon-arrow-up-right`, `icon-arrow-left`, `icon-chevron-down`, `icon-plus`, `icon-minus`, `icon-trash`, `icon-check`, `icon-info`.
- **Routine & Formula Attributes:** `icon-step-cleanse`, `icon-step-tone`, `icon-step-moisturize`, `icon-duo`, `icon-fragrance-free`, `icon-scent-note`, `icon-sun-moon`, `icon-label-spec`.
- **Trust & Packaging:** `icon-recycle`, `icon-shipping`, `icon-returns`, `icon-support`.

Always inherit color via CSS (`color: currentColor`) and maintain integer display sizes (`18px`, `20px`, `24px`) so `1.35px` hairlines align cleanly to device pixels.

---

## 5. Packaging Concept & Print Readiness

### Honest Selfnamed Cylindrical Proportions
All packaging renders (`assets/products/*.svg`) and `assets/editorial/routine-still-life.svg` preserve the exact white cylindrical silhouettes of Selfnamed's US-fulfilled bottles:

| Product | Supplier SKU | Volume | Cylinder & Ratio | Closure / Dispenser | Resin & Recycling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Daily Cleansing Foam** | `A5852` | `150 mL / 5.07 fl oz` | Wide matte white **HDPE #2** cylinder, gently rounded base (`~1:2.1`) | Stepped wide white **PP #5** foaming pump collar with left-pointing horizontal foaming nozzle | Separate PP #5 pump & cap from HDPE #2 bottle |
| **Hydrating Toner** | `A5805` | `200 mL / 6.76 fl oz` | Tall sturdy matte white **PET #1** cylinder, crisp slight shoulder (`~1:2.55`) | Centered white **PP #5** disc-top cylindrical cap (`~52%` bottle width) | Separate PP #5 cap from PET #1 bottle |
| **Daily Face Moisturizer** | `S0001` | `50 mL / 1.69 fl oz` | Slim tall matte white **PP #5** airless cylinder (`~1:3.1`) | Low-profile stepped white **PP #5** airless actuator with slight slanted top & left micro-orifice | Mono-material PP #5 (no separation required) |

### Fragrance Accuracy & Compliance Guardrails
1. **Daily Cleansing Foam (`A5852`) CONTAINS `Parfum/Fragrance`:** Never label or describe Cleansing Foam as "Fragrance Free." Front PDP concepts display `SOFT FLORAL SCENT` and note `Contains Parfum/Fragrance`.
2. **Daily Face Moisturizer (`S0001`) IS Fragrance Free:** Front PDP displays `FRAGRANCE FREE`.
3. **Hydrating Toner (`A5805`) has No Added Fragrance:** Front PDP displays `FRAGRANCE FREE` (`No Added Fragrance`).
4. **Pending Print Gates (explicitly marked in `assets/products/label-spec-*.svg`):**
   - `PREVIEW CONCEPT — PENDING SELFNAMED PRINT DIELINE`: Final wrap dimensions, bleed, and safe zones must be transferred onto Selfnamed's official print dielines prior to production upload.
   - `[PENDING: US MoCRA Responsible Person Name, Address & Adverse Event Contact]`: Required on US-marketed cosmetic labels prior to print release.
   - **No Unapproved Claims:** Do NOT place ECOCERT/COSMOS certification logos or organic percentage claims on labels or packaging renders until formal certification transfer and Selfnamed compliance approval are completed.

---

## 6. Concept Photography vs. Pure Vector Identity

To achieve gallery-grade editorial warmth while keeping Fernvow's core brand geometry mathematically exact and infinitely scalable, the visual system separates **permanent pure-vector identity assets** from **pre-launch concept photography**:

### Permanent Pure-Vector Assets (100% Hand-Crafted SVG)
- **Brand Marks (`assets/brand/*.svg`):** Pure cubic Bézier paths with zero `<text>` or external font dependencies.
- **UI & Routine Iconography (`assets/icons/fernvow-icons.svg`):** 25 hairline (`1.35px`) SVG `<symbol>` definitions.
- **Packaging Vector Renders & Label Specs (`assets/products/*.svg`):** Exact proportional bottle vector illustrations and flat two-panel dieline specification sheets (`label-spec-foam.svg`, `label-spec-moisturizer.svg`, `label-spec-toner.svg`), plus editorial vector artworks (`assets/editorial/*.svg`).

### Studio & Editorial Concept Photography (`assets/photos/*.jpg`)
Inspired by warm sunlit travertine and calm botanical shadow equilibrium (SOLE Skincare, Pureglow Skincare, Sonnette, Homedine, ConWerse, and Nestify), web-optimized progressive JPEGs (`896×1200`, `1200×896`, and `1376×768` widescreen, quality `88`, stripped metadata) serve as full-bleed storefront imagery during Preview Mode:

| Asset | Dimensions | Use & Visual Role |
| :--- | :--- | :--- |
| `assets/photos/hero-vanity-editorial.jpg` | `1376 × 768` | Widescreen hero campaign backdrop: sunlit plaster left canvas + Daily Cleansing Foam (`150 mL`), ceramic foam dish & fern frond |
| `assets/photos/editorial-routine-lineup.jpg` | `1376 × 768` | Widescreen 3-bottle routine lineup (`150 mL` Foam, `200 mL` Fragrance-Free Toner, `50 mL` Fragrance-Free Moisturizer) on travertine |
| `assets/photos/product-foam-studio.jpg` | `896 × 1200` | Daily Cleansing Foam (`150 mL`) studio shot on travertine plinth with soft fern shadow |
| `assets/photos/product-moisturizer-studio.jpg` | `896 × 1200` | Daily Face Moisturizer (`50 mL`, labeled `Fragrance Free`) airless studio shot |
| `assets/photos/product-toner-studio.jpg` | `896 × 1200` | Hydrating Toner (`200 mL`, labeled `Fragrance Free`) disc-top studio shot |
| `assets/photos/product-duo-studio.jpg` | `896 × 1200` | The Daily Duo (`150 mL` Foam + `50 mL` Moisturizer) true-scale studio pairing |
| `assets/photos/editorial-foam-texture.jpg` | `1200 × 896` | Macro micro-foam cloud & cream smear texture on travertine stone |
| `assets/photos/editorial-botanical-wall.jpg` | `896 × 1200` | Warm sunlit plaster wall with dappled botanical fern shadows |

### Photography Guidelines & Commercial Launch Gate
- **Art Direction:** Always pair full-bleed (`object-fit: cover`, `18px–24px` rounded frames, zero inner box borders) sunlit travertine/linen photography with warm alabaster (`#F6F4EF`) and deep botanical forest (`#233B2C` / `#3E4F3D`) UI accents — never harsh cool-blue studio backdrops or cluttered badges.
- **Fragrance Honesty:** Concept photos must preserve exact fragrance labeling (`Fragrance Free` on Moisturizer and Toner only; never on Daily Cleansing Foam).
- **Pre-Launch Replacement Gate:** All files in `assets/photos/` are **concept renders/visualizations** for design and preview alignment. **Real studio photography of printed Selfnamed production samples MUST replace these concept photographs prior to commercial store launch.**
