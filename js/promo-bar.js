/* The Pitch - promo bar dropdown.
   Replaces the Webflow interaction: panel starts collapsed (no load flash),
   toggles on the bar, closes via the X, with a smooth height animation. */
(function () {
  function open(bar, dd) {
    bar.classList.add('promo-open');
    dd.style.height = dd.scrollHeight + 'px';
    dd.addEventListener('transitionend', function te(e) {
      if (e.propertyName === 'height') {
        dd.style.height = 'auto';           // allow responsive reflow while open
        dd.removeEventListener('transitionend', te);
      }
    });
  }
  function close(bar, dd) {
    dd.style.height = dd.scrollHeight + 'px';
    dd.getBoundingClientRect();             // force reflow so the collapse animates
    dd.style.height = '0px';
    bar.classList.remove('promo-open');
  }
  function init() {
    document.querySelectorAll('.promo-bar').forEach(function (bar) {
      var dd = bar.querySelector('.promo-bar-dropdown');
      if (!dd) return;
      var trigger = bar.querySelector('.promo-bar-main') || bar;
      trigger.style.cursor = 'pointer';
      trigger.addEventListener('click', function () {
        bar.classList.contains('promo-open') ? close(bar, dd) : open(bar, dd);
      });
      var closeBtn = bar.querySelector('.close-promo-wrapper');
      if (closeBtn) closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (bar.classList.contains('promo-open')) close(bar, dd);
      });
    });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
