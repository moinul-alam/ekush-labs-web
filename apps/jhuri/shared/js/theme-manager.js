/* ============================================================
   Ekush Labs — theme-manager.js
   Premium system-aware dark/light theme management system.
   Executes immediately to avoid page rendering flashes (FOUC).
============================================================ */

(function () {
  const getSystemTheme = () => {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  };

  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || getSystemTheme() || 'dark'; // Dark is default obsidian

  // Set the theme attribute instantly on the html node
  document.documentElement.setAttribute('data-theme', initialTheme);

  // Listen for real-time operating system theme preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newSystemTheme);
      }
    });
  }

  // Once the page structure is loaded, bind theme toggle click actions
  document.addEventListener('DOMContentLoaded', () => {
    const bindToggles = () => {
      const themeToggles = document.querySelectorAll('.theme-toggle');
      themeToggles.forEach(toggle => {
        // Remove previous listeners if any (idempotency safety)
        toggle.replaceWith(toggle.cloneNode(true));
      });

      const activeToggles = document.querySelectorAll('.theme-toggle');
      activeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);
        });
      });
    };

    bindToggles();

    // Re-bind when components are loaded dynamically
    window.addEventListener('componentsLoaded', bindToggles);
  });
})();
