import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import errorMonitor from './utils/errorMonitor'
import performanceMonitor from './utils/performance'
import { validateConfig } from './utils/configValidator'
import healthChecker from './utils/healthCheck'

// 🎨 打印启动信息
console.log('%c🎓 IEClub 学习社区', 'font-size: 24px; font-weight: bold; color: #667eea;')
console.log('%c正在启动应用...', 'font-size: 14px; color: #666;')

// 🔧 验证配置
const configResult = validateConfig()
if (!configResult.valid) {
  console.error('⚠️ 配置验证失败，应用可能无法正常工作')
  console.error('错误:', configResult.errors)
}

// 📊 初始化错误监控
try {
  errorMonitor.init()
  errorMonitor.loadFromLocalStorage()
  console.log('✅ 错误监控已启动')
} catch (error) {
  console.error('❌ 错误监控启动失败:', error)
}

// ⚡ 初始化性能监控
try {
  performanceMonitor.init()
  console.log('✅ 性能监控已启动')
} catch (error) {
  console.error('❌ 性能监控启动失败:', error)
}

// 🏥 启动健康检查（生产环境）
if (import.meta.env.PROD) {
  setTimeout(() => {
    healthChecker.fullCheck().then(result => {
      if (!result.healthy) {
        console.warn('⚠️ 后端服务健康检查失败，部分功能可能不可用')
      }
    })
    
    // 每 5 分钟检查一次
    healthChecker.startPeriodicCheck(5 * 60 * 1000)
  }, 2000)
}

// 🚀 渲染应用
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

console.log('✅ 应用启动完成')

