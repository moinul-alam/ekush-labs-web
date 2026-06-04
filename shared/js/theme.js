/* ============================================================
   Ekush Labs — theme.js
   Exposes EkushTheme global used by loader.js and any app.
============================================================ */

(function () {
  const THEME_KEY = 'ekush_theme';

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', isDark);
    document.querySelectorAll('.theme-icon--light').forEach(el =>
      el.classList.toggle('theme-icon-hidden', isDark)
    );
    document.querySelectorAll('.theme-icon--dark').forEach(el =>
      el.classList.toggle('theme-icon-hidden', !isDark)
    );
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return next;
  }

  function bindThemeToggle(btn) {
    if (!btn) return;
    btn.addEventListener('click', toggleTheme);
  }

  function initTheme() {
    applyTheme(getStoredTheme());
    bindThemeToggle(document.getElementById('theme-toggle'));
  }

  // Expose globally
  window.EkushTheme = { getStoredTheme, applyTheme, toggleTheme, bindThemeToggle, initTheme };
})();