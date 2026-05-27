# Client logos

Drop SVG logos in this folder. The site picks them up automatically — no
HTML changes needed.

## Filenames expected (lowercase, hyphenated)

  siae.svg
  2i-rete-gas.svg
  vodafone.svg
  flex.svg
  bocconi.svg
  iveco.svg
  intercos.svg
  piaggio.svg
  ferrari.svg

If a file is missing, the slot falls back to the text label automatically.

## SVG guidelines

- Format: SVG (preferred), or PNG/WebP if SVG isn't available.
- Color: single-color (black or currentColor) works best — the site
  renders them grayscale by default and on hover restores the original.
- ViewBox: include `viewBox="0 0 W H"` and remove fixed `width`/`height`
  attributes so they scale to the row height (~28-40px).
- Padding: trim outer whitespace — the row controls spacing.
- File size: keep under 10KB each; run them through SVGO if heavy.

## To add a new client

1. Add the SVG with the exact slug filename here.
2. In `index.html`, add one more `<li data-client="<slug>"><span>Label</span></li>`
   to the `.clients` list.
