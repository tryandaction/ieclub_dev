import { Component, PropsWithChildren, ReactNode } from 'react'
import './app.scss'

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    console.log('🚀 IEClub启动成功')
    
    // 隐藏loading界面
    setTimeout(() => {
      const loading = document.getElementById('loading')
      if (loading) {
        loading.style.opacity = '0'
        loading.style.transition = 'opacity 0.3s'
        setTimeout(() => {
          loading.style.display = 'none'
        }, 300)
      }
    }, 100)
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ App错误:', error, errorInfo)
    // 确保即使出错也隐藏loading
    const loading = document.getElementById('loading')
    if (loading) {
      loading.style.display = 'none'
    }
  }

  render(): ReactNode {
    return this.props.children || null
  }
}

export default App
