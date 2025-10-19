// ieclub-backend/src/models/Bookmark.js - 书签模型
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bookmark = sequelize.define('Bookmark', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    topicId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    folderId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '收藏夹ID（可选功能）'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '收藏备注'
    }
  }, {
    tableName: 'bookmarks',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'topicId']
      },
      { fields: ['userId'] },
      { fields: ['topicId'] }
    ]
  });

  Bookmark.associate = (models) => {
    Bookmark.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Bookmark.belongsTo(models.Post, {
      foreignKey: 'topicId',
      as: 'topic'
    });
  };

  return Bookmark;
};