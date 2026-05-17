/* ============================================================
   Ekush Labs — loader.js
   Dynamic asynchronous layout component injector with automatic
   active path coloring, copyright year stamp, and scroll wrappers.
============================================================ */

/**
 * Core: Asynchronously load an HTML fragment and swap the placeholder
 */
async function loadSharedComponent(placeholderId, componentPath) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  const appName = placeholder.getAttribute('data-app-name');

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error(`HTTP status error: ${response.status}`);
    const html = await response.text();
    
    // Parse the HTML string into a DOM node
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    const element = tempDiv.firstElementChild;

    // Resolve local monorepo routing to prevent local 404s
    resolveLocalMonorepoLinks(element);


    // Dynamically inject custom configured branding based on appName
    if (appName) {
      const navBrand = element.querySelector('.nav-brand');
      if (navBrand) {
        const appNameLower = appName.toLowerCase();
        if (appNameLower.includes('ponji')) {
          // Re-create Ponji's custom text-split branding
          navBrand.innerHTML = `
            <img src="assets/app_logo.png" alt="Ekush Ponji" class="nav-logo" onerror="this.style.display='none'" />
            <span class="nav-name">
              <span class="nav-ekush">Ekush</span><span class="nav-ponji-text">Ponji</span>
            </span>
          `;
        } else if (appNameLower.includes('jhuri')) {
          // Re-create Jhuri's custom offset logo branding
          navBrand.innerHTML = `
            <img src="assets/app_logo.png" alt="Jhuri" class="nav-logo nav-jhuri-logo" onerror="this.style.display='none'" />
            <img src="assets/app_title.png" alt="Jhuri" class="nav-title-img" onerror="this.style.display='none'" />
          `;
        } else if (appNameLower.includes('shonamoni')) {
          // Re-create Shonamoni's title image branding
          navBrand.innerHTML = `
            <img src="assets/app_logo.png" alt="Shonamoni" class="nav-logo" onerror="this.style.display='none'" />
            <span class="nav-name">
              <img src="assets/app_title.png" alt="Shonamoni" class="nav-title-img" onerror="this.style.display='none'" />
            </span>
          `;
        } else {
          // Generic fallback
          const fallbackText = element.querySelector('.nav-brand-fallback');
          if (fallbackText) {
            fallbackText.textContent = appName;
          }
        }
      }

      const footerLabel = element.querySelector('.footer-app-label');
      if (footerLabel) {
        footerLabel.textContent = appName;
      }
    }

    placeholder.replaceWith(element);
  } catch (error) {
    console.error(`[Loader] Error rendering component [${placeholderId}]:`, error);
  }
}

/**
 * 1. DYNAMIC FOOTER COPYRIGHT YEAR
 */
function setFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * 2. NAV LINK HIGHLIGHTER
 */
function highlightActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    try {
      const url = new URL(link.href);
      // If path matches domain subdomain links
      if (!url.hash && url.pathname !== '/' && url.pathname === currentPath) {
        link.classList.add('active');
      }
    } catch (e) {}
  });
}

/**
 * 3. NAVBAR SCROLL SCROLLBAR WRAPPER
 */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  // Initial check in case page starts scrolled
  handleScroll();
}

/**
 * 4. MOBILE HAMBURGER MENU ACTIONS
 */
function initMobileMenu() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navbar && navToggle) {
    // Clean old listeners by replacement
    const newToggle = navToggle.cloneNode(true);
    navToggle.parentNode.replaceChild(newToggle, navToggle);

    newToggle.addEventListener('click', () => {
      navbar.classList.toggle('nav-open');
      document.body.classList.toggle('no-scroll');
    });

    if (navLinks) {
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navbar.classList.remove('nav-open');
          document.body.classList.remove('no-scroll');
        });
      });
    }
  }
}

// Coordinate loading of standard navbar and footer
Promise.all([
  loadSharedComponent('navbar-placeholder', '/shared/components/navbar.html'),
  loadSharedComponent('footer-placeholder', '/shared/components/footer.html')
]).then(() => {
  // Fire initialization routines
  setFooterYear();
  highlightActiveNavLink();
  initNavbarScroll();
  initMobileMenu();

  // Broadcast event to notify that shared elements are fully parsed
  window.dispatchEvent(new Event('componentsLoaded'));
});

/**
 * Local development monorepo router.
 * Rewrites root-relative links to match local subdirectory structures.
 */
function resolveLocalMonorepoLinks(element) {
  const path = window.location.pathname;
  // Detect if we are running inside the local /apps/ monorepo structure
  if (path.includes('/apps/')) {
    // Extract "/apps/app-name"
    const match = path.match(/^\/apps\/[^/]+/);
    if (match) {
      const appRoot = match[0]; // e.g. "/apps/shonamoni"
      
      // Select all anchors
      const anchors = element.querySelectorAll('a');
      anchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href) {
          // If the link points to the central portal hub
          if (href === 'https://ekushlabs.com' || href === 'https://ekushlabs.com/' || href.includes('://ekushlabs.com')) {
            anchor.setAttribute('href', '/apps/main/index.html');
          }
          // If the link is root-relative (starts with "/" but not "//" or external protocol)
          else if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('http') && !href.startsWith('mailto:')) {
            // Rewrite link to prepend the local subdirectory root
            const rewritten = href === '/' ? appRoot + '/' : appRoot + href;
            anchor.setAttribute('href', rewritten);
          }
        }
      });
    }
  }
}

