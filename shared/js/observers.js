/* ============================================================
   Ekush Labs — observers.js
   Dynamic Intersection Observer for fluid scroll reveal animations.
   Supports staggered entrances to match premium layouts.
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const initObservers = () => {
    const revealElements = document.querySelectorAll('.reveal');

    if (revealElements.length > 0) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
              // Apply a small staggered delay for premium entrance feel
              setTimeout(() => {
                entry.target.classList.add('visible');
              }, idx * 60);

              revealObserver.unobserve(entry.target);
            }
          });
        },
        { 
          root: null, // viewport
          threshold: 0.1, // trigger when 10% visible
          rootMargin: '0px 0px -40px 0px' // offset bottom triggers slightly for better visual entry
        }
      );

      revealElements.forEach((el) => {
        // Only observe if not already revealed
        if (!el.classList.contains('visible')) {
          revealObserver.observe(el);
        }
      });
    }
  };

  // Run on primary DOM load
  initObservers();

  // Re-run whenever dynamic templates complete rendering
  window.addEventListener('componentsLoaded', initObservers);
});
