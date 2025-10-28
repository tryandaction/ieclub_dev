import { Component } from 'react'
import './index.css'

/**
 * IEClub 小程序入口
 * 最简化版本 - 确保基础功能正常
 */
class App extends Component {
  
  render() {
    return this.props.children
  }
}

export default App
