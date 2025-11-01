// src/controllers/errorReportController.js
// 前端错误报告控制器
const logger = require('../utils/logger');
const response = require('../utils/response');

class ErrorReportController {
  /**
   * 接收前端错误报告
   * POST /api/errors/report
   */
  static async reportError(req, res) {
    try {
      const { 
        message, 
        stack, 
        componentStack,
        errorInfo,
        userAgent,
        url,
        timestamp 
      } = req.body;

      // 记录前端错误到日志系统
      logger.error('前端错误报告:', {
        message,
        stack,
        componentStack,
        errorInfo,
        userAgent: userAgent || req.headers['user-agent'],
        url: url || req.headers.referer,
        timestamp: timestamp || new Date().toISOString(),
        userId: req.user?.id, // 如果用户已登录
        ip: req.ip
      });

      // 在生产环境可以考虑将错误存储到数据库或发送到错误追踪服务
      // 例如: Sentry, Bugsnag, 或自己的错误数据库表

      return response.success(res, null, '错误报告已记录');
    } catch (error) {
      logger.error('处理前端错误报告时出错:', error);
      // 即使处理出错也返回成功，避免影响前端
      return response.success(res, null, '错误报告已接收');
    }
  }

  /**
   * 获取错误统计（仅管理员）
   * GET /api/errors/stats
   */
  static async getErrorStats(req, res) {
    try {
      // TODO: 从数据库或日志分析系统获取错误统计
      // 目前返回模拟数据
      const stats = {
        total: 0,
        last24Hours: 0,
        topErrors: []
      };

      return response.success(res, stats, '错误统计获取成功');
    } catch (error) {
      logger.error('获取错误统计失败:', error);
      return response.serverError(res, '获取错误统计失败');
    }
  }
}

module.exports = ErrorReportController;

