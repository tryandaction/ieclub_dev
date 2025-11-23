/**
 * 小程序 Mixin 工具
 * 用于合并多个对象到 Page 或 Component 配置中
 * 
 * @usage
 * import { mixinPage } from '../../utils/mixin'
 * import paginationMixin from '../../mixins/paginationMixin'
 * 
 * mixinPage({
 *   mixins: [paginationMixin],
 *   data: {
 *     // 页面数据
 *   },
 *   onLoad() {
 *     // 页面逻辑
 *   }
 * })
 */

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        result[key] = deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  
  return result
}

/**
 * 合并生命周期方法
 */
function mergeLifecycle(target, source, lifecycleName) {
  const targetFn = target[lifecycleName]
  const sourceFn = source[lifecycleName]
  
  if (!sourceFn) {
    return targetFn
  }
  
  if (!targetFn) {
    return sourceFn
  }
  
  // 返回一个新函数，依次调用 mixin 和页面的方法
  return function(...args) {
    sourceFn.apply(this, args)
    return targetFn.apply(this, args)
  }
}

/**
 * 合并普通方法
 */
function mergeMethods(target, source) {
  const result = { ...target }
  
  // 处理嵌套的methods对象（用于mixin）
  if (source.methods) {
    for (const key in source.methods) {
      if (source.methods.hasOwnProperty(key)) {
        // 页面方法优先级更高
        if (!result[key]) {
          result[key] = source.methods[key]
        }
      }
    }
  }
  
  // 处理直接定义的方法
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'function' && key !== 'data' && key !== 'methods') {
        // 页面方法优先级更高
        if (!result[key]) {
          result[key] = source[key]
        }
      }
    }
  }
  
  return result
}

/**
 * Page Mixin
 */
function mixinPage(options) {
  const mixins = options.mixins || []
  delete options.mixins
  
  let mergedOptions = { ...options }
  
  // 依次合并每个 mixin
  mixins.forEach(mixin => {
    // 合并 data
    if (mixin.data) {
      mergedOptions.data = deepMerge(mixin.data, mergedOptions.data || {})
    }
    
    // 合并生命周期方法
    const lifecycles = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onPullDownRefresh', 'onReachBottom']
    lifecycles.forEach(lifecycle => {
      mergedOptions[lifecycle] = mergeLifecycle(mergedOptions, mixin, lifecycle)
    })
    
    // 合并普通方法
    mergedOptions = mergeMethods(mergedOptions, mixin)
  })
  
  return Page(mergedOptions)
}

/**
 * Component Mixin
 */
function mixinComponent(options) {
  const mixins = options.mixins || []
  delete options.mixins
  
  let mergedOptions = { ...options }
  
  // 依次合并每个 mixin
  mixins.forEach(mixin => {
    // 合并 data
    if (mixin.data) {
      if (!mergedOptions.data) {
        mergedOptions.data = {}
      }
      mergedOptions.data = deepMerge(mixin.data, mergedOptions.data)
    }
    
    // 合并 methods
    if (mixin.methods) {
      if (!mergedOptions.methods) {
        mergedOptions.methods = {}
      }
      mergedOptions.methods = { ...mixin.methods, ...mergedOptions.methods }
    }
    
    // 合并生命周期
    if (mixin.lifetimes) {
      if (!mergedOptions.lifetimes) {
        mergedOptions.lifetimes = {}
      }
      const lifecycles = ['created', 'attached', 'ready', 'moved', 'detached']
      lifecycles.forEach(lifecycle => {
        if (mixin.lifetimes[lifecycle]) {
          mergedOptions.lifetimes[lifecycle] = mergeLifecycle(
            mergedOptions.lifetimes,
            mixin.lifetimes,
            lifecycle
          )
        }
      })
    }
  })
  
  return Component(mergedOptions)
}

module.exports = {
  mixinPage,
  mixinComponent,
  deepMerge
}

