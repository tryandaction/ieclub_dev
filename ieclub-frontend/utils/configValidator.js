/**
 * 小程序配置验证工具
 * 确保 API 配置正确，防止常见错误
 */

/**
 * 验证 API 配置
 */
function validateApiConfig() {
  try {
    // 尝试获取全局配置（需要等待 App 初始化完成）
    const app = getApp()
    const errors = []
    const warnings = []

    // App 可能还未完全初始化
    if (!app) {
      warnings.push('App 实例尚未初始化，稍后会自动配置')
      return { valid: true, errors, warnings }
    }

    if (!app.globalData) {
      warnings.push('全局配置数据尚未初始化')
      return { valid: true, errors, warnings }
    }

    const apiBase = app.globalData.apiBase

    // 检查 API 地址是否配置
    if (!apiBase) {
      warnings.push('API 地址未配置，请检查 app.js 中的 globalData.apiBase')
      return { valid: true, errors, warnings }
    }

    // 检查是否使用 HTTPS
    if (!apiBase.startsWith('https://')) {
      errors.push('小程序必须使用 HTTPS 协议')
    }

    // 检查是否是正确的域名
    const hasValidDomain = apiBase.includes('ieclub.online') || 
                           apiBase.includes('localhost') || 
                           apiBase.includes('127.0.0.1')
    
    if (!hasValidDomain) {
      warnings.push('API 地址可能不正确，请确认域名')
    }

    // 检查是否以 /api 结尾
    if (!apiBase.endsWith('/api')) {
      warnings.push('API 地址应该以 /api 结尾')
    }

    console.log('📋 API 配置检查:', {
      apiBase,
      valid: errors.length === 0,
      errors,
      warnings
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  } catch (error) {
    console.error('配置验证过程出错:', error)
    return {
      valid: true, // 验证失败时不阻止启动
      errors: [],
      warnings: ['配置验证过程出错，但不影响运行']
    }
  }
}

/**
 * 验证小程序配置
 */
function validateMiniProgramConfig() {
  const errors = []
  const warnings = []

  // 检查必需的 API
  const requiredAPIs = [
    { name: 'wx.request', api: wx.request },
    { name: 'wx.getStorageSync', api: wx.getStorageSync },
    { name: 'wx.setStorageSync', api: wx.setStorageSync },
    { name: 'wx.showToast', api: wx.showToast }
  ]

  requiredAPIs.forEach(({ name, api }) => {
    if (!api) {
      errors.push(`缺少必需的 API: ${name}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 运行所有验证
 */
function validateAll() {
  try {
    console.log('🔍 开始配置验证...')

    const apiResult = validateApiConfig()
    const mpResult = validateMiniProgramConfig()

    const allErrors = [...apiResult.errors, ...mpResult.errors]
    const allWarnings = [...apiResult.warnings, ...mpResult.warnings]

    if (allErrors.length > 0) {
      console.error('❌ 配置验证失败:')
      allErrors.forEach(error => console.error(`  - ${error}`))
    }

    if (allWarnings.length > 0) {
      console.warn('⚠️ 配置警告:')
      allWarnings.forEach(warning => console.warn(`  - ${warning}`))
    }

    if (allErrors.length === 0 && allWarnings.length === 0) {
      console.log('✅ 配置验证通过')
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  } catch (error) {
    console.error('配置验证过程出错:', error)
    return {
      valid: true, // 验证失败时不阻止启动
      errors: [],
      warnings: ['配置验证过程出错，但不影响运行']
    }
  }
}

module.exports = {
  validateApiConfig,
  validateMiniProgramConfig,
  validateAll
}

