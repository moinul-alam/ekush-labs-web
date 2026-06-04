# Ekush Labs Web Monorepo

Welcome to the centralized web monorepo for **Ekush Labs**—a studio dedicated to building elegant, everyday utility applications that provide meaningful experiences.

This repository consolidates the landing pages, marketing sites, static web applications, and core API datasets that power the Ekush Labs ecosystem into a single unified workspace. This unified structure enables **perfect design consistency, shared assets, high maintainability, and rapid feature iteration**.

---

## 🧭 Monorepo Architecture

The workspace is organized as a zero-dependency static site monorepo, categorized into core sub-applications and a centralized source-of-truth style/component library:

```
ekush-labs-web/
├── apps/                 # Independent Static Applications & API Gates
│   ├── main/             # The central portal & studio gateway (ekushlabs.com)
│   ├── shonamoni/        # Child vaccination, growth tracker landing page
│   ├── jhuri/            # Smart bilingual grocery bazaar planner landing page
│   ├── ponji/            # Bengali financial ledger & calendar landing page
│   ├── hub/              # Static API microservice hosting JSON data files
│   └── tools/            # Hub of web utility applications (tools.ekushlabs.com)
├── shared/               # Central Source of Truth (Shared UI Resources & Design System)
└── README.md             # Developer blueprint (You are here)
```

---

## 📱 Sub-Applications Overview

Every sub-application serves as a standalone web property hosted on its own dedicated domain or subdomain:

