# Fonts

Self-hosted WOFF2 files, byte-for-byte the ones Google Fonts serves (downloaded 2026-09-21),
so pages render without waiting on a third-party server. Declared in `css/style.css`.

| Family | Files | Licence |
|---|---|---|
| Inconsolata (variable, weights 200–900) | `inconsolata-latin.woff2`, `inconsolata-latin-ext.woff2` | SIL Open Font License 1.1 |
| Major Mono Display | `major-mono-display-latin.woff2`, `major-mono-display-latin-ext.woff2` | SIL Open Font License 1.1 |
| Syne Mono | `syne-mono-latin.woff2`, `syne-mono-latin-ext.woff2` | SIL Open Font License 1.1 |

Licence text: https://openfontlicense.org/ — copyright notices are embedded in each file's metadata.
To update: fetch `https://fonts.googleapis.com/css2?family=...` with a current browser user-agent,
download the `latin` and `latin-ext` files it lists, and keep the `unicode-range` values in step.
