import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // 连接到生产环境API进行开发测试
        target: 'https://ieclub.online',
        changeOrigin: true,
        secure: false,
        // 如果需要本地后端，改为: target: 'http://localhost:3000'
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})

