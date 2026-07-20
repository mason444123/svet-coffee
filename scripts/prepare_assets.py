from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image
import io

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

# Main source image was included in the Stitch export.
with Image.open(ASSETS / "hero-source.png") as image:
    image.convert("RGB").save(ASSETS / "hero.jpg", "JPEG", quality=90, optimize=True, progressive=True)

REMOTE = {
    "story.jpg": "https://lh3.googleusercontent.com/aida-public/AB6AXuCJYPBx3pLEAtOokQxYNxslEnSV0yR1yvNCQDGHxh45Q9-xxVKbxcVLrxQEWYsAvx1RgusQekxrQ_YrtEePdcUFGbIdWtHg2US5W53qBSxyP7g8HZEL_EaBgI9UlQxlcf_QDBV3R7GPAirtQk73oFa86qhfg_3VBxHtjeYaGoWDUMd4P8-65sAz1s37lMdh4VwYDgOqQBb9CxklSQzWfHJHbRIYb055p4o34VNMu2ZOFIiDl3pyGHcM",
    "coffee-break.jpg": "https://lh3.googleusercontent.com/aida-public/AB6AXuCncYQEoMrTDX0s4PINLCnXuA182jFDcGhK7CMiDtyaL9WQ6ge35cCPS4nu0-tFOudWbCI9iF04hYz-c7Rs1vTiLya0B0SEhieWrCcK7PW_aol3HRGmZDsNtGdwp2-G0MKuEvz5I9St2bm2O6xykd0A1CcguEjpAEfLaEK-udXVB_oHNp4VQ6USD4_0XRoCXaNnzK4GwITCbvc84n-njkpU_dEMj8B3eAh8p9g4bRVjs4xQrUPtkz4y",
}

for name, url in REMOTE.items():
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=30) as response:
        raw = response.read()
    with Image.open(io.BytesIO(raw)) as image:
        rgb = image.convert("RGB")
        rgb.save(ASSETS / name, "JPEG", quality=88, optimize=True, progressive=True)
        print(f"{name}: {rgb.width}x{rgb.height}")

print("hero.jpg: 768x1376")
