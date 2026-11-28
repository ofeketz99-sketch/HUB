/* Page interactions shared by all HUB pages:
   - scroll cue toggles: down to the section, and once past the hero, back to the top
   - header shadow once the page scrolls
   - sliding indicator under the active product tab
   - gentle reveal of content cards as they scroll into view
   State lives on <html> because navigation.js replaces <body>'s classes and <main>. */
(() => {
 const root = document.documentElement;
 const motionOK = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
 const behavior = () => (motionOK() ? 'smooth' : 'auto');

 /* Scroll state */
 let ticking = false;
 function isPastHero() {
   const hero = document.querySelector('.product-hero');
   const threshold = hero ? Math.min(hero.offsetHeight * 0.4, innerHeight * 0.4) : 200;
   return window.scrollY > threshold;
 }
 function syncScroll() {
   ticking = false;
   root.classList.toggle('is-scrolled', window.scrollY > 4);
   const past = isPastHero();
   root.classList.toggle('is-past-hero', past);
   const cue = document.querySelector('.scroll-cue');
   const label = cue?.querySelector(past ? '.cue-up' : '.cue-down');
   if (label) cue.setAttribute('aria-label', label.textContent.trim());
 }
 addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(syncScroll); } }, {passive: true});
 addEventListener('resize', syncScroll, {passive: true});

 /* Scroll cue: the same control takes you down and back up. */
 document.addEventListener('click', event => {
   const cue = event.target.closest?.('.scroll-cue');
   if (!cue || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
   event.preventDefault();
   if (isPastHero()) {
     window.scrollTo({top: 0, behavior: behavior()});
   } else {
     const target = document.querySelector(cue.getAttribute('href'));
     if (target) target.scrollIntoView({behavior: behavior(), block: 'start'});
   }
 });

 /* Sliding tab indicator */
 const nav = document.querySelector('.hub-tabs');
 let indicator;
 function placeIndicator() {
   if (!nav) return;
   const active = nav.querySelector('a.active');
   if (!indicator) {
     indicator = document.createElement('span');
     indicator.className = 'hub-tabs-indicator';
     indicator.setAttribute('aria-hidden', 'true');
     nav.prepend(indicator);
   }
   if (!active) { nav.classList.remove('has-indicator'); return; }
   indicator.style.setProperty('--x', active.offsetLeft + 'px');
   indicator.style.setProperty('--w', active.offsetWidth + 'px');
   nav.classList.add('has-indicator');
 }
 function readyIndicator() {
   placeIndicator();
   requestAnimationFrame(() => requestAnimationFrame(() => nav?.classList.add('is-ready')));
 }
 addEventListener('resize', placeIndicator, {passive: true});
 document.fonts?.ready.then(placeIndicator);

 /* Reveal on scroll */
 let observer;
 function setupReveal() {
   observer?.disconnect();
   if (!motionOK() || !('IntersectionObserver' in window)) { root.classList.remove('js-motion'); return; }
   root.classList.add('js-motion');
   observer = new IntersectionObserver(entries => {
     for (const entry of entries) {
       if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target); }
     }
   }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
   document.querySelectorAll('main .section').forEach(section => {
     section.querySelectorAll('.section-head, .about-card, .note, .calculator-card').forEach((el, i) => {
       if (el.classList.contains('is-in')) return;
       el.classList.add('reveal');
       el.style.setProperty('--d', Math.min(i, 5) * 60 + 'ms');
       observer.observe(el);
     });
   });
 }

 function init() { syncScroll(); setupReveal(); }
 document.addEventListener('hub:pagechange', () => { placeIndicator(); init(); });
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { readyIndicator(); init(); }, {once: true});
 else { readyIndicator(); init(); }
})();
