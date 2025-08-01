/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'night-bg': 'var(--night-bg)',
        'night-surface': 'var(--night-surface)',
        'night-card': 'var(--night-card)',
        'night-text': 'var(--night-text)',
        'night-text-secondary': 'var(--night-text-secondary)',
        'night-accent': 'var(--night-accent)',
        'night-accent-hover': 'var(--night-accent-hover)',
        'night-border': 'var(--night-border)',
        'night-glow': 'var(--night-glow)',
        'night-hover-bg': 'var(--night-hover-bg)',
        'night-hover-border': 'var(--night-hover-border)',
        'night-card-hover': 'var(--night-card-hover)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
} 