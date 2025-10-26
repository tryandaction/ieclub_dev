import { Component, PropsWithChildren, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

// 标准的 Taro React 应用入口组件
// 在 H5 和小程序环境中，Taro 会负责把 children 挂载到页面容器上
class App extends Component<PropsWithChildren> {
  componentDidMount() {
    console.log('🚀 App mounted - IEClub 启动')
    console.log('📱 当前环境:', process.env.TARO_ENV)
    console.log('🔧 运行模式:', process.env.NODE_ENV)
    
    // H5环境检测
    if (process.env.TARO_ENV === 'h5') {
      console.log('🌐 当前环境: H5')
      console.log('🔗 当前URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
      console.log('🔗 API地址:', process.env.API_URL || '/api (使用代理)')
      
      // 🔥 检查登录状态并跳转
      this.checkLoginAndRedirect()
    }
    
    // 小程序环境检测
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      console.log('📱 当前环境: 微信小程序')
    }
  }

  // 🔥 检查登录状态并跳转
  checkLoginAndRedirect() {
    if (typeof window === 'undefined') return
    
    console.log('🔧 检查登录状态...')
    
    // 延迟执行，确保Taro完全初始化
    setTimeout(() => {
      try {
        const currentPath = window.location.pathname
        console.log('📍 当前路径:', currentPath)
        
        // 检查是否有token
        const token = Taro.getStorageSync('token')
        
        if (token) {
          console.log('✅ 已登录状态，Token:', token.substring(0, 20) + '...')
          // 如果已登录且在登录页，跳转到广场
          if (currentPath.includes('/pages/login')) {
            console.log('🔄 已登录，即将跳转到广场')
            Taro.switchTab({ url: '/pages/square/index' }).catch(err => {
              console.error('❌ 跳转失败:', err)
              // 备用方案：直接修改URL
              window.location.href = '/pages/square/index'
            })
          }
        } else {
          console.log('❌ 未登录状态')
          // 如果未登录且不在登录页，跳转到登录页
          if (!currentPath.includes('/pages/login')) {
            console.log('🔄 未登录，即将跳转到登录页')
            Taro.redirectTo({ url: '/pages/login/index' }).catch(err => {
              console.error('❌ 跳转失败:', err)
              // 备用方案：直接修改URL
              window.location.href = '/pages/login/index'
            })
          } else {
            console.log('✅ 当前在登录页，无需跳转')
          }
        }
      } catch (error) {
        console.error('❌ 路由检查失败:', error)
      }
    }, 500)
  }

  componentDidShow() {
    console.log('👀 App show')
  }

  componentDidHide() {
    console.log('🙈 App hide')
  }

  componentDidCatchError(error: string) {
    console.error('❌ App Error:', error)
  }

  // 只需将子节点（页面）返回，交由 Taro 管理挂载
  render(): ReactNode {
    console.log('🎨 App render - 渲染子组件')
    return this.props.children || null
  }
}

export default App