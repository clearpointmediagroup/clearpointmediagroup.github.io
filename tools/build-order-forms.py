#!/usr/bin/env python3
"""build-order-forms.py v1.5 (Nov 19, 2026, 5:50 AM)
Builds every industry order form from ONE master form.
  master: test/order/index.html  (works with ?for=<industry>)
  output: test/order/<industry>/index.html  (one page per industry, same code, words from tools/cpmg_packs.py)
Run after ANY change to the master form or the packs:  python3 tools/build-order-forms.py
REVISION LOG
  v1.5 (Nov 19, 2026, 5:50 AM) CC-203: (1) short packs get HOW_SHORT ("How this works" for the 3-step form) and pass sholn (how many holiday choices). (2) The CC-163 raw words step is now part of the build: each page starts with its own tab title, description, About and How this works (before this, a rebuild put the real estate words back). (3) Lean (cream) pages say theme-color #f7f5ef and color-scheme light, so a phone's top bar is not near-black.
  v1.4 (Nov 15, 2026, 11:07 PM) CC-144 + CC-143: a pack with simple=True (the 9 Colorado packs) is built as the SHORT 3-step form: <body class="lean lite simple">, and its step 1 choices (skinds) and restaurant place examples (splace) go into the page. Other packs: unchanged.
  v1.3 (Nov 10, 2026, 12:35 AM) CC-071: packs may list places (kind of place first, then only the graphic buttons that fit).
  v1.2 (Nov 3, 2026) Lean pages are also built with the light 3-step look (body class "lean lite").
  v1.1 (Nov 3, 2026) A pack with lean=True gets <body class="lean"> (fewer boxes: see tools/cpmg_packs.py).
  v1.0 (Oct 30, 2026) First version: 8 industries.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import html as _html
from cpmg_packs import PACKS, HOW, HOW_SHORT, ABOUT
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER = os.path.join(ROOT, 'test', 'order', 'index.html')
START, END = '  // ===== PACKS START (built by tools/build-order-forms.py — edit tools/cpmg_packs.py, not here) =====\n', '  // ===== PACKS END =====\n'

def js_packs():
    out = {}
    for k, p in PACKS.items():
        out[k] = dict(industry=p['name'], form=p['name'], title=p['title'], foot=p['foot'],
                      about=ABOUT.format(who=p['who'], uses=p['uses']), how=(HOW_SHORT if p.get('simple') else HOW).format(what=p['what'], photos=p['photos']),
                      kinds=[list(x) for x in p['kinds']], looks=[list(x) for x in p['looks']],
                      places=[[x[0], x[1], list(x[2])] for x in p.get('places', [])], extra=dict(p['extra'], store='cpmgExtra_' + k), biz=p['biz'], photo1=list(p['photo1']), ex=p['ex'], vision=bool(p.get('vision')))
        if p.get('simple'): out[k].update(simple=True, skinds=[list(x) for x in p['skinds']], splace=dict(p.get('splace', {})))   # v1.4 CC-144
        if p.get('simple') and 'sholn' in p: out[k]['sholn'] = p['sholn']   # v1.5 CC-203
    return '  var PACKS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'

js_packs_cache = json.loads(js_packs()[len('  var PACKS = '):-2])
s = open(MASTER).read()
a, b = s.index(START) + len(START), s.index(END)
s = s[:a] + js_packs() + s[b:]
open(MASTER, 'w').write(s)
for k in PACKS:
    d = os.path.join(ROOT, 'test', 'order', k); os.makedirs(os.path.join(d, 'looks'), exist_ok=True)
    page = s.replace("var PACK_FIXED = '';", "var PACK_FIXED = '" + k + "';")
    page = re.sub(r'(src|href)="\.\./', r'\1="../../', page)
    if PACKS[k].get('lean'): page = page.replace('<body>', '<body class="lean lite' + (' simple' if PACKS[k].get('simple') else '') + '">', 1)   # v1.4 CC-144: simple = short 3-step form
    # v1.5 CC-203 (was CC-163 by hand): raw words = this form's own words (tab title, description, About, How this works)
    jp = js_packs_cache[k]; esc = _html.escape
    page = re.sub(r'<title>[^<]*</title>', '<title>' + esc(jp['title'], quote=False) + ' · CPMG</title>', page, count=1)
    page = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + esc(jp['title']) + ' from ClearPoint Media Group. Most previews come back within 5 hours.">', page, count=1)
    page = re.sub(r'<p id="pkAbout">[^<]*</p>', lambda m: '<p id="pkAbout">' + esc(jp['about'], quote=False) + '</p>', page, count=1)
    page = re.sub(r'<p id="pkHow">[^<]*</p>', lambda m: '<p id="pkHow">' + esc(jp['how'], quote=False) + '</p>', page, count=1)
    if PACKS[k].get('lean'):
        page = page.replace('<meta name="theme-color" content="#0f1712">', '<meta name="theme-color" content="#f7f5ef">', 1).replace('<meta name="color-scheme" content="dark">', '<meta name="color-scheme" content="light">', 1)
    page = page.replace('CPMG Standard Order Form — test/order/index.html', 'CPMG ' + PACKS[k]['name'] + ' Order — test/order/' + k + '/index.html\n  BUILT FILE: made by tools/build-order-forms.py from test/order/index.html. Do not edit here.')
    open(os.path.join(d, 'index.html'), 'w').write(page)
    print('built', k)
