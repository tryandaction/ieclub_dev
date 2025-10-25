import { Component, PropsWithChildren, ReactNode } from 'react'
import './app.scss'

// 标准的 Taro React 应用入口组件。
// 在 H5 和小程序环境中，Taro 会负责把 children 挂载到页面容器上。
class App extends Component<PropsWithChildren> {
  // 只需将子节点（页面）返回，交由 Taro 管理挂载。
  render(): ReactNode {
    return this.props.children || null
  }
}

export default App