/* The Pitch - cookie consent banner + Google Consent Mode update.
   Shows once until the visitor chooses; remembers the choice; updates Google
   consent so Accept enables tags and Reject keeps them limited. */
(function () {
  var KEY = 'pitch-cookie-consent';
  function store(v){ try { localStorage.setItem(KEY, v); } catch(e){} }
  function read(){ try { return localStorage.getItem(KEY); } catch(e){ return null; } }
  function updateConsent(state){
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    var v = state === 'granted' ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v
    });
  }
  function dismiss(banner){
    banner.classList.remove('cookie-show');
    setTimeout(function(){ if (banner.parentNode) banner.parentNode.removeChild(banner); }, 450);
  }
  function build(){
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<div class="cookie-banner-text">' +
          '<h3 class="cookie-banner-title">How We Use Cookies</h3>' +
          '<p class="cookie-banner-body">We use Google tools to measure website traffic, understand how visitors use our site, and, where applicable, measure and personalize advertising. Google may use cookies or similar technologies for analytics, ad measurement, and ad personalization. You can choose whether to allow Google-related cookies and data sharing. If you decline, Google tags will be limited based on your choice.</p>' +
        '</div>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="cookie-btn cookie-btn-reject">Reject Cookies</button>' +
          '<button type="button" class="cookie-btn cookie-btn-accept">Accept Cookies</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    requestAnimationFrame(function(){ banner.classList.add('cookie-show'); });
    banner.querySelector('.cookie-btn-accept').addEventListener('click', function(){
      updateConsent('granted'); store('granted'); dismiss(banner);
    });
    banner.querySelector('.cookie-btn-reject').addEventListener('click', function(){
      updateConsent('denied'); store('denied'); dismiss(banner);
    });
  }
  function init(){ if (!read()) build(); }   // only show until a choice is made
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
