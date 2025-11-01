/**
 * 配置验证工具
 * 确保所有必需的配置项都已正确设置
 */

class ConfigValidator {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  /**
   * 验证 API 配置
   */
  validateApiConfig() {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    const mode = import.meta.env.MODE

    // 检查 API URL 格式
    if (apiBaseUrl) {
      // 生产环境必须使用 HTTPS
      if (mode === 'production' && !apiBaseUrl.startsWith('https://')) {
        this.errors.push('生产环境必须使用 HTTPS 协议')
      }

      // 检查是否包含 www（常见错误）
      if (apiBaseUrl.includes('www.ieclub.online')) {
        this.errors.push('API 地址不应包含 www 前缀，应使用 ieclub.online')
      }

      // 检查 URL 格式
      try {
        new URL(apiBaseUrl)
      } catch (e) {
        this.errors.push(`API URL 格式错误: ${apiBaseUrl}`)
      }
    } else if (mode === 'production') {
      this.errors.push('生产环境必须配置 VITE_API_BASE_URL')
    }

    return this
  }

  /**
   * 验证环境变量
   */
  validateEnvironment() {
    const mode = import.meta.env.MODE
    const validModes = ['development', 'production', 'test']

    if (!validModes.includes(mode)) {
      this.warnings.push(`未知的运行模式: ${mode}`)
    }

    // 开发环境警告
    if (mode === 'development') {
      console.log('🔧 运行在开发模式')
    }

    // 生产环境检查
    if (mode === 'production') {
      console.log('🚀 运行在生产模式')
      
      // 生产环境不应该有调试标志
      if (import.meta.env.VITE_DEBUG === 'true') {
        this.warnings.push('生产环境不应启用调试模式')
      }
    }

    return this
  }

  /**
   * 验证浏览器兼容性
   */
  validateBrowser() {
    // 检查必需的浏览器 API
    const requiredAPIs = [
      { name: 'localStorage', check: () => typeof localStorage !== 'undefined' },
      { name: 'fetch', check: () => typeof fetch !== 'undefined' },
      { name: 'Promise', check: () => typeof Promise !== 'undefined' },
      { name: 'WebSocket', check: () => typeof WebSocket !== 'undefined' }
    ]

    requiredAPIs.forEach(api => {
      if (!api.check()) {
        this.errors.push(`浏览器不支持 ${api.name} API`)
      }
    })

    return this
  }

  /**
   * 验证本地存储
   */
  validateStorage() {
    try {
      const testKey = '__config_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
    } catch (e) {
      this.errors.push('无法访问 localStorage，可能是隐私模式')
    }

    return this
  }

  /**
   * 获取验证结果
   */
  getResults() {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  /**
   * 打印验证结果
   */
  printResults() {
    const results = this.getResults()

    if (results.errors.length > 0) {
      console.error('❌ 配置验证失败:')
      results.errors.forEach(error => console.error(`  - ${error}`))
    }

    if (results.warnings.length > 0) {
      console.warn('⚠️ 配置警告:')
      results.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }

    if (results.valid && results.warnings.length === 0) {
      console.log('✅ 配置验证通过')
    }

    return results
  }

  /**
   * 运行所有验证
   */
  validateAll() {
    return this
      .validateApiConfig()
      .validateEnvironment()
      .validateBrowser()
      .validateStorage()
      .printResults()
  }
}

/**
 * 导出单例
 */
export const configValidator = new ConfigValidator()

/**
 * 快速验证函数
 */
export function validateConfig() {
  return configValidator.validateAll()
}

/**
 * 获取当前配置信息（用于调试）
 */
export function getConfigInfo() {
  return {
    mode: import.meta.env.MODE,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    appEnv: import.meta.env.VITE_APP_ENV,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    // 不要暴露敏感信息
  }
}

export default configValidator

