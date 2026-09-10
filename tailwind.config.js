/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        berry: 'rgb(var(--berry) / <alpha-value>)',
        tint: 'rgb(var(--tint) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'], // Ou a fonte que você preferir
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}