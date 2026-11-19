#!/usr/bin/env bash
# Fetch the pinned CUDA runtime and 512-resolution Q4 weights, then reconstruct the four products.
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
trellis_dir="${TRELLIS_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/fernvow-trellis}"
output_dir="${1:-$trellis_dir/reconstructions}"
runtime_dir="$trellis_dir/runtime"
model_dir="$trellis_dir/models/q4"
cli="$runtime_dir/trellis-cli"

mkdir -p -- "$runtime_dir" "$model_dir" "$output_dir"
if [[ ! -x "$cli" ]]; then
  curl -fLsS --retry 3 https://github.com/pwilkin/trellis.cpp/releases/download/v0.8.1/trellis-cuda-linux-x64.tar.gz |
    tar xz -C "$runtime_dir"
fi

for weight in birefnet dinov3 ss_dec ss_flow shape_dec shape_flow_512 tex_dec tex_flow_512; do
  if [[ ! -s "$model_dir/$weight.gguf" ]]; then
    curl -fLsS --retry 3 -C - "https://huggingface.co/ilintar/trellis2-gguf/resolve/main/q4/$weight.gguf?download=true"       -o "$model_dir/$weight.gguf.part"
    mv -- "$model_dir/$weight.gguf.part" "$model_dir/$weight.gguf"
  fi
done

reconstruct() {
  local product="$1" seed="$2"
  "$cli" "$project_dir/assets/photos/product-$product-studio.jpg" "$output_dir/$product.glb"     --models "$model_dir" --res 512 --threads 6 --bg-only --birefnet
  "$cli" "$output_dir/${product}_cutout.png" "$output_dir/$product.glb"     --models "$model_dir" --res 512 --threads 6 --steps 12 --atlas 1024 --webp off --seed "$seed"
}

reconstruct foam 1789740510
reconstruct toner 1267427978
reconstruct moisturizer 619504552
reconstruct duo 1234727081
