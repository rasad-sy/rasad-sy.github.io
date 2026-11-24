# RASAD | رصد website

Current page: "coming soon in Syria" teaser. Static, dependency-free (HTML + CSS + JS), strict Content-Security-Policy, no trackers, no third-party requests.

Live view: https://rasad-sy.github.io

- `index.html` - the teaser (hero with the hidden dot, poster, services lens, platforms)
- `assets/cs.css`, `assets/cs.js` - styles and scripts
- `assets/img/` - logo, poster (1x and 2x), lens picture, social image; `assets/fonts/` - self-hosted IBM Plex

## The full website (saved to the side)
The complete previous site (Arabic/English/French/German, videos, AML/CFT section, Syria map, RASAD Briefing) is kept in this same repo on the branch `full-site-2026-11-22`.
To bring it back: `git checkout main && git checkout full-site-2026-11-22 -- . && git commit` (or merge that branch), then push.

Preview locally: `python -m http.server 8791` in this folder, then open http://localhost:8791
