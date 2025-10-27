import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 生产环境配置
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  build: {
    // 生产环境构建配置
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
  },
  server: {
    // 开发服务器配置
    port: 10086,
    host: true, // 允许外部访问
    // Vite 默认已启用 HTML5 History API fallback
    // 所有 404 请求都会返回 index.html，支持 BrowserRouter
    proxy: {
      // 代理API请求到后端服务器
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // 定义环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})
