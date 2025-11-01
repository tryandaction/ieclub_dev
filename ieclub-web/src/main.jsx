import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import errorMonitor from './utils/errorMonitor'
import performanceMonitor from './utils/performance'

// 初始化错误监控
errorMonitor.init()
errorMonitor.loadFromLocalStorage()

// 初始化性能监控
performanceMonitor.init()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

