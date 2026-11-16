#!/usr/bin/env python3
"""Rebuild fonts/dotgothic16-ja-subset.woff2 from the Japanese pages.

DotGothic16 (a pixel Japanese font) is used only for headings and labels on the
ja/ pages. The full font is about 2 MB, so the site serves a subset holding just
the characters those elements use, plus ASCII and the katakana the hover scramble
in js/fx.js cycles through.

Usage, from the repo root:
    python3 tools/subset_jp_font.py path/to/DotGothic16-Regular.ttf

Get the font from https://github.com/google/fonts/tree/main/ofl/dotgothic16
Needs fontTools and brotli (pip install fonttools brotli).
Keep TARGET in step with the DotGothic16 rule in css/style.css.
"""
import os
import sys
from html.parser import HTMLParser

from fontTools import subset
from fontTools.ttLib import TTFont

PAGES = ['ja/index.html', 'ja/abilities.html', 'ja/scrying.html']
OUT = 'fonts/dotgothic16-ja-subset.woff2'
TARGET = {'nav-link', 'lang-toggle', 'hero-class', 'section-title', 'spells-section-title',
          'ability-name', 'ability-type-tag', 'scry-tag', 'scry-view-btn', 'scry-registry-badge'}
VOID = {'br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr'}
SCRAMBLE_KANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン'
EXTRA = '―・（）「」『』、。！？：〜ー'


class HeadingText(HTMLParser):
    """Collect text inside target elements, skipping lang="en" parts and <rt> readings."""

    def __init__(self):
        super().__init__()
        self.stack = []
        self.chars = set()

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        a = dict(attrs)
        classes = set((a.get('class') or '').split())
        in_target, in_en = self.stack[-1] if self.stack else (False, False)
        in_en = in_en or (a.get('lang') or '').startswith('en')
        in_target = (in_target or bool(classes & TARGET) or tag in ('h1', 'h2', 'h3')) and tag != 'rt'
        self.stack.append((in_target, in_en))

    def handle_endtag(self, tag):
        if tag not in VOID and self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if self.stack and self.stack[-1][0] and not self.stack[-1][1]:
            self.chars.update(data)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    chars = set(SCRAMBLE_KANA) | set(EXTRA) | {chr(c) for c in range(0x20, 0x7f)}
    for page in PAGES:
        p = HeadingText()
        with open(page, encoding='utf-8') as f:
            p.feed(f.read())
        chars |= {c for c in p.chars if not c.isspace()}

    cmap = TTFont(src).getBestCmap()
    missing = sorted(c for c in chars if ord(c) not in cmap and not c.isspace())
    if missing:
        print('Not in DotGothic16 (will fall back to the system gothic):', ''.join(missing))

    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=''.join(sorted(chars)))
    sub.subset(font)
    subset.save_font(font, OUT, opts)
    print(f'wrote {OUT}: {len(chars)} characters, {os.path.getsize(OUT):,} bytes')


if __name__ == '__main__':
    main()
