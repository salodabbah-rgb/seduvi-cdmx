/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gob-primary': '#556B2F',
        'gob-dark': '#3d4d22'
      }
    },
  },
  plugins: [],
}