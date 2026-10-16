/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fdf4f3',
          100: '#fbe8e6',
          200: '#f8d4cf',
          300: '#f2b5ac',
          400: '#e8897b',
          500: '#d95d4c',
          600: '#c54433',
          700: '#a43425',
          800: '#882e22',
          900: '#712a21',
          950: '#3e130d',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glow': '0 0 25px -5px rgba(217, 93, 76, 0.3)',
      }
    },
  },
  plugins: [],
}
