"""Build the public Vercel output without shipping private/server files."""

from pathlib import Path
from shutil import copy2, copytree

root = Path(__file__).resolve().parent.parent
output = root / "dist"
(output / "config").mkdir(parents=True, exist_ok=True)
copy2(root / "index.html", output / "index.html")
copy2(root / "config" / "storefront.config.js", output / "config" / "storefront.config.js")
copytree(root / "src", output / "src", dirs_exist_ok=True)

for name in ("brand", "editorial", "icons", "photos", "products"):
    copytree(root / "assets" / name, output / "assets" / name, dirs_exist_ok=True)
