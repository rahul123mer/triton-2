/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: 'var(--navy-900)', 800: 'var(--navy-800)', 700: 'var(--navy-700)' },
        brand: { 800: 'var(--blue-800)', 700: 'var(--blue-700)', 600: 'var(--blue-600)', 50: 'var(--blue-50)' },
        page: 'var(--page)', card: 'var(--card)', border: 'var(--border)', divider: 'var(--divider)',
        ink: { 900: 'var(--ink-900)', 600: 'var(--ink-600)', 400: 'var(--ink-400)' },
      },
      borderRadius: { card: 'var(--r-card)', ctl: 'var(--r-ctl)' },
      boxShadow: { card: 'var(--shadow-card)' },
    },
  },
  plugins: [],
}
