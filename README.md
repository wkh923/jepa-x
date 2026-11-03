# JEPA-x project page

Static site for *JEPA-x: Cross-Predictive Physics Grounding for Forecastable Latent Dynamics* (arXiv 2608.24044).

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Python's built-in server ignores HTTP range requests, so video chapter links cannot seek locally; they work on GitHub Pages.

## Publish on GitHub Pages

Live at https://wkh923.github.io/jepa-x/ (repository `wkh923/jepa-x`, Pages served from `main`, folder `/`).
Push to `main` to update; the site rebuilds in about a minute. `og:url` and `og:image` in `index.html` point at this address.

## Layout

- `index.html` – page content
- `static/css/main.css` – type system (Source Serif 4 headings, Inter text, five sizes) and layout
- `static/js/main.js` – video chapters, synced views, drift-chart highlight, task tabs, BibTeX copy
- `static/img`, `static/video` – figures and clips (paper figures rendered from the Overleaf PDFs)
