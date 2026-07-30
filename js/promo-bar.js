/* The Pitch — promo bar dropdown toggle.
   Replaces the Webflow interaction so the panel starts collapsed (no load flash)
   and expands/collapses on click with a smooth height animation. */
(function () {
  function toggle(bar) {
    var dd = bar.querySelector('.promo-bar-dropdown');
    if (!dd) return;
    if (bar.classList.contains('promo-open')) {
      dd.style.height = dd.scrollHeight + 'px';
      dd.getBoundingClientRect();            // force reflow
      dd.style.height = '0px';
      bar.classList.remove('promo-open');
    } else {
      bar.classList.add('promo-open');
      dd.style.height = dd.scrollHeight + 'px';
      dd.addEventListener('transitionend', function te(e) {
        if (e.propertyName === 'height') {
          dd.style.height = 'auto';           // allow responsive reflow while open
          dd.removeEventListener('transitionend', te);
        }
      });
    }
  }
  function init() {
    document.querySelectorAll('.promo-bar').forEach(function (bar) {
      var trigger = bar.querySelector('.promo-bar-main') || bar;
      trigger.style.cursor = 'pointer';
      trigger.addEventListener('click', function () { toggle(bar); });
    });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
