/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          border: 'var(--theme-border)',
          text: 'var(--theme-text)',
          muted: 'var(--theme-muted)',
          primary: 'var(--theme-primary)',
          primaryHover: 'var(--theme-primary-hover)',
        }
      }
    },
  },
  plugins: [],
};
