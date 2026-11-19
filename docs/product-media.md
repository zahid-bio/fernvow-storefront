# Fernvow product media

All four product meshes came from [Microsoft TRELLIS.2](https://github.com/microsoft/TRELLIS.2) using [trellis.cpp v0.8.1](https://github.com/pwilkin/trellis.cpp/releases/tag/v0.8.1) and the [Q4 GGUF weights](https://huggingface.co/ilintar/trellis2-gguf/tree/main/q4). Blender applied the existing Fernvow labels and rendered the cover images. The 3D viewer loads when the shopper selects **View in 3D**.

## Regenerating the product media

Run the reconstruction on Linux with an NVIDIA CUDA driver. The runtime and model downloads are stored under `~/.local/share/fernvow-trellis` by default.

```bash
scripts/generate_models.sh /tmp/fernvow-reconstructions
blender --background --factory-startup --threads 6 --python scripts/render_products.py -- /tmp/fernvow-reconstructions /tmp/fernvow-renders
```

The Blender script creates label textures in memory using `assets/models/textures`. It exports a GLB and a transparent PNG for each product, plus `hero-cleanser.png`. Export the transparent PNGs to WebP for `assets/photos` at quality 88. Use `<slug>-render.webp` for product images and `hero-cleanser.webp` for the homepage. Pack each GLB with [gltfpack 1.3](https://github.com/zeux/meshoptimizer/releases/tag/v1.3) before copying it to `assets/models`.

```bash
for slug in daily-cleansing-foam hydrating-toner daily-face-moisturizer the-daily-duo; do
  gltfpack -i "/tmp/fernvow-renders/$slug.glb" -o "assets/models/$slug.glb" \
    -si 0.22 -se 0.003 -kn -ke -km -vt 14
done
```

## Collection image prompts

Built-in ImageGen created the six photos. The site uses 900 × 675 WebP crops saved to `assets/photos/collection-*.webp`.

Each prompt begins with the following style direction.

> Photorealistic skincare editorial photograph for Fernvow’s collection tiles. Wide landscape with the subject centered and room around it for a 4:3 crop. A muted warm coral / dusty terracotta and pale cream palette, gentle afternoon side light, tactile real materials, sophisticated restrained still life. No graphics, labels, text or logos.

- **All skincare**. Three distinct ivory skincare containers of different heights (tall foaming pump, capped toner, small airless pump) on a peach plaster ledge alongside a small linen washcloth.
- **Cleansers**. A mound of fresh white cleansing foam and a few water droplets on a warm coral ceramic saucer, with a soft linen edge. Tight macro on the airy fine bubbles.
- **Toners**. A pool of clear water with concentric ripples on pale blush glass, with one very small rose petal resting at the edge. Overhead macro, clean and luminous.
- **Moisturizers**. A creamy ivory moisturizer swatch, one satisfying curved brushstroke on a muted clay-pink ceramic surface with visible glaze texture. Close macro.
- **The Daily Duo**. Exactly two matte ivory skincare containers side by side, a taller foaming pump and a shorter airless pump, on dusty-coral stone with a single soft shared shadow.
- **Fragrance-free**. A folded cream linen face cloth and a small, smooth dab of white moisturizer on a coral clay tile. A pared back, scent-free skincare still life with no floral styling.

The interactive viewer is vendored from [Google Model Viewer 4.4.0](https://www.npmjs.com/package/@google/model-viewer/v/4.4.0). Its Apache 2.0 license is included under `assets/vendor`.
