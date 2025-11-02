/**
 * 🏥 后端健康检查工具
 * 用于检测后端服务是否正常运行
 */

import request from './request'

class HealthChecker {
  constructor() {
    this.lastCheckTime = null
    this.lastStatus = null
    this.checkInterval = null
  }

  /**
   * 检查后端健康状态
   * @returns {Promise<Object>} 健康状态信息
   */
  async check() {
    try {
      console.log('🏥 [HealthCheck] 开始检查后端服务...')
      
      const startTime = Date.now()
      const response = await request.get('/health', {
        loading: false,
        retry: 0, // 健康检查不重试
        timeout: 5000 // 5秒超时
      })
      
      const duration = Date.now() - startTime
      
      this.lastCheckTime = new Date()
      this.lastStatus = {
        healthy: true,
        responseTime: duration,
        timestamp: this.lastCheckTime,
        data: response
      }
      
      console.log(`✅ [HealthCheck] 后端服务正常 (${duration}ms)`, response)
      return this.lastStatus
    } catch (error) {
      console.error('❌ [HealthCheck] 后端服务异常:', error.message)
      
      this.lastCheckTime = new Date()
      this.lastStatus = {
        healthy: false,
        error: error.message,
        code: error.code,
        timestamp: this.lastCheckTime
      }
      
      return this.lastStatus
    }
  }

  /**
   * 检查数据库连接
   */
  async checkDatabase() {
    try {
      console.log('🗄️ [HealthCheck] 检查数据库连接...')
      
      // 尝试获取活动列表（简单查询）
      await request.get('/activities', {
        loading: false,
        retry: 0,
        timeout: 5000,
        params: { page: 1, limit: 1 }
      })
      
      console.log('✅ [HealthCheck] 数据库连接正常')
      return { healthy: true, message: '数据库连接正常' }
    } catch (error) {
      console.error('❌ [HealthCheck] 数据库连接异常:', error.message)
      return { healthy: false, error: error.message }
    }
  }

  /**
   * 全面健康检查
   */
  async fullCheck() {
    console.log('🔍 [HealthCheck] 开始全面健康检查...')
    
    const results = {
      timestamp: new Date(),
      checks: {}
    }

    // 1. 检查后端服务
    results.checks.backend = await this.check()

    // 2. 检查数据库
    results.checks.database = await this.checkDatabase()

    // 3. 整体状态
    results.healthy = Object.values(results.checks).every(check => check.healthy)

    if (results.healthy) {
      console.log('✅ [HealthCheck] 全面检查通过')
    } else {
      console.error('❌ [HealthCheck] 发现问题:', results)
    }

    return results
  }

  /**
   * 启动定期检查
   * @param {number} interval - 检查间隔（毫秒）
   */
  startPeriodicCheck(interval = 60000) {
    if (this.checkInterval) {
      console.warn('⚠️ [HealthCheck] 定期检查已在运行')
      return
    }

    console.log(`🔄 [HealthCheck] 启动定期检查 (间隔: ${interval / 1000}秒)`)
    
    // 立即执行一次
    this.check()

    // 定期执行
    this.checkInterval = setInterval(() => {
      this.check()
    }, interval)
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('🛑 [HealthCheck] 已停止定期检查')
    }
  }

  /**
   * 获取最后检查状态
   */
  getLastStatus() {
    return this.lastStatus
  }
}

// 创建单例
const healthChecker = new HealthChecker()

export default healthChecker

// 导出便捷方法
export const checkHealth = () => healthChecker.check()
export const checkDatabase = () => healthChecker.checkDatabase()
export const fullHealthCheck = () => healthChecker.fullCheck()

