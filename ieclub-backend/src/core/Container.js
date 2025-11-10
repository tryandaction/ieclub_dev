// ieclub-backend/src/core/Container.js
// 依赖注入容器 - 轻量级实现

const logger = require('../utils/logger');

/**
 * 依赖注入容器
 * 提供服务的注册、解析和生命周期管理
 */
class Container {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
  }

  /**
   * 注册服务
   * @param {string} name - 服务名称
   * @param {Function|Object} factory - 工厂函数或实例
   * @param {Object} options - 选项
   * @param {boolean} options.singleton - 是否单例
   * @param {Array} options.dependencies - 依赖列表
   */
  register(name, factory, options = {}) {
    const { singleton = false, dependencies = [] } = options;

    if (singleton) {
      this.singletons.set(name, null);
    }

    this.services.set(name, {
      factory,
      singleton,
      dependencies,
      resolved: false
    });

    logger.debug(`注册服务: ${name}`, { singleton, dependencies });
  }

  /**
   * 注册单例服务
   * @param {string} name - 服务名称
   * @param {Function|Object} factory - 工厂函数或实例
   * @param {Array} dependencies - 依赖列表
   */
  singleton(name, factory, dependencies = []) {
    this.register(name, factory, { singleton: true, dependencies });
  }

  /**
   * 注册工厂服务（每次调用都创建新实例）
   * @param {string} name - 服务名称
   * @param {Function} factory - 工厂函数
   * @param {Array} dependencies - 依赖列表
   */
  factory(name, factory, dependencies = []) {
    this.register(name, factory, { singleton: false, dependencies });
  }

  /**
   * 注册实例（直接注册已创建的实例）
   * @param {string} name - 服务名称
   * @param {*} instance - 实例
   */
  instance(name, instance) {
    this.singletons.set(name, instance);
    this.services.set(name, {
      factory: () => instance,
      singleton: true,
      dependencies: [],
      resolved: true
    });
  }

  /**
   * 解析服务
   * @param {string} name - 服务名称
   * @returns {*} 服务实例
   */
  resolve(name) {
    // 检查单例缓存
    if (this.singletons.has(name)) {
      const cached = this.singletons.get(name);
      if (cached !== null) {
        return cached;
      }
    }

    // 获取服务定义
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`服务未注册: ${name}`);
    }

    // 解析依赖
    const dependencies = service.dependencies.map(dep => this.resolve(dep));

    // 创建实例
    let instance;
    if (typeof service.factory === 'function') {
      instance = service.factory(...dependencies);
    } else {
      instance = service.factory;
    }

    // 缓存单例
    if (service.singleton) {
      this.singletons.set(name, instance);
      service.resolved = true;
    }

    return instance;
  }

  /**
   * 检查服务是否已注册
   * @param {string} name - 服务名称
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * 获取所有已注册的服务名称
   * @returns {Array<string>}
   */
  getRegisteredServices() {
    return Array.from(this.services.keys());
  }

  /**
   * 清除所有服务（主要用于测试）
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  /**
   * 绑定服务到函数（用于自动注入）
   * @param {Function} fn - 函数
   * @param {Array} dependencies - 依赖列表
   * @returns {Function} 绑定后的函数
   */
  bind(fn, dependencies = []) {
    return (...args) => {
      const resolvedDeps = dependencies.map(dep => this.resolve(dep));
      return fn(...resolvedDeps, ...args);
    };
  }
}

// 创建全局容器实例
const container = new Container();

module.exports = container;
module.exports.Container = Container;

