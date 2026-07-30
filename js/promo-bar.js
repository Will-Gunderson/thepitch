/* The Pitch - promo bar dropdown.
   Replaces the Webflow interaction: panel starts collapsed (no load flash),
   toggles on the bar, closes via the X, with a smooth height animation.
   Height is measured from the real auto layout (accurate for the desktop
   flex-row layout, where scrollHeight on a collapsed row is unreliable). */
(function () {
  function naturalHeight(dd) {
    var prev = dd.style.height;
    dd.style.transition = 'none';   // no animation while measuring
    dd.style.height = 'auto';
    var h = dd.offsetHeight;        // true laid-out height
    dd.style.height = prev || '0px';
    dd.getBoundingClientRect();     // commit start height
    dd.style.transition = '';       // restore CSS transition
    return h;
  }
  function open(bar, dd) {
    bar.classList.add('promo-open');
    dd.style.height = naturalHeight(dd) + 'px';
    dd.addEventListener('transitionend', function te(e) {
      if (e.propertyName === 'height') {
        dd.style.height = 'auto';   // allow responsive reflow while open
        dd.removeEventListener('transitionend', te);
      }
    });
  }
  function close(bar, dd) {
    dd.style.height = dd.offsetHeight + 'px';  // current real height
    dd.getBoundingClientRect();                // commit before collapsing
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
