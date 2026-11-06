# Ziems Group logos

Every version of the group logo, for slides, posters, papers and anything else outside the website. This folder isn't part of the website: the site is built only from `content/` and the folders named in `eleventy.config.js`, so nothing here is published.

`all-logos.png` shows every design at a glance.

## The designs

| Name | What it is |
|---|---|
| `circuit` | The full logo: the Bloch sphere in the middle of a four-wire circuit, with the inputs \|0⟩\|0⟩\|1⟩\|1⟩ on the left and measurements on the right |
| `mark` | Just the sphere and its two electrons, as in the website header |
| `circuit-wordmark` | The circuit with "ZIEMS GROUP" underneath |
| `mark-wordmark` | The mark with "ZIEMS GROUP" to its right |
| `mark-stacked` | The mark with "ZIEMS GROUP" centred underneath |

## Colour schemes

Each folder holds every design in one colour scheme.

| Folder | Use it on |
|---|---|
| `light/` | White or light backgrounds |
| `dark/` | Dark backgrounds |
| `pink-light/` | Light backgrounds, in the site's pink mode colours |
| `pink-dark/` | Dark backgrounds, in the site's pink mode colours |
| `white/` | Photos and coloured backgrounds: everything is white |

## File types

- **SVG**: use this wherever you can (slides, posters, print). It scales to any size without going blurry, and the text is drawn as shapes, so no fonts are needed. The background is transparent.
- **PNG**: 2000px wide with a transparent background, for anything that won't take an SVG (Word, some web forms).
- **GIF** (`.gif`): every design animated, with the electrons moving round the sphere, for slides and web pages. Each loops smoothly every 46 seconds. These have a solid background in the scheme's colour: white for `light`, #0b1220 for `dark`, #fdf4f8 for `pink-light`, #1a0b14 for `pink-dark`, and the site's navy #13284a for `white`.
- **Transparent GIF** (`-transparent.gif`): the same animations with a see-through background, and the one to use in PowerPoint. A GIF pixel is either fully see-through or fully solid, so the sphere is filled with the scheme's background colour. In `white`, the faint grid and the far side of the paths are left out.
- **WebP** (`.webp`): the same animations with smooth, partly see-through edges and a glass-like sphere. Use it on web pages and in recent versions of Office. It looks better than the transparent GIF wherever it's supported.

The colours are the website's own: navy #13284a and teal #0b7285 in `light`.

Please don't stretch, recolour or redraw the logos. Pick the scheme that suits the background instead.
