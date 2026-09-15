/* The Pitch - loads editable promo copy from content/promo.json (managed via Pages CMS).
   The page's inline promo text is the fallback; this overwrites it before revealing,
   so there is no flash and nothing breaks if the fetch fails. */
(function () {
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function apply(bar, d) {
    if (d && d.enabled === false) { bar.style.display = 'none'; return; }
    if (d) {
      var hl = bar.querySelector('.promo-headline strong') || bar.querySelector('.promo-headline');
      if (hl && d.headline != null) hl.textContent = d.headline;
      var head = bar.querySelector('.promo-info .paragraph-2 strong') || bar.querySelector('.promo-info .paragraph-2');
      if (head && d.dropdown_heading != null)
        head.innerHTML = esc(d.dropdown_heading).replace(/\r?\n/g, '<br>');
      var list = bar.querySelector('.promo-info .list');
      if (list && Array.isArray(d.bullets))
        list.innerHTML = d.bullets.map(function(b){ return '<li class="list-item">' + esc(b) + '<br></li>'; }).join('');
      var cta = bar.querySelector('.promo-info .button .text-block');
      if (cta && d.cta_label != null) cta.textContent = d.cta_label;
    }
    bar.classList.add('promo-ready');   // reveal
  }
  function init() {
    var bars = document.querySelectorAll('.promo-bar');
    if (!bars.length) return;
    fetch('/content/promo.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) { bars.forEach(function (bar) { apply(bar, d); }); });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
