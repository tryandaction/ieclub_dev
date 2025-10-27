// PostCSS 配置 - 微信小程序 Tailwind CSS v3
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer')({
      overrideBrowserslist: [
        'Android >= 4.0',
        'iOS >= 8'
      ]
    }),
    // weapp-tailwindcss 的 PostCSS 插件 - 正确路径
    require('weapp-tailwindcss/css-macro/postcss')({
      rem2rpx: true, // 将 rem 转换为 rpx
    })
  ]
};
