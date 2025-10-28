import { Component } from 'react'
import Taro from '@tarojs/taro'
import './index.css'

// ========== 调试代码：模块加载时打印 ==========
console.log('[IEClub] ========== app.js MODULE LOADED ==========')
console.log('[IEClub] Module loading timestamp:', Date.now())

/**
 * IEClub 小程序应用入口
 * 
 * ✅ 【标准 Taro 3.x/4.x 写法】
 * - 继承 Component 类
 * - 实现生命周期方法：onLaunch, onShow, onHide
 * - 通过 this.props.children 渲染页面
 * - export default class（不使用 createApp）
 * 
 * Taro 会自动调用 createReactApp() 处理这个类
 * 
 * 注意：类名改为 AppComponent 避免与微信小程序的全局 App() 函数冲突
 */
class AppComponent extends Component {
  /**
   * 全局数据存储
   * 可以通过 getApp().globalData 访问
   */
  globalData = {
    userInfo: null,
    systemInfo: null,
    isConnected: true
  }

  /**
   * 小程序初始化完成时触发
   * 全局只触发一次
   * 
   * @param {Object} options 启动参数
   */
  onLaunch(options) {
    console.log('[IEClub] ========== APP.ONLAUNCH START ==========')
    console.log('[IEClub] 小程序启动', options)
    
    // 调试：检查 Current.app 状态
    try {
      const Taro = require('@tarojs/taro')
      const { Current } = require('@tarojs/runtime')
      console.log('[IEClub] Current.app exists:', !!Current.app)
      console.log('[IEClub] Current.app.mount exists:', !!(Current.app && Current.app.mount))
    } catch (e) {
      console.error('[IEClub] Debug error:', e)
    }
    
    // 获取系统信息
    try {
      const systemInfo = Taro.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      console.log('[IEClub] 系统信息:', systemInfo)
    } catch (error) {
      console.error('[IEClub] 获取系统信息失败:', error)
    }

    // 检查更新
    this.checkUpdate()
    
    // 初始化网络状态监听
    this.initNetworkListener()
  }

  /**
   * 小程序启动或从后台进入前台显示时触发
   * 
   * @param {Object} options 显示参数
   */
  onShow(options) {
    console.log('[IEClub] 小程序显示', options)
  }

  /**
   * 小程序从前台进入后台时触发
   */
  onHide() {
    console.log('[IEClub] 小程序隐藏')
  }

  /**
   * 检查小程序更新
   * 仅在微信 7.0.0 及以上版本可用
   */
  checkUpdate() {
    if (Taro.canIUse('getUpdateManager')) {
      const updateManager = Taro.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('[IEClub] 发现新版本')
          
          updateManager.onUpdateReady(() => {
            Taro.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })

          updateManager.onUpdateFailed(() => {
            console.error('[IEClub] 新版本下载失败')
            Taro.showToast({
              title: '更新失败，请检查网络',
              icon: 'none'
            })
          })
        } else {
          console.log('[IEClub] 当前已是最新版本')
        }
      })
    }
  }

  /**
   * 初始化网络状态监听
   * 监听网络状态变化，更新全局状态
   */
  initNetworkListener() {
    // 获取当前网络状态
    Taro.getNetworkType({
      success: (res) => {
        this.globalData.isConnected = res.networkType !== 'none'
        console.log('[IEClub] 当前网络状态:', res.networkType)
      }
    })

    // 监听网络状态变化
    Taro.onNetworkStatusChange((res) => {
      this.globalData.isConnected = res.isConnected
      console.log('[IEClub] 网络状态变化:', res)
      
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
   * 渲染方法
   * 
   * ✅ 【关键】通过 this.props.children 渲染当前页面
   * Taro 会自动将路由对应的页面组件作为 children 传入
   */
  render() {
    return this.props.children
  }
}

/**
 * ✅ 【标准导出方式】
 * export default class，不使用 createApp
 * 
 * Taro 运行时会自动调用 @tarojs/plugin-framework-react 中的
 * createReactApp(App) 来初始化应用
 */

// ========== 调试代码：导出前打印 ==========
console.log('[IEClub] ========== EXPORTING APP CLASS ==========')
console.log('[IEClub] AppComponent class:', AppComponent)
console.log('[IEClub] AppComponent.prototype:', AppComponent.prototype)

export default AppComponent
