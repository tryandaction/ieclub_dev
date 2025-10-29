/**
 * IEClub TopicCard 组件
 * 小红书风格卡片设计 - Taro版本（支持小程序）
 */
import React from 'react'
import { View, Text, Image } from '@tarojs/components'
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
    <View 
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group ${className}`}
      onClick={handleClick}
    >
      {/* 封面区域 */}
      <View className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {coverImage ? (
          <>
            <Image 
              src={coverImage} 
              alt={title}
              mode="aspectFill"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <View className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <View className={`w-full h-full bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center`}>
            <Text className="text-7xl opacity-25 group-hover:scale-125 transition-transform duration-500">{typeConfig.emoji}</Text>
          </View>
        )}
        
        {/* 类型标签 */}
        <View className="absolute top-2.5 left-2.5">
          <View className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${typeConfig.gradient} shadow-lg backdrop-blur-sm`}>
            <Text className="text-white text-xs font-bold">{typeConfig.emoji} {typeConfig.label}</Text>
          </View>
        </View>
      </View>

      {/* 内容区域 */}
      <View className="p-3.5">
        {/* 标题 */}
        <Text className="text-[15px] font-bold text-gray-900 mb-2.5 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors block">
          {title}
        </Text>

        {/* 作者信息 */}
        <View className="flex items-center mb-3">
          <View className={`w-5 h-5 bg-gradient-to-br ${typeConfig.gradient} rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm mr-2`}>
            <Text className="text-white text-xs">{authorAvatar || author?.charAt(0) || 'U'}</Text>
          </View>
          <Text className="text-[11px] text-gray-600 font-medium flex-1">{author || '匿名用户'}</Text>
        </View>

        {/* 标签 */}
        {tags.length > 0 && (
          <View className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 2).map((tag, index) => (
              <View key={index} className="px-2 py-0.5 bg-gray-50 rounded-md">
                <Text className="text-[10px] text-gray-600">#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 底部互动栏 */}
        <View className="flex items-center justify-between pt-2.5 border-t border-gray-50">
          <View className="flex items-center space-x-3 text-[11px] text-gray-500">
            <View className="flex items-center">
              <Text className="mr-1">👁️</Text>
              <Text className="text-xs text-gray-500">{viewsCount}</Text>
            </View>
            <View className="flex items-center">
              <Text className="mr-1">💬</Text>
              <Text className="text-xs text-gray-500">{commentsCount}</Text>
            </View>
          </View>

          <View className="flex items-center space-x-2">
            <View onClick={handleLike}>
              <Text className={`text-lg ${isLiked ? 'text-red-500' : 'text-gray-400'}`}>
                {isLiked ? '❤️' : '🤍'}
              </Text>
            </View>
            <View onClick={(e) => { e.stopPropagation(); onFavorite?.(id, !isFavorited) }}>
              <Text className={`text-lg ${isFavorited ? 'text-yellow-500' : 'text-gray-400'}`}>
                {isFavorited ? '⭐' : '☆'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default TopicCard
