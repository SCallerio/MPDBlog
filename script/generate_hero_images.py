# script/generate_hero_images.py
r"""
Generate a grayscale, washed-out hero-banner variant of a post's lead
photo, matching the look of images/drillmax_grayscale_opacity_20.png
(full desaturation + shadows lifted into a light band, so it reads as a
subtle background texture once the site's live opacity/scrim CSS sits on
top of it).

Usage — run from the repo root so the printed front-matter snippet's
/images/... path is correct. Needs Pillow, which lives in this project's
venv at C:\venvs\MPD_Blog (see requirements.txt) — plain `python` on your
PATH almost certainly points somewhere else and will fail with
`ModuleNotFoundError: No module named 'PIL'`. Either call the venv's
python directly (works in any shell, no activation needed):

    C:\venvs\MPD_Blog\Scripts\python.exe script\generate_hero_images.py images/my-photo.jpg
    C:\venvs\MPD_Blog\Scripts\python.exe script\generate_hero_images.py images/my-photo.jpg --focus-y 30 --preview

...or activate the venv first, then use plain `python`:

    PowerShell:  C:\venvs\MPD_Blog\Scripts\Activate.ps1
    Git Bash:    source /c/venvs/MPD_Blog/Scripts/activate

The post hero section is a fixed 320px-tall, full-viewport-width band, so
object-fit:cover crops away most of a normal photo's height — how much
depends on the viewport width, so there's no single "correct" pre-crop
that works at every screen size. Instead of baking in a crop, this script
only desaturates/lifts tone (non-destructive, same aspect ratio as the
source), and reports an `image_position` vertical focus percentage for
the *live* CSS crop (_layouts/post.html and _layouts/home.html both read
`page.image_position` / `post.image_position`, defaulting to "50%").
Use --focus-y to move that focus point toward wherever the photo's real
subject sits (e.g. a tall subject near the top of the frame needs a low
--focus-y so it doesn't get cropped off); use --preview to check the
result without running the Jekyll site.
"""

import argparse
import os
import sys

try:
    from PIL import Image
except ModuleNotFoundError:
    _hint = ""
    if ".venv" in sys.executable.replace("\\", "/"):
        _hint = (
            "\nNote: this is the repo-local .venv/ (stale - a leftover from before the\n"
            "project moved to C:\\venvs\\MPD_Blog), not the one with Pillow installed.\n"
            "If your shell auto-activates it, run `deactivate` first.\n"
        )
    sys.exit(
        "Pillow isn't installed on this interpreter (" + sys.executable + ")." + _hint + "\n"
        "Run this script with the project venv's python instead:\n"
        r"  Windows (PowerShell/cmd): C:\venvs\MPD_Blog\Scripts\python.exe script\generate_hero_images.py ..." "\n"
        r"  Git Bash:                 /c/venvs/MPD_Blog/Scripts/python.exe script/generate_hero_images.py ..."
    )

DEFAULT_TARGET_MIN = 90
DEFAULT_TARGET_MAX = 245
DEFAULT_MAX_WIDTH = 2000  # hero banner never renders wider than this on any real screen
DEFAULT_COLOR_MAX_WIDTH = 1200  # home-page excerpt thumbnail is far smaller still
PREVIEW_SIZE = (1600, 320)  # representative desktop hero banner shape


def resize_max_width(img: Image.Image, max_width: int) -> Image.Image:
    """Shrink to max_width if larger; never upscale. Preserves aspect ratio."""
    if img.width <= max_width:
        return img
    new_height = round(img.height * (max_width / img.width))
    return img.resize((max_width, new_height), Image.LANCZOS)


def to_hero_grayscale(img: Image.Image, target_min: int, target_max: int) -> Image.Image:
    gray = img.convert("L")
    lut = [int(target_min + (p / 255) * (target_max - target_min)) for p in range(256)]
    return gray.point(lut).convert("RGB")


