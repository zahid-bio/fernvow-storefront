# Fernvow product media

All four product meshes came from [Microsoft TRELLIS.2](https://github.com/microsoft/TRELLIS.2) using [trellis.cpp v0.8.1](https://github.com/pwilkin/trellis.cpp/releases/tag/v0.8.1) and the [Q4 GGUF weights](https://huggingface.co/ilintar/trellis2-gguf/tree/main/q4). Blender applied the existing Fernvow labels to the meshes. The 3D viewer loads when the shopper selects **View in 3D**.

## Storefront photography

The built-in ImageGen tool created the product photos below. They live in `assets/photos` as 960 × 1200 WebP files, with a 1080 × 1080 WebP for the homepage hero. Each prompt used the named reference as input.

The four product prompts start with this direction.

> Edit the supplied Fernvow product photo into a new photorealistic studio photograph for fernvow’s skincare storefront. Treat the supplied image as the exact packaging reference: preserve its pump or cap design, number of bottles, matte ivory plastic, warm cream paper labels, fern emblem, dark lowercase serif fernvow wordmark, and exact product text. Photograph real objects with a restrained natural film look, fine paper grain, warm directional window light and a soft true contact shadow. New scene: pale muted coral limewash behind a honed warm pink-beige travertine slab. Portrait 4:5 intent, centered, every cap and base fully visible within the middle 70% of the height, generous top and bottom crop room, no extra packaging, no text outside the bottle labels.

- `daily-cleansing-foam-photo.webp` uses `product-foam-studio.jpg` as its reference. One tall foaming pump; front label reads “fernvow”, “Daily Cleansing Foam”, “150 mL”.
- `hydrating-toner-photo.webp` uses `product-toner-studio.jpg` as its reference. One tall matte white toner bottle with a short plain white disc-top cap, no pump; front label reads “fernvow”, “Hydrating Toner”, “Fragrance Free”, “200 mL”.
- `daily-face-moisturizer-photo.webp` uses `product-moisturizer-studio.jpg` as its reference. One slim white airless pump; front label reads “fernvow”, “Daily Face Moisturizer”, “Fragrance Free”, “50 mL”.
- `the-daily-duo-photo.webp` uses `product-duo-studio.jpg` as its reference. Exactly two products. The tall broad pump on the left is labeled “fernvow”, “Daily Cleansing Foam”, “150 mL”. The short slim airless pump on the right is labeled “fernvow”, “Daily Face Moisturizer”, “Fragrance Free”, “50 mL”.
- `hero-cleanser-photo.webp` uses `hero-vanity-editorial.jpg` as its reference. Rephotograph the supplied Fernvow Daily Cleansing Foam for the product side of a premium coral skincare homepage. Use the supplied photo as a packaging reference. Keep one matte ivory foamer, the same cream label, fern mark, and the exact visible text “fernvow”, “Daily Cleansing Foam”, “150 mL”. New scene: the bottle and a small warm-white ceramic dish of cleansing foam on pale coral stone, dusty-coral limewash backdrop, soft afternoon fern shadows, a few real droplets. Use a nearly square portrait 4:5 crop composition. Group the bottle and dish mostly around the central 55% of the frame, with the bottle centered and entirely within the central 65% of height so all packaging fits in a wide responsive crop, leave clean space near the bottom-left for a website price overlay. Photograph real materials and precise shadows, no typography outside the package, no border, no collage.

## Responsive collection photography

The built-in ImageGen tool generated a new panoramic composition for each collection. Each image has a 1600 × 640 wide WebP and a separately framed 720 × 720 mobile WebP. The browser selects the appropriate file at the 640px breakpoint.

The carousel prompts share this direction.

> Rephotograph the supplied editorial skincare still life from a little farther away for a full-width website collection carousel. The reference is the subject, lighting, and palette guide. Keep the muted coral limewash, warm cream details, the same subject and lightly directional real window light. Use an extra-wide horizontal 2.5:1 banner composition with uninterrupted backdrop to both sides. Keep the complete hero subject (including all pump tops and bases if present) within the middle 36 percent of the width and middle 54 percent of the height, centered slightly above true center. Leave the lower part quiet for the website’s heading. Make this feel intentionally framed from a distance, not cropped or stretched, with realistic textures and tonal depth. No text, typography, logos, added objects, frames, padding bars, or collages.

- `ticker-all-wide.webp` and `ticker-all-mobile.webp` use `collection-all.webp` as the reference. Three distinct matte ivory skincare containers at staggered heights, with the tallest pump still in frame, a small washcloth and the stained peach ledge from the reference.
- `ticker-cleanse-wide.webp` and `ticker-cleanse-mobile.webp` use `collection-cleanse.webp` as the reference. One coral ceramic dish with a light mound of fine white cleansing foam and a few droplets; preserve the soft linen edge and natural bubbles.
- `ticker-tone-wide.webp` and `ticker-tone-mobile.webp` use `collection-tone.webp` as the reference. A pale blush glass dish with clear concentric water ripples and one small rose petal at the edge, luminous overhead light.
- `ticker-moisturize-wide.webp` and `ticker-moisturize-mobile.webp` use `collection-moisturize.webp` as the reference. One softly curved ivory moisturizer swatch on a warm clay-pink ceramic tile, with fine matte glaze detail and window shadows.
- `ticker-duo-wide.webp` and `ticker-duo-mobile.webp` use `collection-duo.webp` as the reference. Exactly two matte ivory containers, a taller broad white foaming pump and a shorter white airless pump, on dusty coral stone with a soft shared shadow. Preserve the size difference and both complete bottles.
- `ticker-fragrance-wide.webp` and `ticker-fragrance-mobile.webp` use `collection-fragrance.webp` as the reference. A small folded cream linen washcloth and one subtle dab of ivory moisturizer on a coral clay slab, with no floral elements.

## Regenerating the product models

Run the reconstruction on Linux with an NVIDIA CUDA driver. The runtime and model downloads are stored under `~/.local/share/fernvow-trellis` by default.

```bash
scripts/generate_models.sh /tmp/fernvow-reconstructions
blender --background --factory-startup --threads 6 --python scripts/render_products.py -- /tmp/fernvow-reconstructions /tmp/fernvow-renders
```

The Blender script creates label textures in memory using `assets/models/textures`. It exports a GLB and transparent proof renders for review. Pack each GLB with [gltfpack 1.3](https://github.com/zeux/meshoptimizer/releases/tag/v1.3) before copying it to `assets/models`.

```bash
for slug in daily-cleansing-foam hydrating-toner daily-face-moisturizer the-daily-duo; do
  gltfpack -i "/tmp/fernvow-renders/$slug.glb" -o "assets/models/$slug.glb" \
    -si 0.22 -se 0.003 -kn -ke -km -vt 14
done
```

## Product gallery detail prompts

Built-in ImageGen created these 900 × 675 WebP images under `assets/photos/collection-*.webp`. The product galleries use selected images for their texture or pair views. All six served as references for the responsive carousel images.

Each prompt begins with the following style direction.

> Photorealistic skincare editorial photograph for Fernvow’s collection tiles. Wide landscape with the subject centered and room around it for a 4:3 crop. A muted warm coral / dusty terracotta and pale cream palette, gentle afternoon side light, tactile real materials, sophisticated restrained still life. No graphics, labels, text or logos.

- **All skincare**. Three distinct ivory skincare containers of different heights (tall foaming pump, capped toner, small airless pump) on a peach plaster ledge alongside a small linen washcloth.
- **Cleansers**. A mound of fresh white cleansing foam and a few water droplets on a warm coral ceramic saucer, with a soft linen edge. Tight macro on the airy fine bubbles.
- **Toners**. A pool of clear water with concentric ripples on pale blush glass, with one very small rose petal resting at the edge. Overhead macro, clean and luminous.
- **Moisturizers**. A creamy ivory moisturizer swatch, one satisfying curved brushstroke on a muted clay-pink ceramic surface with visible glaze texture. Close macro.
- **The Daily Duo**. Exactly two matte ivory skincare containers side by side, a taller foaming pump and a shorter airless pump, on dusty-coral stone with a single soft shared shadow.
- **Fragrance-free**. A folded cream linen face cloth and a small, smooth dab of white moisturizer on a coral clay tile. A pared back, scent-free skincare still life with no floral styling.

The interactive viewer is vendored from [Google Model Viewer 4.4.0](https://www.npmjs.com/package/@google/model-viewer/v/4.4.0). Its Apache 2.0 license is included under `assets/vendor`.
