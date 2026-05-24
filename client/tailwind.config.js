/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#22d3ee',   // Vibrant Cyan / Turquoise Light
          DEFAULT: '#0891b2', // Primary Premium Turquoise/Cyan
          dark: '#0e7490',    // Deep Turquoise
          navy: '#0f1e24',    // Dark Navy with custom Cyan undertone
          slate: '#162e3b',   // Deep slate with Turquoise tint
        },
        royal: {
          gold: '#f59e0b',    // Adjusted gold highlight
          amber: '#d97706',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      transitionTimingFunction: {
        'cubic-custom': 'cubic-bezier(0.25, 1, 0.5, 1)',
      }
    },
  },
  plugins: [],
}
