/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontSize: {
        'resp-xs': 'clamp(0.625rem, 2vw, 0.75rem)',
        'resp-sm': 'clamp(0.75rem, 2.5vw, 0.875rem)',
        'resp-base': 'clamp(0.875rem, 3vw, 1rem)',
        'resp-lg': 'clamp(1rem, 3.5vw, 1.125rem)',
        'resp-xl': 'clamp(1.125rem, 4vw, 1.25rem)',
        'resp-2xl': 'clamp(1.25rem, 4.5vw, 1.5rem)',
        'resp-3xl': 'clamp(1.5rem, 5vw, 1.875rem)',
        'resp-4xl': 'clamp(1.875rem, 6vw, 2.25rem)',
      },
      spacing: {
        'resp-1': 'clamp(0.125rem, 1vw, 0.25rem)',
        'resp-2': 'clamp(0.25rem, 1.5vw, 0.5rem)',
        'resp-3': 'clamp(0.5rem, 2vw, 0.75rem)',
        'resp-4': 'clamp(0.75rem, 2.5vw, 1rem)',
        'resp-6': 'clamp(1rem, 3vw, 1.5rem)',
        'resp-8': 'clamp(1.25rem, 4vw, 2rem)',
      },
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
      },
      borderRadius: {
        'resp': 'clamp(0.5rem, 2vw, 1rem)',
        'resp-lg': 'clamp(0.75rem, 2.5vw, 1.25rem)',
        'resp-xl': 'clamp(1rem, 3vw, 1.5rem)',
      },
    },
  },
  plugins: [],
}

