# Fernvow — Creative Decision Record (Neon · v2 Equilibrium)

This compact 4-part Creative Decision Record establishes the visual, typographic, photographic, structural, and compliance direction for the **Fernvow** skincare storefront (`fernvow.com`, preview mode).

---

## 1. Aesthetic Thesis & Reference Synthesis

Fernvow fuses **warm sunlit botanical apothecary calm** with **borderless photographic depth** and **disciplined editorial e-commerce architecture**:

### Original Owner Uploads (Foundation)
- **Sonnette (`media_1795062716128_40fb07af.jpg`, `media_1795062722841_a96f91de.jpg`, `media_1795062740597_c049267d.mp4`)**: Sunlit warm alabaster linen ground (`#F6F4EF`), pure paper stages (`#FFFFFF`), whisper-thin hairline dividers, tall editorial serif typography, sunlit fern wall shadows, mobile-first PDP hierarchy, and calm restrained motion (`prefers-reduced-motion` respected).
- **Nestify (`media_1795062681275_795b655f.jpg`)**: Rounded `20–24px` bento/split feature frames, tactile pill filters, circular thin-stroke icon buttons, and the horizontal editorial split card for **The Daily Duo**.
- **Next (`media_1795062696772_0c63ef58.png`)**: Full-storefront e-commerce cadence (header → hero → lineup → duo feature → 3-step routine → warm oat 3-pillar strip → filterable catalog → dark anchored footer), explicitly **excluding** Next's bright pop-fashion colors.

### Dribbble Skincare & Editorial Equilibrium Inspiration (v2 Upgrade)
- **SOLE Skincare (`step_18_shot_1_shot1_main_image.png`)**: Warm sunlit plaster shadow lighting behind the hero stage and a frosted inset quick-add product card (`Daily Cleansing Foam · 150 mL · $34.95` + circular `+` button) anchored inside the hero visual without boxed seams.
- **Pureglow Skincare (`step_31_shot_2_shot2_clean_2.png` & `step_31_shot_5_shot2_clean_5.png`)**: Sensory cream/foam texture storytelling, clean borderless `3:4` / `4:5` studio product cards (full-bleed photography, zero double-box borders), and kit feature presentation with clear strikethrough savings (`$64.95` vs ~~`$74.90`~~).
- **Homedine (`step_73_shot_1.png`)**: Deep botanical forest-fern pill CTAs (`#233B2C`), mixed italic serif emphasis in headlines, rounded full-bleed hero framing, and inline pill manifesto typography.
- **Sonnette PDP & Monumental Footer (`step_55_shot_7_shot3_block_7.png`)**: Clean PDP gallery + pill tabs (`Studio Concept` | `Vector Render` | `Label & Print Spec`) and an edge-to-edge low-opacity pure-vector `fernvow` wordmark watermark anchored along the base of the dark obsidian footer.
- **Batch 3 E-Commerce & PDP Structural References**:
  - **ConWerse Footwear (`27192789`, `step_60_shot_1_shot4_img4_top_slice_1.png`)**: Carried forward warm editorial serif typography composed over the calm left side of a full-bleed hero photograph.
  - **Wink Responsive Fashion PDP (`25042708`, `step_28_shot_4_shot3_img_3.png`)**: Carried forward modular multi-panel PDP spec, variant/quantity, and structured shipping/package grid clarity.
  - **DICH Shoes (`27715945`) & DripDrop Streetwear (`25519986`)**: Reviewed for responsive grid rhythm and merchandising contrast; intentionally **excluded** loud streetwear, neon, and graffiti palettes to protect Fernvow's sunlit botanical calm.

---

## 2. Color, Typography & Surface System

| Token Role | Value | Usage |
| --- | --- | --- |
| Primary Ground | `#F6F4EF` | Sunlit alabaster linen page background |
| Elevated Studio Stage | `#FFFFFF` | PDP technical/vector stages & clean drawer surfaces |
| Warm Oat Strip | `#ECE8DF` | 3-pillar store transparency strip |
| Primary Ink | `#181B17` | Deep obsidian-forest headings, primary copy |
| Secondary Ink | `#595D56` | Muted stone metadata, captions, subtitles |
| Deep Fern Accent | `#233B2C` *(hover `#182A1F`)* | Botanical forest-fern primary pill CTAs & `2px` focus rings |
| Hairline Border | `rgba(24, 27, 23, 0.12)` | Dividers, accordion rules, routine step index |
| Deep Footer Ground | `#141915` | Anchored obsidian-forest footer with `#F6F4EF` copy & `0.09` opacity wordmark |

