import { Component, PropsWithChildren } from 'react'
import './app.scss'

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    console.log('App component mounted')
  }

  render() {
    console.log('App render called with children:', this.props.children)
    // Taro 会自动处理页面渲染，这里只需要返回 children
    return this.props.children
  }
}

export default App