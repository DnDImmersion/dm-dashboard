/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dnd-red': '#8B0000',
        'dnd-gold': '#DAA520', 
        'parchment': '#F4E4BC'
      }
    },
  },
}