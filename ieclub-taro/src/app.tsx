// src/app.tsx - 应用入口文件

import { useEffect } from 'react'
import { useLaunch } from '@tarojs/taro'
import './app.scss'

function App(props: any) {
  // 应用启动时执行
  useLaunch(() => {
    console.log('IEClub 应用启动')
    
    // 🔥 关键修复：H5环境下的路由修复
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      // 修复hash路由问题
      const currentUrl = window.location.href;
      if (currentUrl.includes('#/')) {
        console.log('检测到hash路由，正在修复...');
        const cleanUrl = currentUrl.split('#')[0];
        window.history.replaceState(null, '', cleanUrl);
        console.log('路由已修复:', cleanUrl);
      }
      
      // 确保History API正常工作
      if (window.history && typeof window.history.pushState === 'function') {
        console.log('History API 可用');
      } else {
        console.warn('History API 不可用');
      }
    }
    
    // 可以在这里做一些初始化操作
    // 例如：检查登录状态、加载配置等
  })

  useEffect(() => {
    // 应用挂载后执行
    console.log('IEClub 应用已挂载')
    
    // 🔥 额外的路由修复逻辑
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      // 监听路由变化
      const handleRouteChange = () => {
        const currentPath = window.location.pathname;
        console.log('当前路由:', currentPath);
        
        // 如果URL包含hash，进行修复
        if (window.location.href.includes('#/')) {
          const cleanUrl = window.location.href.split('#')[0];
          window.history.replaceState(null, '', cleanUrl);
          console.log('路由已修复:', cleanUrl);
        }
      };
      
      // 监听popstate事件
      window.addEventListener('popstate', handleRouteChange);
      
      // 初始检查
      handleRouteChange();
      
      // 清理函数
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [])

  // children 是页面组件
  return props.children
}

export default App