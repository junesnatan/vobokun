/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        suv: {
          dark: 'var(--color-suv-dark)',
          darker: 'var(--color-suv-darker)',
          slate: 'var(--color-suv-slate)',
          gray: 'var(--color-suv-gray)',
          light: 'var(--color-suv-light)',
          gold: 'var(--color-suv-gold)',
          'gold-light': 'var(--color-suv-gold-light)',
          amber: 'var(--color-suv-amber)',
          red: 'var(--color-suv-red)',
          purple: 'var(--color-suv-purple)',
          yellow: 'var(--color-suv-yellow)',
          cyan: 'var(--color-suv-cyan)',
          emerald: 'var(--color-suv-emerald)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
