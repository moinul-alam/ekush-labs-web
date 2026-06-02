/* ============================================================
   Ekush Labs — loader.js
   Plain script. Requires theme.js to be loaded first.

   Placeholders declare their own shared root so no path
   guessing is needed:
     <div id="navbar-placeholder"
          data-shared-root="../shared"
          data-app-name="Ekush Ponji"></div>
     <div id="footer-placeholder"
          data-shared-root="../shared"
          data-app-name="Ekush Ponji"></div>
============================================================ */

(function () {

  /* ── 1. COMPONENT LOADER ─────────────────────────────── */

  async function loadSharedComponent(placeholderId, componentUrl, appName) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
      const response = await fetch(componentUrl);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const html = await response.text();

      const temp = document.createElement('div');
      temp.innerHTML = html.trim();
      const element = temp.firstElementChild;
      if (!element) throw new Error('Empty component: ' + componentUrl);

      if (appName) injectBranding(element, appName);
      resolveLocalDevLinks(element);
      placeholder.replaceWith(element);

    } catch (err) {
      console.error('[Loader] Failed to load ' + placeholderId + ':', err);
    }
  }

  /* ── 2. BRANDING INJECTION ───────────────────────────── */
  /* For the calendar the navbar is static in the HTML so  */
  /* branding injection only matters for the footer label. */

  function injectBranding(element, appName) {
    const footerLabel = element.querySelector('.footer-app-label');
    if (footerLabel) footerLabel.textContent = appName;

    // Generic nav brand fallback for non-calendar pages
    const lc = appName.toLowerCase();
    if (!lc.includes('ponji')) {
      const fb = element.querySelector('.nav-brand-fallback');
      if (fb) fb.textContent = appName;
    }
  }

  /* ── 3. FOOTER YEAR ──────────────────────────────────── */

  function setFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── 4. ACTIVE NAV LINK ──────────────────────────────── */

  function highlightActiveNavLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      try {
        const url = new URL(link.href, window.location.href);
        if (!url.hash && url.pathname !== '/' && url.pathname === currentPath) {
          link.classList.add('active');
        }
      } catch (_) {}
    });
  }

  /* ── 5. NAVBAR SCROLL ────────────────────────────────── */

  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    function onScroll() { navbar.classList.toggle('scrolled', window.scrollY > 50); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 6. MOBILE MENU ──────────────────────────────────── */

  function initMobileMenu() {
    const navbar = document.getElementById('navbar');
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!navbar || !toggle) return;

    const fresh = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(fresh, toggle);

    fresh.addEventListener('click', function () {
      navbar.classList.toggle('nav-open');
      document.body.classList.toggle('no-scroll');
    });

    if (navLinks) {
      navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          navbar.classList.remove('nav-open');
          document.body.classList.remove('no-scroll');
        });
      });
    }
  }

  /* ── 7. LOCAL DEV LINK RESOLVER ──────────────────────── */

  function resolveLocalDevLinks(element) {
    var path = window.location.pathname;
    if (!path.includes('/web-apps/') && !path.includes('/public/')) return;

    element.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('//')) return;

      if (href.includes('ekushlabs.com')) {
        // Rewrite hub link to local index in dev
        var base = path.substring(0, path.indexOf('/public/') + '/public/'.length);
        a.setAttribute('href', base + 'index.html');
        return;
      }

      if (href.startsWith('/')) {
        var publicIdx = path.indexOf('/public/');
        if (publicIdx !== -1) {
          var publicBase = path.substring(0, publicIdx + '/public/'.length);
          a.setAttribute('href', href === '/' ? publicBase : publicBase + href.slice(1));
        }
      }
    });
  }

  /* ── 8. BOOTSTRAP ────────────────────────────────────── */

  async function bootstrap() {
    var navbarEl = document.getElementById('navbar-placeholder');
    var footerEl = document.getElementById('footer-placeholder');
    var tasks = [];

    if (navbarEl) {
      var navRoot = navbarEl.dataset.sharedRoot || '../shared';
      var navApp  = navbarEl.dataset.appName || '';
      tasks.push(loadSharedComponent('navbar-placeholder', navRoot + '/components/navbar.html', navApp));
    }

    if (footerEl) {
      var footRoot = footerEl.dataset.sharedRoot || '../shared';
      var footApp  = footerEl.dataset.appName || '';
      tasks.push(loadSharedComponent('footer-placeholder', footRoot + '/components/footer.html', footApp));
    }

    await Promise.all(tasks);

    setFooterYear();

    // Init theme — wires #theme-toggle wherever it now lives in DOM
    if (window.EkushTheme) {
      window.EkushTheme.initTheme();
    }

    if (navbarEl) {
      highlightActiveNavLink();
      initNavbarScroll();
      initMobileMenu();
    }

    resolveLocalDevLinks(document.body);
    window.dispatchEvent(new Event('componentsLoaded'));
  }

  bootstrap();

})();