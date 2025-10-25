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