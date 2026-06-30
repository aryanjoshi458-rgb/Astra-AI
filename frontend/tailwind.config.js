/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        darkBg: '#0b0a09',
        darkCard: '#161514',
        // Light theme colors (used via .light class CSS vars)
        lightBg: '#f5f5f4',
        lightCard: '#ffffff',
        // Use a visible blue for primary/accent buttons (was white)
        accentBlue: '#0ea5e9',
        accentIndigo: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
