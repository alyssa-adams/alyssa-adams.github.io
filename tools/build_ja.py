#!/usr/bin/env python3
"""Build the Japanese pages (ja/*.html) from the English pages.

Run from the repo root:

    python3 tools/build_ja.py            # build, validate, write ja/*.html
    python3 tools/build_ja.py --check    # build and validate only, write nothing
    python3 tools/build_ja.py --strict   # also fail if untranslated English is left

What it does, per page:
  1. Applies the ordered English -> Japanese replacements in tools/ja_strings.json
     ("*" entries apply to every page, then the page's own entries). Every entry
     must be found in the English page. If one is missing (because the English text
     was edited), the build fails and nothing is written.
  2. Applies the structural changes: <html lang="ja">, canonical/og:url/og:locale,
     hreflang alternates, the agent comment, the JSON-LD (index only), "../" on
     relative asset paths, the EN/JP toggle in the nav, Japanese whisper dates, and
     lang="en" on English titles.
  3. Validates the result: well-formed HTML, every relative link resolves, no
     彼/彼女, and prints any visible English that is not on the allow-list.

Standard library only.
"""
import argparse
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
OUT_DIR = os.path.join(ROOT, "ja")
STRINGS = os.path.join(TOOLS, "ja_strings.json")
SITE = "https://alyssa-m-adams.com/"
PAGES = ["index.html", "abilities.html", "scrying.html"]

LANG_TOGGLE = ('<span class="lang-toggle" role="group" aria-label="言語">'
               '<a href="../{page}" lang="en" hreflang="en">EN</a>'
               '<span aria-hidden="true">/</span>'
               '<a href="{page}" lang="ja" aria-current="true">JP</a></span>')
AGENT_NOTE = ("The agent files (/llms.txt, /llms-full.txt) are in English; "
              "this page is the Japanese translation of {en_url}")
