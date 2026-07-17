/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#7C3AED',
          yellow: '#14B8A6',
          darkBg: '#14141b',
          cardBg: 'rgba(18, 18, 22, 0.7)',
          borderBg: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(124, 58, 237, 0.15)',
        }
      }
    },
  },
  plugins: [],
}
