/**
 * IEClub Taro 项目 Tailwind CSS 配置
 * 参考 ieclub-frontend 优化的配置
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,vue,html}',
    './src/index.html',
    './index.html',
  ],
  theme: {
    extend: {
      // 品牌颜色系统
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // 主要蓝色
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#2563eb',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7', // 主要紫色
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          DEFAULT: '#a855f7',
        },
        accent: {
          pink: '#ec4899',
          purple: '#8b5cf6',
          blue: '#3b82f6',
        },
        background: {
          DEFAULT: '#f9fafb',
          card: '#ffffff',
          muted: '#f3f4f6',
        },
        text: {
          primary: '#111827',
          secondary: '#4b5563',
          muted: '#9ca3af',
        },
      },
      // 动画
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideDown: 'slideDown 0.2s ease-out',
        blob: 'blob 7s infinite',
        'bounce-slow': 'bounce-slow 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      // 关键帧
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      // 圆角
      borderRadius: {
        card: '16px',
        button: '12px',
        xl: '20px',
        '2xl': '24px',
      },
      // 阴影
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
      // 间距
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // 最大宽度
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [],
  corePlugins: {
    // 禁用小程序不支持的功能
    preflight: false, // 禁用基础样式重置，避免小程序冲突
  },
};
