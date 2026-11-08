#!/usr/bin/env python3
"""build-form-library.py v1.0 (Nov 8, 2026)
Makes the CPMG Form Library page: test/order/library/index.html
It lists every industry order form (test copies) with its name, version and a link.
Run after build-order-forms.py:  python3 tools/build-form-library.py
Private page for Randy and Cindy. Not for clients (noindex).
REVISION LOG
  v1.0 (Nov 8, 2026) First version. Reads the industry list from tools/cpmg_packs.py and the version from each built page.
"""
import os, re, sys, html, datetime
sys.path.insert(0, os.path.dirname(__file__))
from cpmg_packs import PACKS
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'test', 'order', 'library')
os.makedirs(OUT, exist_ok=True)

def version_of(k):
    p = os.path.join(ROOT, 'test', 'order', k, 'index.html')
    try:
        m = re.search(r'v\d+\.\d+-TEST', open(p, encoding='utf-8').read())
        return m.group(0) if m else 'unknown'
    except OSError:
        return 'not built'

rows = ''
for k, p in PACKS.items():
    look = 'Short form (lean)' if p.get('lean') else 'Standard form'
    rows += ('<a class="card" href="../%s/"><b>%s</b><span>%s</span><span>%s</span></a>\n'
             % (html.escape(k), html.escape(p['name']), look, html.escape(version_of(k))))
stamp = datetime.datetime.now().strftime('%b %d, %Y %I:%M %p').replace(' 0', ' ')
page = '''<!doctype html>
<!-- CPMG Form Library v1.0 (%s). Built by tools/build-form-library.py. Do not edit here. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>CPMG Form Library</title>
<style>
body{margin:0;background:#0f1711;color:#cfe8c4;font:20px/1.5 "Segoe UI",Arial,sans-serif;padding:20px 16px 48px}
main{max-width:760px;margin:0 auto}h1{color:#b5e08f;font-size:32px;margin:0 0 6px}
p{margin:0 0 16px;color:#9fbf95}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.card{display:flex;flex-direction:column;gap:4px;background:#16251b;border:2px solid #3d6a47;border-radius:14px;padding:14px 16px;color:#cfe8c4;text-decoration:none}
.card b{color:#b5e08f;font-size:23px}.card span{color:#9fbf95;font-size:17px}
.card:focus-visible,.card:hover{outline:3px solid #b5e08f}
@media(max-width:520px){.grid{grid-template-columns:1fr}}
</style></head><body><main>
<h1>CPMG Form Library</h1>
<p>One test form for each industry. Tap a card to open it. These are test copies, not what clients see. Made %s.</p>
<div class="grid">
%s</div>
</main></body></html>
''' % (stamp, stamp, rows)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page)
print('built library with', len(PACKS), 'forms')
