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
    },
    // 修复微信小程序不支持 calc(1/2 * 100%) 的问题
    'postcss-calc': {
      precision: 10
    }
  }
};