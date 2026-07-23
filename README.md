# MPD Blog — Tailwind CSS Restyle for Jekyll Minima

A complete restyle of the Jekyll Minima theme using **Tailwind CSS**, matching the design draft at Adobe Express. Maintains 100% Minima structural compatibility — all layouts, includes, and front matter work exactly as before.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| Almost Black | `#151515` | Body text, headings |
| Off-white | `#F8F7F7` | Light background |
| Gray | `#757575` | Meta text, captions |
| Accent Red | `#D23810` | Main title, links, accents |
| Accent Orange | `#E64E28` | Hover states |
| White | `#FFFFFF` | Pure white surfaces |
| Soft Gray | `#A4A3A8` | Borders, muted text |

### Fonts
- **Headings** → Poppins SemiBold (`#151515`)
- **Body text** → Merriweather (`#151515`)
- **Captions / Quotes** → Poppins Regular (`#151515`)
- **Main Title** → Poppins SemiBold (`#D23810`)
- **Subtitle** → Poppins Regular (`#F8F7F7`)

---

## Files Included

```
_layouts/
  base.html          ← Root layout (replaces default.html)
  home.html          ← Landing page with hero + post list
  page.html          ← Static pages (About, etc.)
  post.html          ← Individual blog post view

_includes/
  head.html          ← <head> with Tailwind CDN + Google Fonts
  header.html        ← Sticky dark nav with red brand
  footer.html        ← Dark footer with author + RSS
  social.html        ← Social icon links
  custom-head.html   ← Placeholder for extra <head> tags

_sass/minima/
  custom-variables.scss   ← Kept for Minima compatibility
  custom-styles.scss      ← Overrides Minima's .wrapper constraint

assets/css/
  style.scss         ← Syntax highlighting, tables, scrollbar

preview.html         ← Standalone browser preview (no Jekyll needed)
```

---

## Installation

### 1. Copy files into your repo

Copy the folders and files above into the root of your `MPDBlog` repository, **overwriting** the existing files of the same names.

```bash
cp -r _layouts/* /path/to/MPDBlog/_layouts/
cp -r _includes/* /path/to/MPDBlog/_includes/
cp -r _sass/* /path/to/MPDBlog/_sass/
cp assets/css/style.scss /path/to/MPDBlog/assets/css/style.scss
```

### 2. Add drillship image

Make sure this image is present at:
```
images/drillmax_grayscale_opacity_20.png
```
It's already in your repo at the correct path.

### 3. Update `_config.yml`

Add a `subtitle` field and confirm your `description`:

```yaml
title: "Under Pressure"
subtitle: "Managed Pressure Drilling Technical Blog"
description: >-
  This blog is dedicated to sharing insights, research, and advancements
  in Managed Pressure Drilling (MPD) and related technologies.

minima:
  skin: classic   # skin is loaded but overridden by Tailwind
  social_links:
    - { platform: github,   user_url: "https://github.com/SCallerio" }
    - { platform: linkedin, user_url: "https://linkedin.com/in/yourprofile" }

show_excerpts: true
```

### 4. Add `list_title` to `index.md` (optional)

```yaml
---
layout: home
list_title: "Latest Posts"
---
```

### 5. Serve locally

```bash
bundle exec jekyll serve
```

---

## How Tailwind Works Here

Tailwind is loaded via the **Play CDN** in `_includes/head.html`:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { theme: { extend: { colors: { ... }, fontFamily: { ... } } } }
</script>
```

All layout classes use standard Tailwind utilities. Custom semantic classes like `prose-mpd` (for post body content) are defined in a `<style type="text/tailwindcss">` block using `@apply` directives.

> **Production note**: For a production build, swap the CDN for `tailwindcss` as a PostCSS plugin and run `npx tailwindcss build`. The CDN approach works perfectly for GitHub Pages without any build step.

---

## Post Front Matter

Posts support these fields:

```yaml
---
layout: post
title:  "Your Post Title"
subtitle: "Optional italic subtitle line"
date:   2025-10-14
categories: [conference, mpd]
tags: [well-control, regulations]
author: Santiago Callerio   # optional, falls back to site.author
---
```

---

## Preview

Open `preview.html` in any browser to see the full design — no Jekyll required.
