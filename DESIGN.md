# Design notes — Under Pressure (MPD Blog)

Working notes on the visual system and recurring gotchas in this Jekyll
site, kept so decisions don't need to be re-derived every session. The
theme is custom-built on top of `theme: minima` (see "Architecture" below
for why minima itself is mostly irrelevant to the actual styling).

## Architecture

- **Tailwind via CDN** (`<script src="https://cdn.tailwindcss.com">` in
  `_includes/head.html`), configured inline in that same file
  (`tailwind.config = {...}`) plus a `<style type="text/tailwindcss">`
  block with `@layer base` / `@layer components` custom CSS.
- **`assets/css/style.scss`** is a second, hand-written stylesheet
  (syntax highlighting, prose tables/images, scrollbar/selection) compiled
  to `_site/assets/css/style.css` and linked at the end of `<head>`.
- **`_sass/minima/**` is dead code.** `assets/css/style.scss` has no
  `@import "minima"` (or any `@import`), so none of minima's bundled Sass
  (colors, syntax-highlighting skins, layout partials) is ever compiled
  into the site. `_config.yml`'s `theme: minima` only matters for
  `header_pages`/`social_links` config keys and the base HTML skeleton —
  don't waste time editing `_sass/minima/*` expecting it to take effect.
- **Layouts**: `_layouts/base.html` (skeleton), `home.html`, `post.html`,
  `page.html` — all custom, not minima's defaults.
- **Content column width**: `max-w-5xl` is the standard, used consistently
  in both `home.html` and `post.html`. Post body (`.prose-mpd`) has no
  extra width cap of its own — it fills the same column as the home page.

## Colors & fonts

Defined once, in `_includes/head.html`'s `tailwind.config`:

| Token | Hex | Role |
|---|---|---|
| `almost-black` | `#151515` | body text (light) / page background (dark) |
| `offwhite` | `#F8F7F7` | page background (light) / body text (dark) |
| `gray-mid` | `#757575` | secondary/meta text (light) |
| `soft-gray` | `#A4A3A8` | secondary/meta text (dark), muted borders |
| `accent-red` | `#D23810` | titles, links, accents (theme-invariant) |
| `accent-orange` | `#E64E28` | hover state for accent-red |

Fonts: **Poppins** (headings — SemiBold/600 — and UI/meta labels —
Regular/400), **Merriweather** (body copy). `font-weight: 600` on all
`h1`–`h6` is enforced globally in `@layer base` as a fallback, in case a
template forgets the `font-semibold` utility.

## The dark-mode specificity trap

**This is the single most-repeated bug class in this codebase.** Early on,
dark mode was implemented with broad catch-all rules in `@layer base`:

```css
body.dark p, body.dark li, body.dark td,
body.dark span:not(.cat-pill):not(.tag-pill) { color: #F8F7F7; }
body.dark h1, body.dark h2, ... h6 { color: #F8F7F7 !important; }
```

These have real specificity (`body.dark p` = 2 classes + 1 element) and
sometimes `!important`. Any later element styled with a plain Tailwind
utility class (`.text-accent-red`, `.text-soft-gray`, etc. — specificity:
1 class, no `!important`) that happens to be a `<p>`, `<span>`, or heading
**silently loses** to these rules in dark mode, even though it looks
correct in light mode. This has bitten, in order discovered:

1. The header brand title (a `<span>`) — went white in dark mode.
2. The post hero `<h1>` — went white in dark mode (home page's hero
   survived only because of a dedicated protected class, see below).
3. Rouge syntax-highlighting token spans — every `<span class="k">` etc.
   got flattened to white, destroying all code coloring.
4. The footer brand/description `<p>` elements — went white in dark mode.

**The fix, every time, is the same shape**: either exclude the element
from the broad rule (like `.cat-pill`/`.tag-pill` already do for pill
spans), or pin the intended color with an explicit
`body.dark <selector> { color: ... !important; }` override. A set of
reusable classes now exist for this — reach for them before writing a new
one-off Tailwind class + hoping:

| Class | Behavior | Used for |
|---|---|---|
| `.link-accent` | accent-red, hover accent-orange, protected in dark mode | header brand, "Read more" links |
| `.hover-accent-red` | pure-CSS hover-to-red, no base color set | post title links (base color inherited from parent, themed separately) |
| `.text-meta` | gray-mid light / soft-gray dark, `!important` | dates, labels, captions |
| `.nav-link` / `.nav-link-active` | header nav — theme-invariant (header bg is always dark) | header nav links |
| `.theme-toggle-btn` | hover background only | the ☀️/🌙 toggle button |
| `.hero-title` / `.hero-subtitle` | protected red / protected dark-grey-on-light-scrim | home + post hero title/meta |
| `.cat-pill` / `.tag-pill` | exclusions baked into the generic `span` rule above | category/tag pills |

When adding new themed UI, prefer wiring into one of these rather than a
bare Tailwind color utility on a `<p>`/`<span>`/heading.

## Image conventions

**Dark/light variant images**: filename suffix convention
`<basename>_light.<ext>` / `<basename>_dark.<ext>` (underscore, not
hyphen). Author them as a single `<img>` with both variants referenced via
data attributes, **not** `<picture><source media="(prefers-color-scheme:
dark)">`:

```html
<img src="{{ site.baseurl }}/images/X_light.svg"
     data-light-src="{{ site.baseurl }}/images/X_light.svg"
     data-dark-src="{{ site.baseurl }}/images/X_dark.svg"
     alt="..."
     style="display: block; margin-left: auto; margin-right: auto; width: 100%; height: auto;">
```

**Why not `<picture>`/`media` alone**: this site's theme toggle
(`_includes/header.html`) is a **manual JS class toggle**
(`document.body.classList.toggle('dark')`) persisted to
`localStorage['mpd-theme']`. `prefers-color-scheme` is only consulted once,
as a first-visit fallback — after that the stored manual preference always
wins and the OS setting is never re-checked live. A pure CSS media-query
image swap drifts out of sync the moment a user manually toggles against
their OS preference. Instead, `syncThemedImages()` (defined in
`_includes/header.html`, alongside `toggleTheme()`) walks every
`img[data-light-src][data-dark-src]` and sets `src` to match
`document.body.classList.contains('dark')`. It runs once on initial page
load and again on every toggle click.

Reference implementation: all 7 figures in
`_posts/2025-08-10-holistic-mpd-vaca-muerta.md`.

**Known broken**: `_posts/2026-01-25-build-gom-rig-tracker.md` (unpublished
draft) still has an old-style `<picture>` block whose `<source>` and
`<img>` point at the *same* file — not a real dark variant. Left alone
since it's unpublished; fix it (data-attribute pattern, add a real
`_dark` variant image, or drop the swap entirely) before publishing.

## Caption convention

Every post's image captions are authored as a single-asterisk italic line
wrapping an HTML `<small>` tag, directly under the image with no blank
line in between:

```markdown
![alt text]({{ site.baseurl }}/images/foo.png)
*<small>Fig. 1 — caption text, maybe with a [link](...)</small>*
```

kramdown renders this as `<p><em><small>...</small></em></p>`. The CSS in
`_includes/head.html` targets this specific shape
(`.prose-mpd p > em > small`, plus `.prose-mpd small` as a catch-all) and
renders it as a non-italic, theme-aware-grey label
(`#757575` light / `#A4A3A8` dark) pulled up tight against the image
above it.

**Deliberately narrow**: a plain italic aside with no `<small>` — e.g.
`*Hint: try values below 130 klbf, closer to 60 klbf*` — does **not**
match this selector and correctly renders as normal browser italic. An
earlier, broader rule (`.prose-mpd p > em:only-child`) used to catch *any*
standalone italic paragraph regardless of `<small>`, which mis-styled
plain italic asides as captions (stripped their italics, colored them
red). That rule has been removed — if captions ever stop rendering
correctly, check that new caption markdown still wraps in `<small>`.

## Code blocks

`.prose-mpd pre` / `.highlight` (Rouge) / `.input_area pre` /
`.output_area pre` (Jupyter notebook embeds) are **always** dark
(`#151515`), regardless of site theme — a deliberate "terminal" look, not
theme-dependent. In dark mode this needs an explicit
`background: #1f1f1f !important` override (an "elevated surface" shade
also used for the home page description band), because `#151515` is the
*exact* hex of the dark-mode page background — without the override, code
blocks have no visible boundary.

Rouge token colors live in `assets/css/style.scss` (`.highlight .k/.s/.c/
...`), all with `!important` — required to survive the
`body.dark span:not(.cat-pill):not(.tag-pill)` catch-all described above.

## Known cruft (not yet cleaned up)

- **Orphaned images** in `images/`, referenced by no post: 
  `cementacion_convencional_dark.svg`, `cementacion_mpc_dark.svg`,
  `mpd_dppt_dark.svg`, `mpd_dppt_light.svg`.
- **Orphaned PNG/SVG duplicate pairs** (the post only references the
  `.svg`): `KM_Volume_Comparison_Tripping_Rollover_Time_light.png`,
  `cementacion_both_light.png`.
- Several draft posts (`published: false`) exist with incomplete content —
  not an issue, just don't be surprised to find them in `_posts/`.

## Python / notebook pipeline

The Jupyter notebook → Jekyll post pipeline (`build-notebook.ps1`,
`script/process_bsee_wells.py`, `src/*/`) has its own Python virtualenv,
deliberately kept **outside** this OneDrive-synced repo folder at
`C:\venvs\MPD_Blog` (syncing a venv's thousands of small files through
OneDrive is slow/flaky). Dependencies are tracked in `requirements.txt` at
the repo root. Ruby/Jekyll dependencies are separate, tracked normally via
`Gemfile`/`Gemfile.lock`.
