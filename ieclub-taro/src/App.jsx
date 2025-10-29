/**
 * IEClub Taro 应用入口
 * 支持小程序和H5多端运行
 */
import { Component } from 'react'
import './index.css'
import './app.scss'

class App extends Component {
  componentDidMount() {
    // 仅在开发环境输出日志
    if (process.env.NODE_ENV === 'development') {
      console.log('IEClub 应用启动成功！')
    }
  }

  componentDidShow() {}

  componentDidHide() {}

  // this.props.children 是将要被渲染的页面
  render() {
    return this.props.children
  }
}

export default App