/**
 * IEClub TopicCard 组件
 * 小红书风格卡片设计 - 简洁美观
 */
import React from 'react'
import { TOPIC_TYPES } from '../../constants'

const TopicCard = ({ 
  topic, 
  onClick,
  onLike,
  onFavorite,
  onJoin,
  className = '' 
}) => {
  const {
    id,
    type,
    title,
    content,
    author,
    authorAvatar,
    tags = [],
    likesCount = 0,
    commentsCount = 0,
    viewsCount = 0,
    coverImage,
    isLiked = false,
    isFavorited = false,
    isJoined = false
  } = topic
  
  // 根据类型获取样式
  const getTypeConfig = (type) => {
    switch (type) {
      case TOPIC_TYPES.OFFER:
        return { emoji: '🎤', label: '我来讲', gradient: 'from-blue-500 via-blue-600 to-cyan-500' }
      case TOPIC_TYPES.DEMAND:
        return { emoji: '👂', label: '想听', gradient: 'from-pink-500 via-pink-600 to-rose-500' }
      case TOPIC_TYPES.PROJECT:
        return { emoji: '🚀', label: '项目', gradient: 'from-purple-500 via-purple-600 to-indigo-500' }
      default:
        return { emoji: '📌', label: '话题', gradient: 'from-gray-500 to-gray-600' }
    }
  }
  
  const typeConfig = getTypeConfig(type)
  
  // 处理点击
  const handleClick = () => {
    onClick?.(topic)
  }
  
  const handleLike = (e) => {
    e.stopPropagation()
    onLike?.(topic.id, !isLiked)
  }
  
  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group ${className}`}
      onClick={handleClick}
    >
      {/* 封面区域 */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {coverImage ? (
          <>
            <img 
              src={coverImage} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center`}>
            <span className="text-7xl opacity-25 group-hover:scale-125 transition-transform duration-500">{typeConfig.emoji}</span>
          </div>
        )}
        
        {/* 类型标签 */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${typeConfig.gradient} shadow-lg backdrop-blur-sm`}>
            {typeConfig.emoji} {typeConfig.label}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-3.5">
        {/* 标题 */}
        <h3 className="text-[15px] font-bold text-gray-900 mb-2.5 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors">
          {title}
        </h3>

        {/* 作者信息 */}
        <div className="flex items-center mb-3">
          <div className={`w-5 h-5 bg-gradient-to-br ${typeConfig.gradient} rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm`}>
            {authorAvatar || author?.charAt(0) || 'U'}
          </div>
          <span className="ml-1.5 text-xs text-gray-600 font-medium">{author}</span>
        </div>

        {/* 标签（仅显示第一个） */}
        {tags.length > 0 && (
          <div className="mb-3">
            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] rounded-lg font-medium">
              #{tags[0]}
            </span>
          </div>
        )}

        {/* 底部统计 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span className="font-medium">{likesCount}</span>
            </button>
            <span className="flex items-center space-x-1">
              <span>💬</span>
              <span className="font-medium">{commentsCount}</span>
            </span>
          </div>
          {viewsCount > 0 && (
            <span className="flex items-center space-x-1 text-gray-400">
              <span>👁️</span>
              <span>{viewsCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopicCard
