// ===== controllers/announcementController.js - 公告控制器 =====
const logger = require('../utils/logger');

// 获取公告列表
exports.getAnnouncements = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    // const type = req.query.type; // 可用于将来的类型过滤

    // 模拟公告数据
    const announcements = [
      {
        id: '1',
        title: '欢迎来到IE俱乐部！',
        content: '这是一个充满活力的社区，期待你的参与！',
        type: 'info',
        priority: 1,
        createdAt: new Date().toISOString(),
        isRead: false
      },
      {
        id: '2',
        title: '系统维护通知',
        content: '本周六凌晨2:00-4:00进行系统维护',
        type: 'warning',
        priority: 2,
        createdAt: new Date().toISOString(),
        isRead: false
      }
    ];

    res.json({
      success: true,
      data: {
        list: announcements,
        total: announcements.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取公告列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公告列表失败'
    });
  }
};

// 获取公告详情
exports.getAnnouncementDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = {
      id,
      title: '欢迎来到IE俱乐部！',
      content: '这是一个充满活力的社区，期待你的参与！详细内容...',
      type: 'info',
      priority: 1,
      createdAt: new Date().toISOString(),
      isRead: true
    };

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    logger.error('获取公告详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公告详情失败'
    });
  }
};

// 标记公告为已读
exports.markAsRead = async (req, res) => {
  try {
    // const { id } = req.params;
    // TODO: 实现标记公告为已读的逻辑

    res.json({
      success: true,
      message: '标记成功'
    });
  } catch (error) {
    logger.error('标记公告已读失败:', error);
    res.status(500).json({
      success: false,
      message: '标记公告已读失败'
    });
  }
};