### 1. Main Portal (`apps/main`)
* **Production URL**: [ekushlabs.com](https://ekushlabs.com)
* **Description**: The official studio gateway. Introduces the studio’s philosophy, showcases active applications, and guides users to individual product properties.
* **Key Technologies**: Vanilla HTML, CSS, JavaScript, dynamic SVG graphics, and custom CSS scroll animations.

### 2. Shonamoni (`apps/shonamoni`)
* **Production URL**: [shonamoni.ekushlabs.com](https://shonamoni.ekushlabs.com)
* **Description**: Landing page for **Shonamoni (সোনামণি)**—the premier child health tracking, immunization, and growth metrics application for parents in Bangladesh.
* **Typography Stack**: `Plus Jakarta Sans` & `Syne`.

### 3. Jhuri (`apps/jhuri`)
* **Production URL**: [jhuri.ekushlabs.com](https://jhuri.ekushlabs.com)
* **Description**: Landing page for **Jhuri (ঝুড়ি)**—a smart grocery list app that helps users plan their bazaar in under 20 seconds, featuring offline database access.
* **Typography Stack**: `Hind Siliguri` (for clean Bengali text layout) & `DM Serif Display`.

### 4. Ekush Ponji (`apps/ponji`)
* **Production URL**: [ekushponji.ekushlabs.com](https://ekushponji.ekushlabs.com)
* **Description**: Landing page for **Ekush Ponji (একুশ পঞ্জী)**—a comprehensive Bengali financial planner, ledger, and calendar tracker.
* **Typography Stack**: `Plus Jakarta Sans` & `Syne`.

### 5. Static Data Hub (`apps/hub`)
* **Production URL**: [hub.ekushlabs.com](https://hub.ekushlabs.com)
* **Description**: A high-performance static JSON API service. It hosts static configurations and database arrays consumed directly by the mobile client applications, eliminating the overhead of dynamic server-side runtimes.
* **Exposed Datasets**:
  * `/ponji/hijri/` — Dynamic moon-cycle offset Hijri calendar datasets.
  * `/ponji/holidays/` — Public and official holiday lists.
  * `/ponji/quotes/` — Daily motivational and utility quote matrices.
  * `/ponji/words/` — Curated translation files and educational arrays.

### 6. Web Tools Hub (`apps/tools`)
* **Production URL**: [tools.ekushlabs.com](https://tools.ekushlabs.com)
* **Description**: A consolidated collection of simple, everyday utility web applications (BMI Calculator, Age Calculator, Web Calendar).

---

## 🎨 Central Shared Resources (`/shared`)

To prevent duplicate code maintenance and keep branding completely uniform, all core designs, templates, and scripts for apps are centralized inside the `/shared` folder.

### ⚡ Assets & Libraries:
* **`css/design-tokens.css`**: Defines HSL tailored colors, spacing coordinates, responsive sizes, glassmorphism boundaries, and dark/light palettes.
* **`css/reset.css`**: Implements system element normals, noise-overlay textures, and grid alignments.
* **`css/animations.css`**: Standardizes reveal keyframes, floating offsets, and scroll indicators.
* **`css/components.css`**: A premium, responsive `68px` sticky header navbar and standard footer styling rules.
* **`js/theme-manager.js`**: Synchronously parsed in the `<head>` of all pages to prevent Flash of Unstyled Content (FOUC). Detects user preferences and locks light/dark configurations.
* **`js/observers.js`**: Universal staggered fade-in animations on scrolling via IntersectionObservers.
* **`js/loader.js`**: The universal dynamic fragment injector. It asynchronously fetches `navbar.html` and `footer.html`, parses active tabs, and wires up click triggers.
* **`sync.js`**: Lightweight Node.js build-mirror synchronizer for apps.

---

## 🔄 Dynamic CDN & Local Resource Injection

The monorepo uses a smart environment-detection script in the `<head>` of all HTML files. This eliminates the need for manual file synchronization or build tools.

### How it works:
* **Local Development**: If you run a local server (e.g. at `localhost:5500`), the script detects the local hostname and automatically serves shared assets via root-relative paths (`/shared/...`). Any change in the root `/shared` folder is instantly reflected across all apps without needing to copy files.
* **Production Deployment**: On the live domains, the script gracefully resolves to the production CDN (`https://shared.ekushlabs.com/...`).

---

## 🛠️ Local Development & Routing

To test the monorepo locally, you can serve the root directory using any static web server:

```bash
# Serve the repository root
npx http-server -p 8080
```

### 🛣️ Smart Monorepo Router Negotiator:
In production, individual sub-apps execute on their own subdomains (e.g. `jhuri.ekushlabs.com/privacy.html`).
Locally, however, they resolve inside folder paths (e.g. `localhost:8080/apps/jhuri/index.html`). Clicking root-relative paths like `/privacy.html` or back buttons like `https://ekushlabs.com` would normally result in broken links or 404 errors.

To solve this, [loader.js](/shared/js/loader.js) implements a **monorepo negotiator**:
1. **Directory Path Translation**: If it detects local subdirectory hosting (url contains `/apps/`), it dynamically rewrites all root-relative navbar and footer links (like `/#features`, `/privacy.html`, `/terms.html`, `/`) to prepend the active folder name (e.g. `/apps/jhuri/privacy.html`).
2. **Central Portal Escape**: Central hub links (`https://ekushlabs.com`) automatically resolve to the local portal homepage (`/apps/main/index.html`) when testing locally, keeping the entire browsing session fully contained on your local machine.

---

## 🌐 Production Subdomain Setup

When deploying to production (e.g. via Cloudflare Pages, Netlify, or Vercel), map the subdirectories directly to the corresponding DNS records in your domain registrar:

| Domain Mapping | Monorepo Target Path | Deployment Scope |
| :--- | :--- | :--- |
| **`ekushlabs.com`** | `/apps/main/` | Central Portal Hub |
| **`shonamoni.ekushlabs.com`** | `/apps/shonamoni/` | Shonamoni Landing |
| **`jhuri.ekushlabs.com`** | `/apps/jhuri/` | Jhuri Planner |
| **`ekushponji.ekushlabs.com`** | `/apps/ponji/` | Ponji Ledger |
| **`hub.ekushlabs.com`** | `/apps/hub/` | JSON Data Services |
| **`tools.ekushlabs.com`** | `/apps/tools/` | Web Utilities Hub |

---

## 💎 Visual & Performance Standards

1. **Lightweight Execution**: 100% static, vanilla architecture. Loading speeds are optimized with near-zero bundle footprints, loading from CDNs or local cache assets instantly.
2. **Late binding CSS variables**: Fallback design system variables (like font weights and base text colors) are declared as defaults inside the shared component stylesheets, meaning that each sub-app’s local `style.css` variables override the navigation items automatically to fit their local style guides!
3. **Glassmorphism**: Headers use a blurred transparent border backdrop filter (`backdrop-filter: blur(16px)`) creating a modern glass visual stack.
