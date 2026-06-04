import uiConfig from '@ekush-labs/ui/tailwind.config.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...uiConfig,
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../packages/ui/src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
}
