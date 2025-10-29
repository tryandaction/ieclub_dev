/**
 * IEClub 主入口文件
 * 配置路由和全局状态
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRoutes from './router'
import './app.scss'

// 创建根节点
const root = ReactDOM.createRoot(document.getElementById('root'))

// 渲染应用
root.render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
)
