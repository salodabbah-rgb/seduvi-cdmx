/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gob-primary': '#9d2449',
        'gob-dark': '#621132'
      }
    },
  },
  plugins: [],
}
