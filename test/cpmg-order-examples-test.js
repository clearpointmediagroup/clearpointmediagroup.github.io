/*
 * CPMG order forms: examples that match the client's business — cpmg-order-examples.js
 * v1.0 (Oct 29, 2026)
 * The gray example words in the boxes (and the examples in the green "?" bubbles) switch to match the
 * business type the client picks: real estate gets real estate examples, a restaurant gets restaurant
 * examples, and so on. Before a type is picked, the examples are neutral.
 * HOW A PAGE USES IT
 *   Load this file after the form. Boxes are found by id (#biz, #who or #nm, #em, #hl, #ideas, #cta,
 *   #web, #area, #notes, #brok) or by data-f (hl, ideas, cta) inside graphic cards. The "?" bubbles
 *   (cpmg-order-tips.js v1.1+) can use {biz} {hl} {ideas} {cta} {web} {area} {brok} in their text.
 *   window.CPMG_EX.now() gives the current example set.
 * REVISION LOG
 *   v1.0 (Oct 29, 2026) CC-025: first version. 12 business types plus neutral examples.
 */
(function () {
  // Every example fits the form's limits: headline up to 10 words, each line up to 10 words,
  // "what should people do next" up to 6 words.
  var EX = {
    '': { biz: 'Your Business Name', who: 'Jordan Smith', em: 'you@yourbusiness.com',
      hl: 'Big sale this weekend', ideas: ['20% off everything', 'Friday through Sunday only'], cta: 'Stop by today',
      web: 'yourbusiness.com', area: 'Myrtle Beach', notes: "We're closed Mondays" },
    'Real estate': { biz: 'Sarah Miller Real Estate', brok: 'Coastal Realty Group', who: 'Sarah Miller', em: 'sarah@coastalrealty.com',
      hl: 'Open House this Saturday', ideas: ['123 Ocean Blvd, Myrtle Beach', '3 beds · 2 baths · $425,000', 'Saturday 1 to 4 PM'],
      cta: 'Call to schedule a showing', web: 'coastalrealty.com', area: 'Carolina Forest', notes: 'Use the front photo of the house' },
    'Restaurant or bar': { biz: 'Harbor Grill', who: 'Dana Wells', em: 'dana@harborgrill.com',
      hl: "Tonight's special", ideas: ['Shrimp and grits', '$14.99 tonight only', 'Live music at 7'], cta: 'Come in tonight',
      web: 'harborgrill.com', area: 'Myrtle Beach', notes: "We're closed Mondays" },
    'Accountant or tax': { biz: 'Grand Strand Tax & Accounting', who: 'Mike Harris', em: 'mike@grandstrandtax.com',
      hl: 'Tax season is here', ideas: ['Personal and small business returns', 'Fast refunds with e-file', 'Appointments open now'],
      cta: 'Book your appointment', web: 'grandstrandtax.com', area: 'Conway and Myrtle Beach', notes: 'Open Saturdays during tax season' },
    'Law office': { biz: 'Harbor Law Firm', who: 'Lisa Grant', em: 'lisa@harborlawfirm.com',
      hl: 'Hurt in a car accident?', ideas: ['Free consultation', 'Car accidents and injuries', 'Serving the Grand Strand'],
      cta: 'Call for a free consultation', web: 'harborlawfirm.com', area: 'Horry County', notes: 'Please show our office phone' },
    'Medical or dental': { biz: 'Bright Smile Dental', who: 'Amy Chen', em: 'amy@brightsmiledental.com',
      hl: 'New patients welcome', ideas: ['Cleanings and checkups', 'Most insurance accepted', 'Evening hours available'],
      cta: 'Book your visit today', web: 'brightsmiledental.com', area: 'Carolina Forest', notes: 'We are closed Fridays' },
    'Plumbing': { biz: 'ABC Plumbing', who: 'Jim Smith', em: 'jim@abcplumbing.com',
      hl: 'Freeze warning this weekend', ideas: ['Pipe insulation', '$89 this month only'], cta: 'Call us today',
      web: 'abcplumbing.com', area: 'Carolina Forest', notes: "We're closed Sundays" },
    'HVAC': { biz: 'Cool Breeze Heating & Air', who: 'Tom Reed', em: 'tom@coolbreezehvac.com',
      hl: 'Get ready for winter', ideas: ['Furnace tune-up $79', 'Same-day service'], cta: 'Call to book today',
      web: 'coolbreezehvac.com', area: 'Surfside Beach', notes: 'We offer 24/7 emergency service' },
    'Lawn care': { biz: 'Green Edge Lawn Care', who: 'Chris Lane', em: 'chris@greenedgelawn.com',
      hl: 'Fall cleanup special', ideas: ['Leaf removal and edging', '$99 for most yards'], cta: 'Call for a free quote',
      web: 'greenedgelawn.com', area: 'Carolina Forest', notes: 'We work Monday to Saturday' },
    'Contractor or builder': { biz: 'Shoreline Builders', who: 'Mark Davis', em: 'mark@shorelinebuilders.com',
      hl: 'Kitchen remodels this fall', ideas: ['Free estimates', 'Licensed and insured'], cta: 'Call for a free estimate',
      web: 'shorelinebuilders.com', area: 'North Myrtle Beach', notes: 'Show our license number if there is room' },
    'Salon or spa': { biz: 'Serenity Salon & Spa', who: 'Kim Brooks', em: 'kim@serenitysalon.com',
      hl: 'Holiday glam special', ideas: ['Cut and style $45', 'Book by December 15'], cta: 'Book online today',
      web: 'serenitysalon.com', area: 'Market Common', notes: 'Walk-ins welcome on Saturdays' },
    'Retail store': { biz: 'Beachside Boutique', who: 'Jenna Cole', em: 'jenna@beachsideboutique.com',
      hl: 'Weekend sale', ideas: ['25% off all sweaters', 'Saturday and Sunday only'], cta: 'Shop this weekend',
      web: 'beachsideboutique.com', area: 'Myrtle Beach', notes: 'Open 10 to 6 every day' }
  };

  function typeNow() { var t = document.getElementById('type'); return t ? t.value : ''; }
  function now() { return EX[typeNow()] || EX['']; }
  function setPh(el, v) { if (el && v != null) el.setAttribute('placeholder', v); }

  function apply() {
    var x = now(), d = document;
    setPh(d.getElementById('biz'), x.biz);
    setPh(d.getElementById('who'), x.who);
    setPh(d.getElementById('nm'), x.who);
    setPh(d.getElementById('em'), x.em);
    setPh(d.getElementById('linkEm'), x.em);
    setPh(d.getElementById('web'), x.web);
    setPh(d.getElementById('area'), x.area);
    setPh(d.getElementById('notes'), x.notes);
    setPh(d.getElementById('brok'), (EX['Real estate'] || {}).brok);
    setPh(d.getElementById('hl'), x.hl);
    setPh(d.getElementById('ideas'), x.ideas.slice(0, 3).join('\n'));
    setPh(d.getElementById('cta'), x.cta);
    var i, l;
    l = d.querySelectorAll('[data-f="hl"]'); for (i = 0; i < l.length; i++) setPh(l[i], x.hl);
    l = d.querySelectorAll('[data-f="ideas"]'); for (i = 0; i < l.length; i++) setPh(l[i], x.ideas.join('\n'));
    l = d.querySelectorAll('[data-f="cta"]'); for (i = 0; i < l.length; i++) setPh(l[i], x.cta);
    var bw = d.getElementById('brokWrap'); if (bw) bw.hidden = typeNow() !== 'Real estate';
    try { d.dispatchEvent(new Event('cpmg-examples')); } catch (e) { /* very old browsers */ }
  }

  window.CPMG_EX = { now: now, apply: apply, list: EX };
  var t = document.getElementById('type');
  if (t) t.addEventListener('change', apply);
  apply();
  // Saved clients: the form fills in their type after it loads, and new graphic cards get added later.
  var last = typeNow(), cards = document.querySelectorAll('[data-f="hl"]').length;
  setInterval(function () {
    var n = document.querySelectorAll('[data-f="hl"]').length, v = typeNow();
    if (v !== last || n !== cards) { last = v; cards = n; apply(); }
  }, 700);
})();
