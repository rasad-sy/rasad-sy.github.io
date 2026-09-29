# RASAD | رصد website

Static, dependency-free site (HTML + CSS + a few lines of JS). Arabic by default for Arabic browsers, English otherwise; the toggle in the header remembers the choice.

- `index.html` - all content, both languages side by side (`.en` / `.ar` spans)
- `assets/styles.css` - brand theme (gold on navy-black)
- `assets/main.js` - language toggle + video player
- `assets/fonts/` - self-hosted Barlow + IBM Plex Sans Arabic (no Google requests at runtime)
- `assets/video/` - the six explainer videos, `assets/img/` - logo, posters, social image

No trackers, no third-party scripts, strict Content-Security-Policy.

Preview locally: `python -m http.server 8791` in this folder, then open http://localhost:8791
Deploy: upload the whole folder to any static host (GitHub Pages, Cloudflare Pages, Netlify).
