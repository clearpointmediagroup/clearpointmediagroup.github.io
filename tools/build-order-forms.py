#!/usr/bin/env python3
"""build-order-forms.py v1.0 (Oct 30, 2026)
Builds every industry order form from ONE master form.
  master: test/order/index.html  (works with ?for=<industry>)
  output: test/order/<industry>/index.html  (one page per industry, same code, words from tools/cpmg_packs.py)
Run after ANY change to the master form or the packs:  python3 tools/build-order-forms.py
REVISION LOG
  v1.0 (Oct 30, 2026) First version: 8 industries.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from cpmg_packs import PACKS, HOW, ABOUT
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER = os.path.join(ROOT, 'test', 'order', 'index.html')
START, END = '  // ===== PACKS START (built by tools/build-order-forms.py — edit tools/cpmg_packs.py, not here) =====\n', '  // ===== PACKS END =====\n'

def js_packs():
    out = {}
    for k, p in PACKS.items():
        out[k] = dict(industry=p['name'], form=p['name'], title=p['title'], foot=p['foot'],
                      about=ABOUT.format(who=p['who'], uses=p['uses']), how=HOW.format(what=p['what'], photos=p['photos']),
                      kinds=[list(x) for x in p['kinds']], looks=[list(x) for x in p['looks']],
                      extra=dict(p['extra'], store='cpmgExtra_' + k), biz=p['biz'], photo1=list(p['photo1']), ex=p['ex'])
    return '  var PACKS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'

s = open(MASTER).read()
a, b = s.index(START) + len(START), s.index(END)
s = s[:a] + js_packs() + s[b:]
open(MASTER, 'w').write(s)
for k in PACKS:
    d = os.path.join(ROOT, 'test', 'order', k); os.makedirs(os.path.join(d, 'looks'), exist_ok=True)
    page = s.replace("var PACK_FIXED = '';", "var PACK_FIXED = '" + k + "';")
    page = re.sub(r'(src|href)="\.\./', r'\1="../../', page)
    page = page.replace('CPMG Standard Order Form — test/order/index.html', 'CPMG ' + PACKS[k]['name'] + ' Order — test/order/' + k + '/index.html\n  BUILT FILE: made by tools/build-order-forms.py from test/order/index.html. Do not edit here.')
    open(os.path.join(d, 'index.html'), 'w').write(page)
    print('built', k)
