// ===== controllers/statsController.js - 统计控制器 =====
const statsService = require('../services/statsService');

class StatsController {
  /**
   * 获取用户统计数据
   */
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      
      const stats = await statsService.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取用户统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    }
  }

  /**
   * 获取用户活跃度
   */
  async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;
      
      const activity = await statsService.calculateUserActivity(userId, parseInt(days));
      
      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('获取用户活跃度失败:', error);
      res.status(500).json({
        success: false,
        message: '获取活跃度失败'
      });
    }
  }

  /**
   * 获取用户影响力
   */
  async getUserInfluence(req, res) {
    try {
      const { userId } = req.params;
      
      const influence = await statsService.calculateUserInfluence(userId);
      
      res.json({
        success: true,
        data: { influence }
      });
    } catch (error) {
      console.error('获取用户影响力失败:', error);
      res.status(500).json({
        success: false,
        message: '获取影响力失败'
      });
    }
  }

  /**
   * 获取平台统计
   */
  async getPlatformStats(req, res) {
    try {
      const stats = await statsService.getPlatformStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取平台统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    }
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const tags = await statsService.getPopularTags(parseInt(limit));
      
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('获取热门标签失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门标签失败'
      });
    }
  }

  /**
   * 获取用户成长趋势
   */
  async getUserGrowthTrend(req, res) {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;
      
      const trend = await statsService.getUserGrowthTrend(userId, parseInt(days));
      
      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      console.error('获取成长趋势失败:', error);
      res.status(500).json({
        success: false,
        message: '获取成长趋势失败'
      });
    }
  }
}

module.exports = new StatsController();

