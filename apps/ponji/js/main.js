/* ============================================================
   Ekush Ponji — main.js
   Structure:
   1. Scroll Reveal
   2. Analytics Placeholder
============================================================ */


/* ─── 1. SCROLL REVEAL ──────────────────────────────────────── */
// Reveals elements with .reveal class as they enter the viewport
const revealElements = document.querySelectorAll('.reveal');

if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
}


/* ─── 2. ANALYTICS PLACEHOLDER ─────────────────────────────── */
// TODO: Uncomment once Google Analytics is configured in index.html
//
// function trackEvent(category, action, label) {
//   if (typeof gtag === 'function') {
//     gtag('event', action, {
//       event_category: category,
//       event_label: label,
//     });
//   }
// }
//
// Example:
// document.querySelector('#play-store-btn')?.addEventListener('click', () => {
//   trackEvent('Conversion', 'click', 'Play Store Download');
// });