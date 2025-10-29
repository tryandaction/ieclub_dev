/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        gradient: {
          from: '#667eea',
          to: '#764ba2'
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-offer': 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
        'gradient-demand': 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
        'gradient-project': 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
      }
    },
  },
  plugins: [],
}

