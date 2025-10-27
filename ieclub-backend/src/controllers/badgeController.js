// ===== controllers/badgeController.js - 徽章控制器 =====
const badgeService = require('../services/badgeService');

class BadgeController {
  /**
   * 获取所有徽章类型
   */
  async getAllBadges(req, res) {
    try {
      const badges = badgeService.getAllBadgeTypes();
      
      res.json({
        success: true,
        data: badges
      });
    } catch (error) {
      console.error('获取徽章列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取徽章列表失败'
      });
    }
  }

  /**
   * 获取用户徽章
   */
  async getUserBadges(req, res) {
    try {
      const { userId } = req.params;
      
      const badges = await badgeService.getUserBadges(userId);
      
      res.json({
        success: true,
        data: badges
      });
    } catch (error) {
      console.error('获取用户徽章失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户徽章失败'
      });
    }
  }

  /**
   * 获取积分规则
   */
  async getPointsRules(req, res) {
    try {
      const rules = badgeService.getPointsRules();
      
      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('获取积分规则失败:', error);
      res.status(500).json({
        success: false,
        message: '获取积分规则失败'
      });
    }
  }

  /**
   * 手动触发徽章检查（管理员功能）
   */
  async checkUserBadges(req, res) {
    try {
      const { userId } = req.params;
      
      const newBadges = await badgeService.checkAndAwardBadges(userId);
      
      res.json({
        success: true,
        message: `检查完成，获得${newBadges.length}个新徽章`,
        data: newBadges
      });
    } catch (error) {
      console.error('检查徽章失败:', error);
      res.status(500).json({
        success: false,
        message: '检查徽章失败'
      });
    }
  }
}

module.exports = new BadgeController();

