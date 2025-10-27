/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,vue,html}',
    './src/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff6b6b',
          light: '#ff8787',
          dark: '#fa5252',
        },
        secondary: {
          DEFAULT: '#4ecdc4',
          light: '#6fd9d0',
          dark: '#38b2ac',
        },
        accent: '#ffd93d',
        background: {
          DEFAULT: '#f7f7f7',
          card: '#ffffff',
        },
        text: {
          primary: '#2d3436',
          secondary: '#636e72',
          muted: '#b2bec3',
        },
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    // 禁用小程序不支持的功能
    preflight: false, // 禁用基础样式重置
  },
};
