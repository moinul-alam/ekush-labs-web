# Ekush Labs Web Monorepo - Developer Guidelines

Welcome! This guide explains how this NPM workspace monorepo is structured and how to add new apps or tools.

## Architecture Overview

This project uses an NPM Workspace monorepo powered by **Astro**, **Svelte**, and **Tailwind CSS**.

### Directory Structure
- `apps/`: Contains individual web applications. Each folder here is an independent Astro project.
  - `apps/shonamoni`: Landing page for Shonamoni.
  - `apps/jhuri`: Landing page for Jhuri.
  - `apps/ponji`: Landing page for Ekush Ponji.
  - `apps/tools`: The tools portal containing various web tools (BMI, Age Calculator, Calendar).
  - `apps/main`: The main EkushLabs portal.
- `packages/ui/`: The shared component library and design system. Contains the global styling, i18n dictionaries, and layout wrappers used by all apps.

## The Shared UI Package (`@ekush-labs/ui`)

All common components and styles live in `packages/ui/`.
- **Layouts**: `src/layouts/BaseLayout.astro` is the standard wrapper for all pages. It includes the Navbar, Footer, and sets up Tailwind and theme detection.
- **Components**: Shared UI like `Navbar.astro`, `Footer.astro`, `LanguageToggle.svelte`, and `ThemeToggle.svelte`.
- **Styling**: `global.css` (Tailwind imports and custom classes) and `tailwind.config.mjs` (Color palettes and fonts).
- **Internationalization (i18n)**: All localized strings are defined in `src/i18n/ui.ts`. When adding new tools or apps, their string translations must be added here first.

## How to Build a New Tool

To add a new tool (like the BMI Calculator) to the `apps/tools` workspace:

1. **Add Translations**: Add the tool's localized strings (English and Bangla) to `packages/ui/src/i18n/ui.ts`.
2. **Create the Logic/UI**: Create a Svelte component for the tool in `apps/tools/src/components/[ToolName].svelte`.
   - Use Tailwind for styling.
   - Use the `localizeNumber` utility if you need to display numbers in Bengali.
3. **Create the Page**: Create an Astro page in `apps/tools/src/pages/[tool-name].astro`.
   - Import `BaseLayout` from `@ekush-labs/ui/src/layouts/BaseLayout.astro`.
   - Wrap your Svelte component inside `BaseLayout` and pass `appName="EkushTools"`.
4. **Update Navigation**: Add the new tool to the dropdown menu inside `packages/ui/src/components/Navbar.astro` (under the `EkushTools` section).
5. **Update Tools Portal**: Add a card for the new tool in `apps/tools/src/components/ToolsPage.astro`.

## How to Build a New Landing Page (App)

To create a new standalone product site (like Ponji or Shonamoni):

1. **Create Workspace**: Duplicate an existing app folder (e.g., `shonamoni`) to `apps/[new-app]`.
2. **Update Package Info**: Change the name in `apps/[new-app]/package.json`.
3. **Update Translations**: Add the new app's copy to `packages/ui/src/i18n/ui.ts`.
4. **Build the Page**: Modify `apps/[new-app]/src/pages/index.astro` and `apps/[new-app]/src/components/[App]Page.astro`.
5. **Update Main Portal**: Add the new app to the "Our Ecosystem" section in `apps/main`.

## Useful Commands

- **Run Dev Server for an App**: `npm run dev --workspace=apps/[app-name]` (e.g., `npm run dev --workspace=apps/tools`)
- **Build an App**: `npm run build --workspace=apps/[app-name]`
