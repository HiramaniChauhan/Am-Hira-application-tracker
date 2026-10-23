/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#101114',
          surface: '#17181c',
          card: '#1c1d22',
          border: '#282930',
          hover: '#24252b'
        },
        gold: {
          DEFAULT: '#c5a059',
          light: '#d8b46e',
          dark: '#a6823c',
          subtle: 'rgba(197, 160, 89, 0.12)'
        }
      },
      fontFamily: {
        brand: ['Syne', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
