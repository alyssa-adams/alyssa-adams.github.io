# Fonts

Self-hosted WOFF2 files, byte-for-byte the ones Google Fonts serves (downloaded 2026-09-21),
so pages render without waiting on a third-party server. Declared in `css/style.css`.

| Family | Files | Licence |
|---|---|---|
| Inconsolata (variable, weights 200–900) | `inconsolata-latin.woff2`, `inconsolata-latin-ext.woff2` | SIL Open Font License 1.1 |
| Major Mono Display | `major-mono-display-latin.woff2`, `major-mono-display-latin-ext.woff2` | SIL Open Font License 1.1 |
| DotGothic16 (Japanese pages' headings only) | `dotgothic16-ja-subset.woff2`, cut down to the characters the `ja/` headings use (added 2026-11-09) | SIL Open Font License 1.1, text in `DotGothic16-OFL.txt` |

Licence text: https://openfontlicense.org/ — copyright notices are embedded in each file's metadata.
To update: fetch `https://fonts.googleapis.com/css2?family=...` with a current browser user-agent,
download the `latin` and `latin-ext` files it lists, and keep the `unicode-range` values in step.

DotGothic16 is not served whole (the full font is about 2 MB). After changing Japanese
headings or labels, rebuild the subset: download `DotGothic16-Regular.ttf` from
https://github.com/google/fonts/tree/main/ofl/dotgothic16 and run
`python3 tools/subset_jp_font.py path/to/DotGothic16-Regular.ttf`.
