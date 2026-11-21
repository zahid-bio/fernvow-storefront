"""Build the public Vercel output without shipping private/server files."""

from json import dumps
from pathlib import Path
from shutil import copy2, copytree
from subprocess import run

from checkout import public_shipping_settings

root = Path(__file__).resolve().parent.parent
output = root / "dist"
(output / "config").mkdir(parents=True, exist_ok=True)
copy2(root / "config" / "storefront.config.js", output / "config" / "storefront.config.js")
copytree(root / "src", output / "src", dirs_exist_ok=True)

for name in ("brand", "editorial", "icons", "photos", "products"):
    copytree(root / "assets" / name, output / "assets" / name, dirs_exist_ok=True)

for verification_file in root.glob("google*.html"):
    copy2(verification_file, output)

run([
    "node", str(root / "scripts" / "render_storefront.mjs"),
    str(root / "index.html"), str(output),
    dumps(public_shipping_settings()["weightsGrams"]),
], check=True)
