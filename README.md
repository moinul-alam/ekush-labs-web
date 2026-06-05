# Ekush Labs Web Ecosystem

Welcome to the centralized web monorepo for **Ekush Labs**—a studio dedicated to building elegant, everyday utility applications that provide meaningful experiences.

This repository consolidates our landing pages, marketing sites, and static web applications into a single, unified workspace powered by **Astro**, **Svelte**, and **Tailwind CSS**.

## 🧭 Monorepo Architecture

The workspace is structured as an NPM workspace containing independent Astro applications that share a common UI and design system package.

```
ekush-labs-web/
├── apps/                     # Independent Astro Applications
│   ├── main/                 # Central portal (ekushlabs.com)
│   ├── shonamoni/            # Shonamoni landing page
│   ├── jhuri/                # Jhuri landing page
│   ├── ponji/                # Ekush Ponji landing page
│   └── tools/                # Web utility applications (BMI, Age Calc, etc.)
├── packages/
│   └── ui/                   # Shared UI components, layouts, Tailwind config, and i18n
├── guideline.md              # Developer instructions for extending the monorepo
└── README.md                 # Project overview
```

## 🛠️ Local Development

To run any of the applications locally, use the workspace dev command from the root directory:

```bash
# Install all workspace dependencies
npm install

# Run the Tools Portal
npm run dev --workspace=apps/tools

# Run the Shonamoni Landing Page
npm run dev --workspace=apps/shonamoni

# Run the Main Portal
npm run dev --workspace=apps/main
```

## 🏗️ Building for Production

To build an application for production, run the build command for the specific workspace. Astro will output a fully optimized static site into the `dist/` folder of that app.

```bash
# Build the Tools Portal
npm run build --workspace=apps/tools
```

The output will be located at `apps/tools/dist/`.

## ☁️ Cloudflare Pages Deployment

Each sub-application is designed to be hosted independently on Cloudflare Pages.

### Setting up a new Cloudflare Pages Project

1. Connect your GitHub repository to Cloudflare Pages.
2. Select the repository.
3. Configure the build settings for the specific app you want to deploy:
   - **Framework Preset**: Astro
   - **Build Command**: `npm run build --workspace=apps/[app-name]` (e.g., `npm run build --workspace=apps/ponji`)
   - **Build Output Directory**: `apps/[app-name]/dist` (e.g., `apps/ponji/dist`)
   - **Root Directory**: Leave blank (root of the repo)
4. Set up custom domains in Cloudflare mapping to the respective app (e.g., `shonamoni.ekushlabs.com` mapping to the Shonamoni project).

For detailed instructions on creating new tools and apps within this architecture, please refer to [guideline.md](./guideline.md).
