/* ============================================================
   EkushLabs — main.js
   1. Footer Year
   2. Theme Toggle
   3. Navbar & Mobile Menu
   4. Scroll Reveal
   5. Stats Counter Animation
============================================================ */

/**
 * 1. FOOTER YEAR
 */
const yearEl = document.getElementById('footer-year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/**
 * 2. THEME TOGGLE
 */
const themeToggle = document.querySelector('.theme-toggle');
const html = document.documentElement;

// Check system theme preference first
const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// Determine initial theme
const savedTheme = localStorage.getItem('theme');
const systemTheme = getSystemTheme();
const initialTheme = savedTheme || systemTheme || 'light';

html.setAttribute('data-theme', initialTheme);

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      html.setAttribute('data-theme', newSystemTheme);
    }
  });
}

// Toggle theme on button click
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

/**
 * 3. NAVBAR & MOBILE MENU
 */
const navbar = document.getElementById('navbar');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navbar && navToggle) {
  // Toggle Mobile Menu
  navToggle.addEventListener('click', () => {
    navbar.classList.toggle('nav-open');
    document.body.classList.toggle('no-scroll');
  });

  // Close menu when clicking links
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('nav-open');
      document.body.classList.remove('no-scroll');
    });
  });

  // Scroll effect
  const handleNavbarScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
}

/**
 * 3. SCROLL REVEAL
 */
const revealElements = document.querySelectorAll('.reveal');

if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
}

/**
 * 4. STATS COUNTER ANIMATION
 */
const stats = document.querySelectorAll('.about-stat-num');

if (stats.length > 0) {
  const animateStats = (el) => {
    const target = el.textContent;
    // Only animate if it's a number
    if (!isNaN(target)) {
      const targetNum = parseInt(target);
      let current = 0;
      const duration = 2000; // 2 seconds
      const stepTime = Math.abs(Math.floor(duration / targetNum));
      
      const timer = setInterval(() => {
        current += 1;
        el.textContent = current.toString().padStart(2, '0');
        if (current === targetNum) {
          clearInterval(timer);
        }
      }, stepTime);
    }
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateStats(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => statsObserver.observe(stat));
}