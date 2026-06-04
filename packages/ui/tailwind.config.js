/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "../../apps/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          start: '#1D5BFD',
          mid: '#10B981',
          end: '#06B6D4',
        },
        secondary: {
          start: '#F43F5E',
          end: '#F59E0B',
        },
        navy: {
          DEFAULT: '#030303',
          mid: '#0A0A0A',
          light: '#121212',
        },
        white: '#F8FAFC',
        silver: {
          DEFAULT: '#94A3B8',
          lt: '#CBD5E1',
        },
        textMuted: '#64748B',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        cond: ['Barlow Condensed', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
