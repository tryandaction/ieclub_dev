import { Component, PropsWithChildren } from 'react'
import { Current } from '@tarojs/runtime'
import { createRoot, Root } from 'react-dom/client'
import './app.scss'

// ==================== 1. 定义一个全局变量来持有 React Root ====================
let root: Root | null = null;

// 这是一个继承自 React.Component 的类组件，能更好地利用Taro的生命周期
class App extends Component<PropsWithChildren> {

  // Taro/React 在应用准备好后会调用这个生命周期方法
  componentDidMount() {
    console.log('--- ✅ [React 18 App] componentDidMount triggered ---');
    this.renderReactApp();
  }

  // 当Taro切换页面导致props变化时，这个生命周期方法也会被调用
  componentDidUpdate() {
    console.log('--- ✅ [React 18 App] componentDidUpdate triggered ---');
    this.renderReactApp();
  }

  // 我们的核心渲染逻辑
  renderReactApp() {
    console.log('--- 🚀 [Renderer] renderReactApp function called ---');
    
    // 使用 Taro 的 Current 对象安全地获取当前页面实例
    // 这比依赖 props.children 更可靠
    const pageInstance = Current.page;
    if (!pageInstance) {
      console.warn('--- ⚠️ [Renderer] Current.page is not ready yet, skipping render ---');
      return;
    }

    if (!root) {
      const container = document.getElementById('app');
      if (container) {
        root = createRoot(container);
        console.log('--- ✅ [Renderer] React Root created ---');
      } else {
        console.error('--- ❌ [Renderer] Fatal Error: Mount point #app not found! ---');
        return;
      }
    }

    // 命令 React 18 的 Root 将获取到的页面实例渲染出来
    root.render(pageInstance as any);
    console.log('--- ✅ [Renderer] root.render(Current.page) has been called ---');
  }

  // App 组件本身不再渲染任何东西，它只作为一个生命周期的“钩子”
  render() {
    return null;
  }
}

export default App