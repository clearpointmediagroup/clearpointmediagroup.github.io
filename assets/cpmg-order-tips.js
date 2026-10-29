/*
 * CPMG order forms: "?" help bubbles — cpmg-order-tips.js
 * v1.0 (Oct 29, 2026)
 * Puts a small round green "?" next to a question. Tap it and a short plain-words bubble opens right
 * under the question (what it means + an example). Tap again to close. Works on graphic cards that are
 * added later (Detailed Order "+ Add another graphic") too.
 * HOW A PAGE USES IT
 *   Before loading this file, the page sets window.CPMG_TIPS = [ { sel: 'label[for="biz"]', tip: 'Words' }, ... ].
 *   sel = the question's label, legend or checkbox line. tip = the bubble text (may use <b> and <br>).
 *   Then: <script src="../assets/cpmg-order-tips.js?v=1.0"></script>
 * REVISION LOG
 *   v1.0 (Oct 29, 2026) CC-023: first version, for Quick Order and Detailed Order.
 */
(function () {
  var TIPS = window.CPMG_TIPS || [];
  if (!TIPS.length) return;

  var css = '' +
    '.qrow{display:flex;align-items:center;gap:10px}' +
    '.qrow>label,.qrow>.lbl{min-width:0}.qrow>.opt{flex:1}' +
    'legend .qrow{display:inline-flex}' +
    '.qb{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;' +
      'background:var(--green);color:var(--ink);border:0;font:900 19px var(--display);line-height:1;flex:none;cursor:pointer;padding:0}' +
    '.qb[aria-expanded="true"]{background:var(--fg);color:var(--bg)}' +
    '.qtip{border:2px solid var(--green);background:var(--deep);color:var(--fg);border-radius:12px;padding:10px 12px;' +
      'font-size:17px;line-height:1.45;margin:6px 0 4px}' +
    '.qtip b{color:var(--green)}' +
    '.qrow:has(>label[hidden]),.qrow:has(>.opt[hidden]){display:none}' +
    '.shp{display:inline-block;border:3px solid var(--green);border-radius:4px;flex:none;box-sizing:border-box}' +
    '.shp.tall{width:20px;height:34px}.shp.wide{width:40px;height:23px}.shp.sq{width:30px;height:30px}' +
    '.shp2{display:inline-flex;gap:3px;align-items:center;flex:none}.shp2 .shp.tall{width:14px;height:24px}.shp2 .shp.wide{width:24px;height:14px}' +
    '.szt{display:flex;flex-direction:column;gap:2px}.szt small{font-weight:500;font-size:15px;color:var(--muted);line-height:1.35}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function build(el, tip) {
    if (el.getAttribute('data-tipdone')) return;
    el.setAttribute('data-tipdone', '1');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'qb'; b.textContent = '?';
    b.setAttribute('aria-label', 'What does this mean?'); b.setAttribute('aria-expanded', 'false');
    var bub = document.createElement('p');
    bub.className = 'qtip'; bub.hidden = true; bub.innerHTML = tip;
    if (el.tagName === 'LEGEND') {
      var row = document.createElement('span'); row.className = 'qrow';
      while (el.firstChild) row.appendChild(el.firstChild);
      row.appendChild(b); el.appendChild(row);
      el.parentNode.insertBefore(bub, el.nextSibling);
    } else {
      var r2 = document.createElement('div'); r2.className = 'qrow';
      el.parentNode.insertBefore(r2, el);
      r2.appendChild(el); r2.appendChild(b);
      r2.parentNode.insertBefore(bub, r2.nextSibling);
    }
    b._tip = bub;
  }

  function apply(root) {
    if (!root || !root.querySelectorAll) return;
    TIPS.forEach(function (t) {
      var list = root.querySelectorAll(t.sel);
      for (var i = 0; i < list.length; i++) build(list[i], t.tip);
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.qb') : null;
    if (!b || !b._tip) return;
    e.preventDefault(); e.stopPropagation();
    var open = b._tip.hidden;
    b._tip.hidden = !open;
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }, true);

  apply(document);
  try {
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { for (var i = 0; i < m.addedNodes.length; i++) { var n = m.addedNodes[i]; if (n.nodeType === 1) apply(n.parentNode || n); } });
    }).observe(document.body, { childList: true, subtree: true });
  } catch (err) { /* old browsers: tips on the first graphic only */ }
})();
