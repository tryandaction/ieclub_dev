import { Component } from 'react'
import Taro from '@tarojs/taro'
import './index.css'

/**
 * IEClub 微信小程序应用入口
 * 负责全局配置、状态管理和生命周期处理
 */
class App extends Component {
  constructor(props) {
    super(props)
    this.globalData = {
      userInfo: null,
      systemInfo: null,
      isConnected: true
    }
  }

  /**
   * 小程序启动时触发
   * @param {Object} options 启动参数
   */
  onLaunch(options) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[App] Launch with options:', options)
    }
    
    // 初始化系统信息
    this.initSystemInfo()
    
    // 初始化网络监听
    this.initNetworkListener()
    
    // 初始化全局配置
    this.initGlobalConfig()
  }

  /**
   * 获取并缓存系统信息
   */
  initSystemInfo() {
    try {
      const systemInfo = Taro.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[App] System info:', systemInfo)
      }
    } catch (error) {
      console.error('[App] Failed to get system info:', error)
    }
  }

  /**
   * 初始化网络状态监听
   */
  initNetworkListener() {
    // 监听网络状态变化
    Taro.onNetworkStatusChange((res) => {
      this.globalData.isConnected = res.isConnected
      
      if (!res.isConnected) {
        Taro.showToast({
          title: '网络连接已断开',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }

  /**
   * 初始化全局配置
   */
  initGlobalConfig() {
    // 设置全局请求拦截器
    this.setupRequestInterceptor()
    
    // 从本地存储恢复用户信息
    this.restoreUserInfo()
  }

  /**
   * 设置请求拦截器
   */
  setupRequestInterceptor() {
    Taro.addInterceptor(Taro.interceptors.logInterceptor)
  }

  /**
   * 恢复用户信息
   */
  async restoreUserInfo() {
    try {
      const userInfo = await Taro.getStorage({ key: 'userInfo' })
      if (userInfo.data) {
        this.globalData.userInfo = userInfo.data
      }
    } catch (error) {
      // 用户未登录或数据不存在
      if (process.env.NODE_ENV === 'development') {
        console.log('[App] No cached user info')
      }
    }
  }

  /**
   * 应用显示时触发
   */
  onShow(options) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[App] Show with options:', options)
    }
  }

  /**
   * 应用隐藏时触发
   */
  onHide() {
    if (process.env.NODE_ENV === 'development') {
      console.log('[App] Hide')
    }
  }

  /**
   * 组件挂载完成
   */
  componentDidMount() {
    if (process.env.NODE_ENV === 'development') {
      console.log('[App] Component mounted')
    }
  }

  /**
   * 应用显示后的回调
   */
  componentDidShow() {
    // 可以在这里刷新数据
  }

  /**
   * 应用隐藏后的回调
   */
  componentDidHide() {
    // 可以在这里保存状态
  }

  /**
   * 组件卸载前清理
   */
  componentWillUnmount() {
    // 清理监听器等
  }

  /**
   * 渲染方法
   * 小程序应用通过 this.props.children 渲染页面组件
   */
  render() {
    return this.props.children
  }
}

export default App
