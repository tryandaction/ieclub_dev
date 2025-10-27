export default {
  plugins: {
    '@tailwindcss/postcss': {
      // 禁用所有优化，避免卡死
      optimize: false
    },
    autoprefixer: {
      overrideBrowserslist: [
        'Android >= 4.0',
        'iOS >= 8'
      ]
    }
  }
};