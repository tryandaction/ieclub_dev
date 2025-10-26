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
      
      // 🔥 H5路由修复：强制初始化路由
      this.fixH5Router()
    }
    
    // 小程序环境检测
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      console.log('📱 当前环境: 微信小程序')
    }
    
    // 检查是否有token
    const token = Taro.getStorageSync('token')
    if (token) {
      console.log('✅ 已登录状态')
    } else {
      console.log('❌ 未登录状态')
    }
  }

  // 🔥 H5路由修复方法
  fixH5Router() {
    if (typeof window === 'undefined') return
    
    console.log('🔧 开始H5路由修复...')
    
    // 延迟执行，确保Taro完全初始化
    setTimeout(() => {
      const currentPath = window.location.pathname
      console.log('📍 当前路径:', currentPath)
      
      // 如果路径是根路径，重定向到首页
      if (currentPath === '/' || currentPath === '') {
        console.log('🔄 重定向到首页')
        window.history.replaceState(null, '', '/pages/square/index')
        // 触发路由更新
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
      
      // 检查页面内容是否已渲染
      setTimeout(() => {
        const appContainer = document.getElementById('app')
        if (appContainer && appContainer.children.length === 0) {
          console.log('⚠️ 检测到空页面，尝试强制渲染')
          this.forceRenderPage()
        }
      }, 1000)
      
    }, 500)
  }

  // 🔥 强制渲染页面内容
  forceRenderPage() {
    console.log('🔧 强制渲染页面内容...')
    
    // 尝试重新触发Taro路由
    if (window.Taro && window.Taro.getCurrentInstance) {
      try {
        const instance = window.Taro.getCurrentInstance()
        console.log('🔄 获取Taro实例:', instance)
        
        // 强制重新渲染
        this.forceUpdate()
      } catch (error) {
        console.error('❌ 强制渲染失败:', error)
      }
    }
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