/* ============================================================
   Ekush Ponji — components.js
   Structure:
   1. Component Loader
   2. Footer Year
   3. Active Nav Link Highlighter
   4. Navbar Scroll Effect
============================================================ */


/* ─── 1. COMPONENT LOADER ───────────────────────────────────── */
async function loadComponent(placeholderId, componentPath) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
    const html = await response.text();
    placeholder.outerHTML = html;
  } catch (error) {
    console.error(`Component load error [${placeholderId}]:`, error);
  }
}

Promise.all([
  loadComponent('navbar-placeholder', '/components/navbar.html'),
  loadComponent('footer-placeholder', '/components/footer.html'),
]).then(() => {
  setFooterYear();
  highlightActiveNavLink();
  initNavbarScroll();
});


/* ─── 2. FOOTER YEAR ────────────────────────────────────────── */
function setFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}


/* ─── 3. ACTIVE NAV LINK HIGHLIGHTER ───────────────────────── */
// Only marks privacy.html as active — anchor links (#section)
// are hover-only, never permanently active
function highlightActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    try {
      const url = new URL(link.href);
      // Only activate if it's a real page (not an anchor link)
      if (!url.hash && url.pathname !== '/' && url.pathname === currentPath) {
        link.classList.add('active');
      }
    } catch (e) { }
  });
}


/* ─── 4. NAVBAR SCROLL EFFECT ───────────────────────────────── */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}