MONTHS = {m: i for i, m in enumerate(
    "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), start=1)}
# Hiragana, katakana, CJK ideographs, full-width forms
CJK = re.compile(r"[　-ヿ㐀-鿿豈-﫿＀-￯]")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}


class BuildError(Exception):
    pass


# ---------------------------------------------------------------- replacements

def pattern_for(entry):
    kind = entry.get("kind", "text")
    en, ja = entry["en"], entry["ja"]
    if kind == "text":          # a whole text run between two tags
        return ">" + en + "<", ">" + ja + "<"
    if kind.startswith("attr:"):  # an attribute value, e.g. attr:alt
        name = kind[5:]
        return '%s="%s"' % (name, en), '%s="%s"' % (name, ja)
    if kind == "raw":           # a literal HTML snippet
        return en, ja
    raise BuildError("unknown kind %r" % kind)


def apply_replacements(page, src, entries, errors):
    for i, entry in enumerate(entries):
        find, repl = pattern_for(entry)
        n = src.count(find)
        want = entry.get("count")
        if n == 0 or (want is not None and n != want):
            errors.append("%s: entry %d (%s) %s: %s" % (
                page, i, entry.get("kind", "text"),
                "NOT FOUND" if n == 0 else "found %d times, expected %d" % (n, want),
                entry["en"][:110]))
            continue
        src = src.replace(find, repl)
    return src


# ---------------------------------------------------------------- structure

def sub_once(pattern, repl, src, what, errors, flags=0):
    new, n = re.subn(pattern, repl, src, count=1, flags=flags)
    if n != 1:
        errors.append("structure: could not find " + what)
    return new


def fix_url(url, own_pages):
    if not url or url.startswith(("#", "/", "http:", "https:", "mailto:", "tel:", "data:", "javascript:")):
        return url
    path = re.split(r"[?#]", url, maxsplit=1)[0]
    if path in own_pages:
        return url          # links between the three translated pages stay inside ja/
    return "../" + url


def rewrite_paths(src):
    own = set(PAGES)
    src = re.sub(r'\b(href|src)="([^"]*)"',
                 lambda m: '%s="%s"' % (m.group(1), fix_url(m.group(2), own)), src)

    def srcset(m):
        parts = []
        for cand in m.group(1).split(","):
            bits = cand.strip().split(None, 1)
            if bits:
                bits[0] = fix_url(bits[0], own)
                parts.append(" ".join(bits))
        return 'srcset="%s"' % ", ".join(parts)
    return re.sub(r'\bsrcset="([^"]*)"', srcset, src)


def ja_url_for(en_url):
    if not en_url.startswith(SITE):
        raise BuildError("canonical URL %s is not under %s" % (en_url, SITE))
    return SITE + "ja/" + en_url[len(SITE):]


def rewrite_head(page, src, errors):
    m = re.search(r'<link rel="canonical" href="([^"]+)">', src)
    if not m:
        errors.append(page + ": no canonical link in the English page")
        return src, None, None
    en_url = m.group(1)
    ja_url = ja_url_for(en_url)

    # Drop any hreflang / og:locale:alternate the English page may carry, then add ours
    src = re.sub(r'\n[ \t]*<link\b[^>]*\bhreflang=[^>]*>', "", src)
    src = re.sub(r'\n[ \t]*<meta property="og:locale:alternate"[^>]*>', "", src)

    alternates = ('<link rel="canonical" href="%s">\n'
                  '    <link rel="alternate" hreflang="en" href="%s">\n'
                  '    <link rel="alternate" hreflang="ja" href="%s">\n'
                  '    <link rel="alternate" hreflang="x-default" href="%s">'
                  % (ja_url, en_url, ja_url, en_url))
    src = src.replace(m.group(0), alternates, 1)
    src = sub_once(r'<meta property="og:locale" content="[^"]*">',
                   '<meta property="og:locale" content="ja_JP">\n'
                   '    <meta property="og:locale:alternate" content="en_US">',
                   src, page + ": og:locale", errors)
    src = sub_once(r'<meta property="og:url" content="%s">' % re.escape(en_url),
                   '<meta property="og:url" content="%s">' % ja_url,
                   src, page + ": og:url equal to the canonical URL", errors)
    src = sub_once(r'<html lang="en">', '<html lang="ja">', src, page + ': <html lang="en">', errors)
    # The pixel heading font (DotGothic16 subset) is used only on these pages, by the nav
    # and titles at the top: fetch it alongside the stylesheet rather than after it
    src = sub_once(r'(<link rel="stylesheet" href="css/style\.css">)',
                   r'\1\n    <link rel="preload" href="fonts/dotgothic16-ja-subset.woff2" as="font" type="font/woff2" crossorigin>',
                   src, page + ": the stylesheet link", errors)

    def agent(mm):
        indent = mm.group(1)
        body = mm.group(2).rstrip()
        return "%s<!-- %s\n%s     %s -->" % (indent, body, indent, AGENT_NOTE.format(en_url=en_url))
    src = sub_once(r'([ \t]*)<!-- (Hello, agent\..*?)-->', agent, src,
                   page + ': the "Hello, agent" comment', errors, flags=re.S)
    return src, en_url, ja_url


def rewrite_jsonld(page, src, ja_url, errors):
    blocks = list(re.finditer(r'([ \t]*)<script type="application/ld\+json">(.*?)</script>', src, re.S))
    if page != "index.html":
        if blocks:
            errors.append(page + ": the English page now has JSON-LD; teach build_ja.py what to do with it")
        return src
    if len(blocks) != 1:
        errors.append(page + ": expected exactly one JSON-LD block, found %d" % len(blocks))
        return src
    block = blocks[0]
    try:
        data = json.loads(block.group(2))
    except ValueError as e:
        errors.append(page + ": English JSON-LD does not parse: %s" % e)
        return src
    ids, nodes = {}, {}
    for node in data.get("@graph", []):
        ids.setdefault(node.get("@type"), node.get("@id"))
        nodes.setdefault(node.get("@type"), node)
    if not ids.get("Person") or not ids.get("WebSite"):
        errors.append(page + ": English JSON-LD has no Person or WebSite @id")
        return src
    # Google reads each page's JSON-LD on its own and does not follow an @id to
    # another page, so a bare {"@id": ...} mainEntity fails Search Console's
    # Profile page check ("Invalid object type for field mainEntity"). Embed the
    # identifying part of the English Person node, typed, instead.
    person = {k: nodes["Person"][k] for k in
              ("@type", "@id", "name", "alternateName", "url", "image", "sameAs")
              if k in nodes["Person"]}

    def meta(pattern):
        mm = re.search(pattern, src)
        return html.unescape(mm.group(1)) if mm else ""
    graph = {
        "@context": "https://schema.org",
        "@graph": [{
            "@type": "ProfilePage",
            "@id": ja_url + "#profilepage",
            "url": ja_url,
            "name": meta(r"<title>(.*?)</title>"),
            "description": meta(r'<meta name="description" content="([^"]*)">'),
            "inLanguage": "ja",
            "isPartOf": {"@id": ids["WebSite"]},
            "mainEntity": person,
            "translationOfWork": {"@id": ids.get("ProfilePage") or SITE},
        }],
    }
    indent = block.group(1)
    body = json.dumps(graph, ensure_ascii=False, indent=2)
    body = "\n".join(indent + line for line in body.splitlines())
    new = '%s<script type="application/ld+json">\n%s\n%s</script>' % (indent, body, indent)
    return src[:block.start()] + new + src[block.end():]


def add_lang_toggle(page, src, errors):
    m = re.search(r'(<nav class="site-nav">)(.*?)(\n[ \t]*</nav>)', src, re.S)
    if not m or src.count('<nav class="site-nav">') != 1:
        errors.append(page + ": expected exactly one <nav class=\"site-nav\">")
        return src
    inner = re.sub(r'\s*<span class="lang-toggle"[^>]*>.*?</a></span>', "", m.group(2), flags=re.S)
    links = re.findall(r'<a href="([^"]+)" class="nav-link', inner)
    if links != PAGES:
        errors.append(page + ": nav links are %s, expected %s" % (links, PAGES))
    inner = inner.rstrip() + "\n        " + LANG_TOGGLE.format(page=page)
    return src[:m.start()] + m.group(1) + inner + m.group(3) + src[m.end():]


def whisper_dates(page, src, errors):
    total = src.count('class="scry-whisper-date"')

    def conv(m):
        return '<span class="scry-whisper-date">%s年%d月</span>' % (m.group(2), MONTHS[m.group(1)])
    src, n = re.subn(r'<span class="scry-whisper-date">(%s) (\d{4})</span>' % "|".join(MONTHS), conv, src)
    if n != total:
        errors.append(page + ": %d whisper dates, but only %d look like 'Mon YYYY'" % (total, n))
    return src


def mark_english(src):
    """lang="en" on titles that stay in English, so :lang(ja) rules and Japanese
    speech synthesis leave them alone."""
    for tag, cls in (("h1", "hero-name"), ("h3", "scry-name"),
                     ("span", "scry-mini-title"), ("span", "scry-whisper-title")):
        def mark(m, tag=tag, cls=cls):
            if CJK.search(m.group(1)):
                return m.group(0)
            return '<%s class="%s" lang="en">%s</%s>' % (tag, cls, m.group(1), tag)
        src = re.sub(r'<%s class="%s">(.*?)</%s>' % (tag, cls, tag), mark, src, flags=re.S)

    def cover(m):
        if CJK.search(html.unescape(m.group(2))):
            return m.group(0)
        return m.group(1) + ' lang="en">'
    return re.sub(r'(<a class="scry-cover"[^>]*?aria-label="([^"]*)")>', cover, src)


# ---------------------------------------------------------------- validation

class Balance(HTMLParser):
    """Checks that every non-void element is closed in order."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.problems = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.problems.append("stray </%s> at line %d" % (tag, self.getpos()[0]))
        elif self.stack[-1][0] != tag:
            open_tag, pos = self.stack[-1]
            self.problems.append("</%s> at line %d closes <%s> from line %d"
                                 % (tag, self.getpos()[0], open_tag, pos[0]))
            if any(t == tag for t, _ in self.stack):
                while self.stack and self.stack.pop()[0] != tag:
                    pass
        else:
            self.stack.pop()

    def close(self):
        super().close()
        for tag, pos in self.stack:
            self.problems.append("<%s> from line %d never closed" % (tag, pos[0]))


class TextScan(HTMLParser):
    """Collects visible text and text-bearing attributes."""

    ATTRS = ("alt", "aria-label", "title", "placeholder")
    META = ("description", "og:title", "og:description", "og:image:alt")

    def __init__(self, skip_classes):
        super().__init__(convert_charrefs=True)
        self.skip_classes = set(skip_classes)
        self.stack = []      # (tag, skip)
        self.texts = []      # (context, text)
        self.attrs = []      # (context, attr, value, classes)

    def _start(self, tag, attrs, push):
        a = dict(attrs)
        classes = set((a.get("class") or "").split())
        skip = ((self.stack[-1][1] if self.stack else False) or tag in ("script", "style")
                or bool(classes & self.skip_classes) or a.get("lang") == "en")
        ctx = tag + "".join("." + c for c in sorted(classes))
        for name in self.ATTRS:
            if a.get(name) and tag != "link":     # <link title> is not shown to readers
                self.attrs.append((ctx, name, a[name], classes))
        if tag == "meta" and (a.get("name") or a.get("property")) in self.META:
            self.attrs.append(("meta " + (a.get("name") or a.get("property")), "content",
                               a.get("content", ""), classes))
        if push and tag not in VOID:
            self.stack.append((tag, skip, ctx))

    def handle_starttag(self, tag, attrs):
        self._start(tag, attrs, True)

    def handle_startendtag(self, tag, attrs):
        self._start(tag, attrs, False)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if data.strip() and not (self.stack and self.stack[-1][1]):
            self.texts.append((self.stack[-1][2] if self.stack else "?", data.strip()))


def leftover_english(page, out, allow):
    strings = sorted(allow.get("strings", []), key=len, reverse=True)
    tokens = set(allow.get("tokens", []))
    titles = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", t))).strip()
              for t in re.findall(r'<h3 class="scry-name"[^>]*>(.*?)</h3>', out, re.S)]
    scan = TextScan(allow.get("classes", []))
    scan.feed(out)
    scan.close()

    found = []

    def check(ctx, text):
        rest = text
        for s in strings:
            rest = rest.replace(s, " ")
        words = [w for w in re.findall(r"[A-Za-z][A-Za-z'’\-]*[A-Za-z]", rest) if w not in tokens]
        if words:
            found.append("%s [%s] %s  <- %s" % (page, ctx, text[:140], ", ".join(sorted(set(words)))))
    for ctx, text in scan.texts:
        check(ctx, text)
    for ctx, name, value, classes in scan.attrs:
        if name == "aria-label" and "scry-cover" in classes and any(t.startswith(value) for t in titles):
            continue        # the cover link's label is the card's English title
        check("%s@%s" % (ctx, name), value)
    return found


def validate(page, out, allow, errors):
    b = Balance()
    b.feed(out)
    b.close()
    errors.extend("%s: HTML: %s" % (page, p) for p in b.problems)

    if '<html lang="ja">' not in out:
        errors.append(page + ': missing <html lang="ja">')
    if out.count(LANG_TOGGLE.format(page=page)) != 1:
        errors.append(page + ": language toggle missing or duplicated")
    for word in ("彼女", "彼"):
        if word in out:
            errors.append("%s: contains %s (Alyssa uses they/them: use the name or no pronoun)" % (page, word))

    for attr, url in re.findall(r'\b(href|src)="([^"]*)"', out) + \
            [("srcset", c.strip().split()[0]) for s in re.findall(r'\bsrcset="([^"]*)"', out)
             for c in s.split(",") if c.strip()]:
        if not url or url.startswith(("#", "http:", "https:", "mailto:", "tel:", "data:", "javascript:")):
            continue
        path = html.unescape(re.split(r"[?#]", url, maxsplit=1)[0])
        if not path:
            continue
        target = os.path.join(ROOT, path.lstrip("/")) if path.startswith("/") \
            else os.path.normpath(os.path.join(OUT_DIR, path))
        if os.path.normpath(os.path.dirname(target)) == OUT_DIR and os.path.basename(target) in PAGES:
            continue        # a sibling ja page, written by this build
        if not os.path.exists(target):
            errors.append("%s: %s=\"%s\" does not resolve (%s)" % (page, attr, url, target))


# ---------------------------------------------------------------- main

def build_page(page, strings, errors):
    with open(os.path.join(ROOT, page), encoding="utf-8") as f:
        src = f.read()
    entries = strings["pages"].get("*", []) + strings["pages"].get(page, [])
    src = apply_replacements(page, src, entries, errors)
    src, en_url, ja_url = rewrite_head(page, src, errors)
    if ja_url:
        src = rewrite_jsonld(page, src, ja_url, errors)
    src = rewrite_paths(src)
    src = add_lang_toggle(page, src, errors)
    if 'class="scry-whisper-date"' in src:
        src = whisper_dates(page, src, errors)
    src = mark_english(src)
    return src


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", action="store_true", help="build and validate, but write nothing")
    ap.add_argument("--strict", action="store_true", help="fail if untranslated English is left")
    args = ap.parse_args()

    with open(STRINGS, encoding="utf-8") as f:
        strings = json.load(f)
    unknown = set(strings["pages"]) - set(PAGES) - {"*"}
    if unknown:
        sys.exit("ja_strings.json names pages this build does not know: %s" % sorted(unknown))

    errors, leftovers, outputs = [], [], {}
    for page in PAGES:
        try:
            out = build_page(page, strings, errors)
        except BuildError as e:
            errors.append("%s: %s" % (page, e))
            continue
        validate(page, out, strings.get("allow", {}), errors)
        leftovers += leftover_english(page, out, strings.get("allow", {}))
        outputs[page] = out

    if leftovers:
        print("\nVisible English not on the allow-list (%d):" % len(leftovers))
        for line in leftovers:
            print("  " + line)
        print("Translate these in tools/ja_strings.json, or add proper nouns to allow.strings.")

    if errors:
        print("\nBUILD FAILED (%d problem%s). Nothing was written.\n" % (len(errors), "" if len(errors) == 1 else "s"),
              file=sys.stderr)
        for e in errors:
            print("  " + e, file=sys.stderr)
        print("\nIf the English text changed, update the matching \"en\" (and \"ja\") in tools/ja_strings.json.",
              file=sys.stderr)
        sys.exit(1)
    if args.strict and leftovers:
        print("\n--strict: untranslated English left; nothing was written.", file=sys.stderr)
        sys.exit(3)

    if args.check:
        print("\nCheck passed: %d pages build cleanly (nothing written)." % len(outputs))
        return
    os.makedirs(OUT_DIR, exist_ok=True)
    for page, out in outputs.items():
        with open(os.path.join(OUT_DIR, page), "w", encoding="utf-8") as f:
            f.write(out)
        print("wrote ja/%s" % page)


if __name__ == "__main__":
    main()
