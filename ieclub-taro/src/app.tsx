// src/app.tsx - 应用入口文件

import { useEffect } from 'react'
import { useLaunch } from '@tarojs/taro'
import './app.scss'

function App(props: any) {
  // 应用启动时执行
  useLaunch(() => {
    console.log('IEClub 应用启动')
    
    // 可以在这里做一些初始化操作
    // 例如：检查登录状态、加载配置等
  })

  useEffect(() => {
    // 应用挂载后执行
    console.log('IEClub 应用已挂载')
  }, [])

  // children 是页面组件
  return props.children
}

export default App