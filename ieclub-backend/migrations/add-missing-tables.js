// ieclub-backend/migrations/add-missing-tables.js - 数据库迁移脚本
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建 notifications 表
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM(
          'like', 'comment', 'reply', 'follow',
          'system', 'match', 'reminder', 'hot_topic', 'new_feature'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      actorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      targetType: {
        type: Sequelize.ENUM('topic', 'comment', 'user'),
        allowNull: true
      },
      targetId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      link: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 添加索引
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['createdAt']);
    await queryInterface.addIndex('notifications', ['userId', 'isRead']);

    // 创建 bookmarks 表（如果不存在）
    await queryInterface.createTable('bookmarks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      topicId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      folderId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 添加唯一约束和索引
    await queryInterface.addConstraint('bookmarks', {
      fields: ['userId', 'topicId'],
      type: 'unique',
      name: 'unique_user_topic_bookmark'
    });
    await queryInterface.addIndex('bookmarks', ['userId']);
    await queryInterface.addIndex('bookmarks', ['topicId']);

    // 为 posts 表添加缺失的索引
    await queryInterface.addIndex('posts', ['type']);
    await queryInterface.addIndex('posts', ['status']);
    await queryInterface.addIndex('posts', ['likeCount']);
    await queryInterface.addIndex('posts', ['viewCount']);
    await queryInterface.addIndex('posts', ['commentCount']);
    await queryInterface.addIndex('posts', ['status', 'createdAt']);
    await queryInterface.addIndex('posts', ['type', 'status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('bookmarks');
  }
};