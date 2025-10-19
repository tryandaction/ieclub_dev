// ieclub-backend/src/models/Notification.js - 通知模型
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '接收通知的用户ID'
    },
    type: {
      type: DataTypes.ENUM(
        'like',        // 点赞
        'comment',     // 评论
        'reply',       // 回复
        'follow',      // 关注
        'system',      // 系统通知
        'match',       // 匹配推荐
        'reminder',    // 提醒
        'hot_topic',   // 热门话题
        'new_feature'  // 新功能
      ),
      allowNull: false,
      comment: '通知类型'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '通知标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '通知内容'
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '触发通知的用户ID'
    },
    targetType: {
      type: DataTypes.ENUM('topic', 'comment', 'user'),
      allowNull: true,
      comment: '关联对象类型'
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联对象ID'
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '跳转链接'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已读'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '已读时间'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isRead'] },
      { fields: ['type'] },
      { fields: ['createdAt'] },
      { fields: ['userId', 'isRead'] }
    ]
  });

  Notification.associate = (models) => {
    // 接收者
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // 触发者
    Notification.belongsTo(models.User, {
      foreignKey: 'actorId',
      as: 'actor'
    });
  };

  return Notification;
};