**Typography Pairing:**
- **Editorial Display Serif:** `Cormorant Garamond` / `Instrument Serif` (mixed with italic serif emphasis words) for hero headlines, manifesto statement, and view titles.
- **UI & Body Sans:** `DM Sans` (`13px–16px`) for crisp navigation, INCI legibility, policies, and accessible form controls.
- **Technical Metadata Mono:** `IBM Plex Mono` (`11px–12px`) for step tags, pH ranges, mL / fl oz volumes, and resin recycling codes.

---

## 3. Layout Architecture & Key Page Patterns (v2)

1. **Above-the-Fold Split / Campaign Hero (`#/`)**: Single-line compact preview bar (`US Preview · USD · Test Pricing · Readiness →`), followed immediately by a rounded full-bleed atmospheric hero anchored by `assets/photos/hero-vanity-editorial.jpg` (sunlit cream plaster + fern shadows on the left, 150 mL Daily Cleansing Foam + ceramic foam dish on the right). Fits cleanly within `1440×900` desktop and stacks cleanly on `390×844` mobile so headline, bottle, and primary CTA appear above the fold without text colliding with the bottle.
2. **Borderless Lineup Grid & Inline-Pill Manifesto**: Full-bleed rounded (`18px`) `object-fit: cover` product cards with a single top-left frosted pill badge, horizontal title + price baseline, monospace micro-meta, and single `#233B2C` `+ Add to bag` pill beside `View details →`, followed by a centered editorial manifesto featuring tiny rounded inline texture/botanical photo pills.
3. **The Daily Duo Split, Sensory Routine & Widescreen Lineup**: Seamless full-bleed `product-duo-studio.jpg` beside `1× 150 mL Foam` + `1× 50 mL Moisturizer` breakdown (`$64.95` vs ~~`$74.90`~~, `$9.95` savings, two-SKU fulfillment `A5852 + S0001`), followed by the hairline 3-step routine paired with `editorial-botanical-wall.jpg` and `editorial-foam-texture.jpg`, the widescreen 3-bottle ritual banner `assets/photos/editorial-routine-lineup.jpg` (shared with `#/routine`), and the `#ECE8DF` 3-pillar transparency strip.
4. **3-Mode Product Detail (`#/product/<slug>`)**: Full-bleed `Studio Concept` photography (`images.primary`), `Vector Render` (`images.vectorConcept`), and `Label & Print Spec` (`images.labelSpec`, singles only), paired with prominent Fragrance Disclosure pills, accessible `<details>` accordions (Directions, verbatim INCI — both products for Duo, Packaging/Recycling, Preview Status), and an explicitly labeled empty Customer Reviews slot.

---

## 4. Packaging Fidelity, Photography & Guardrails

- **Hybrid Asset Separation**: Brand identity (`assets/brand/*.svg`), all 25 UI icons (`assets/icons/fernvow-icons.svg`), bottle silhouette renders (`assets/products/*.svg`), and flat label print specs (`assets/products/label-spec-*.svg`) remain **100% pure hand-authored vector SVG**. Studio and sensory editorial imagery (`assets/photos/*.jpg`, including the widescreen `hero-vanity-editorial.jpg` and `editorial-routine-lineup.jpg` campaign scenes) uses approved concept photography matched to Selfnamed's exact white cylindrical bottles (`150 mL` HDPE #2 foaming pump `A5852`, `50 mL` PP #5 slim airless `S0001`, `200 mL` PET #1 disc-cap `A5805`) and carries explicit preview captions until physical printed sample photography is captured.
- **Fragrance & Claims Discipline**: Daily Cleansing Foam is explicitly labeled `Contains Parfum/Fragrance` (`Soft & floral spring bloom, Rice powder`); Moisturizer and Toner are `Fragrance-Free`. Unapproved ECOCERT/organic logos, disputed percentages (`22%` vs `23%`), clinical study figures, internal supplier unit costs, and fabricated customer reviews are strictly barred from buyer UI.
