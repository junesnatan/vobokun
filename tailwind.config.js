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
          red: 'var(--color-suv-red)',
          purple: 'var(--color-suv-purple)',
          gold: 'var(--color-suv-gold)',
          yellow: 'var(--color-suv-yellow)',
          dark: 'var(--color-suv-dark)',
          darker: 'var(--color-suv-darker)',
          slate: 'var(--color-suv-slate)',
          gray: 'var(--color-suv-gray)',
          light: 'var(--color-suv-light)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
