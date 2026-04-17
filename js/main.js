/* ============================================================
   EkushLabs — main.js
   Structure:
   1. Footer Year
   2. Navbar Scroll Effect
   3. Scroll Reveal
   4. Analytics Placeholder
============================================================ */


/* ─── 1. FOOTER YEAR ────────────────────────────────────────── */
// Automatically keeps copyright year current
const yearEl = document.getElementById('footer-year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


/* ─── 2. NAVBAR SCROLL EFFECT ───────────────────────────────── */
// Adds .scrolled class to navbar when user scrolls down
const navbar = document.getElementById('navbar');

if (navbar) {
  const handleNavbarScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
}


/* ─── 3. SCROLL REVEAL ──────────────────────────────────────── */
// Reveals elements with .reveal class as they enter the viewport
const revealElements = document.querySelectorAll('.reveal');

if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger sibling reveals slightly
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


/* ─── 4. ANALYTICS PLACEHOLDER ─────────────────────────────── */
// TODO: Uncomment and configure once Google Analytics is set up
// Replace G-XXXXXXXXXX in index.html with your Measurement ID
// then remove this comment block.
//
// Custom event tracking example (use after GA is configured):
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
// Example usage:
// document.querySelector('.hero-cta')?.addEventListener('click', () => {
//   trackEvent('Navigation', 'click', 'Hero CTA - View Our Apps');
// });


/* ─── 5. BUTTON TEXT SLIDING ANIMATION ON HOVER ────────────────────────── */
const heroCta = document.querySelector('.hero-cta');
const heroCtaText = document.querySelector('.hero-cta span');
const originalText = 'View Our Apps';
const hoverText = 'Click Here';

if (heroCta && heroCtaText) {
  // Create a wrapper to prevent jiggling
  const textWrapper = document.createElement('div');
  textWrapper.style.display = 'inline-block';
  textWrapper.style.overflow = 'hidden';
  textWrapper.style.width = '120px';
  textWrapper.style.textAlign = 'center';
  textWrapper.style.verticalAlign = 'middle';

  // Replace span with wrapper
  heroCtaText.parentNode.insertBefore(textWrapper, heroCtaText);
  textWrapper.appendChild(heroCtaText);

  // Set up text styles
  heroCtaText.style.transition = 'transform 0.4s ease';
  heroCtaText.style.display = 'inline-block';
  heroCtaText.style.whiteSpace = 'nowrap';
  heroCtaText.style.width = '120px';
  heroCtaText.style.textAlign = 'center';

  heroCta.addEventListener('mouseenter', () => {
    // Slide out to right
    heroCtaText.style.transform = 'translateX(100%)';

    setTimeout(() => {
      // Change text and slide in from left
      heroCtaText.textContent = hoverText;
      heroCtaText.style.transform = 'translateX(-100%)';

      setTimeout(() => {
        heroCtaText.style.transform = 'translateX(0)';
      }, 50);
    }, 200);
  });

  heroCta.addEventListener('mouseleave', () => {
    // Slide out to left
    heroCtaText.style.transform = 'translateX(-100%)';

    setTimeout(() => {
      // Change text and slide in from right
      heroCtaText.textContent = originalText;
      heroCtaText.style.transform = 'translateX(100%)';

      setTimeout(() => {
        heroCtaText.style.transform = 'translateX(0)';
      }, 50);
    }, 200);
  });
}