def make_preview_crop(img: Image.Image, focus_y: float, size=PREVIEW_SIZE) -> Image.Image:
    """Simulate object-fit:cover + object-position:center <focus_y>% at `size`."""
    target_w, target_h = size
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    scaled = img.resize((round(src_w * scale), round(src_h * scale)), Image.LANCZOS)
    scaled_w, scaled_h = scaled.size

    left = (scaled_w - target_w) / 2
    top = (scaled_h - target_h) * (focus_y / 100)
    top = max(0, min(top, scaled_h - target_h))
    box = (round(left), round(top), round(left) + target_w, round(top) + target_h)
    return scaled.crop(box)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", help="Path to the source photo, e.g. images/my-photo.jpg")
    parser.add_argument("--focus-y", type=float, default=50,
                         help="Vertical crop focus, 0 (top) - 100 (bottom). Default: 50 (center).")
    parser.add_argument("--target-min", type=int, default=DEFAULT_TARGET_MIN,
                         help=f"Darkest output grey level, 0-255. Default: {DEFAULT_TARGET_MIN}.")
    parser.add_argument("--target-max", type=int, default=DEFAULT_TARGET_MAX,
                         help=f"Lightest output grey level, 0-255. Default: {DEFAULT_TARGET_MAX}.")
    parser.add_argument("--suffix", default="_bw", help="Filename suffix for the output file. Default: _bw.")
    parser.add_argument("--max-width", type=int, default=DEFAULT_MAX_WIDTH,
                         help=f"Shrink the hero image if wider than this, in px. Default: {DEFAULT_MAX_WIDTH}. "
                              "It's a full-viewport-width banner but never rendered anywhere near its original "
                              "multi-thousand-px source resolution, so keeping that resolution is pure page weight.")
    parser.add_argument("--preview", action="store_true",
                         help="Also save a *_hero_preview.jpg simulating the cropped hero banner.")
    parser.add_argument("--web-color", action="store_true",
                         help="Also save a *_web.jpg: a resized (not grayscaled) copy of the ORIGINAL color "
                              "photo, for the home-page excerpt thumbnail (_layouts/home.html), which currently "
                              "links the full-resolution original.")
    parser.add_argument("--color-max-width", type=int, default=DEFAULT_COLOR_MAX_WIDTH,
                         help=f"Max width for --web-color output. Default: {DEFAULT_COLOR_MAX_WIDTH}.")
    args = parser.parse_args()

    if not os.path.exists(args.source):
        raise SystemExit(f"Source file not found: {args.source}")

    base, ext = os.path.splitext(args.source)
    out_path = f"{base}{args.suffix}.jpg"

    src = Image.open(args.source)
    hero = to_hero_grayscale(src, args.target_min, args.target_max)
    hero = resize_max_width(hero, args.max_width)
    hero.save(out_path, "JPEG", quality=88)
    print(f"Wrote {out_path}  ({hero.size[0]}x{hero.size[1]})")

    if args.preview:
        preview_path = f"{base}_hero_preview.jpg"
        preview = make_preview_crop(hero, args.focus_y)
        preview.save(preview_path, "JPEG", quality=85)
        print(f"Wrote {preview_path}  (simulated {PREVIEW_SIZE[0]}x{PREVIEW_SIZE[1]} hero crop at focus-y={args.focus_y})")

    if args.web_color:
        web_path_out = f"{base}_web.jpg"
        web_color = resize_max_width(src.convert("RGB"), args.color_max_width)
        web_color.save(web_path_out, "JPEG", quality=85)
        print(f"Wrote {web_path_out}  ({web_color.size[0]}x{web_color.size[1]})")

    web_path = "/" + os.path.relpath(out_path).replace(os.sep, "/")
    print("\nAdd to the post's front matter:")
    print(f"image: {web_path}")
    print(f"image_position: {args.focus_y:g}%")


if __name__ == "__main__":
    main()
