/**
 * IEClub TopicCard 组件
 * 话题卡片组件，支持三种类型：我来讲、想听、项目
 */
import React from 'react'
import Card from '../common/Card'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { TOPIC_TYPES, ICONS } from '../../constants'
import { formatRelativeTime, formatNumber } from '../../utils'

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
    category,
    tags = [],
    likesCount = 0,
    commentsCount = 0,
    viewsCount = 0,
    participantsCount = 0,
    maxParticipants = 0,
    createdAt,
    isLiked = false,
    isFavorited = false,
    isJoined = false
  } = topic
  
  // 根据类型获取样式和图标
  const getTypeConfig = (type) => {
    switch (type) {
      case TOPIC_TYPES.OFFER:
        return {
          icon: ICONS.topicOffer,
          label: '我来讲',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case TOPIC_TYPES.DEMAND:
        return {
          icon: ICONS.topicDemand,
          label: '想听',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          borderColor: 'border-pink-200'
        }
      case TOPIC_TYPES.PROJECT:
        return {
          icon: ICONS.project,
          label: '项目',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      default:
        return {
          icon: ICONS.topicOffer,
          label: '话题',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }
  
  const typeConfig = getTypeConfig(type)
  
  // 处理点击事件
  const handleClick = () => {
    onClick?.(topic)
  }
  
  // 处理点赞
  const handleLike = (e) => {
    e.stopPropagation()
    onLike?.(topic.id, !isLiked)
  }
  
  // 处理收藏
  const handleFavorite = (e) => {
    e.stopPropagation()
    onFavorite?.(topic.id, !isFavorited)
  }
  
  // 处理加入/申请
  const handleJoin = (e) => {
    e.stopPropagation()
    onJoin?.(topic.id, !isJoined)
  }
  
  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 ${className}`}
      onClick={handleClick}
    >
      {/* 头部：类型标签 */}
      <div className="flex items-center justify-between mb-3">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
          <Icon icon={typeConfig.icon} size="sm" className="mr-1" />
          {typeConfig.label}
        </div>
        <span className="text-sm text-gray-500">
          {formatRelativeTime(createdAt)}
        </span>
      </div>
      
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {title}
      </h3>
      
      {/* 内容预览 */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
        {content}
      </p>
      
      {/* 作者信息 */}
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
          {authorAvatar || author?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{author}</p>
          <p className="text-xs text-gray-500">{category}</p>
        </div>
      </div>
      
      {/* 标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Icon icon={ICONS.view} size="sm" className="mr-1" />
            {formatNumber(viewsCount)}
          </span>
          <span className="flex items-center">
            <Icon icon={ICONS.comment} size="sm" className="mr-1" />
            {formatNumber(commentsCount)}
          </span>
          {type === TOPIC_TYPES.DEMAND && (
            <span className="flex items-center">
              <Icon icon={ICONS.participants} size="sm" className="mr-1" />
              {participantsCount}/{maxParticipants || 15}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Icon 
              icon={isLiked ? ICONS.liked : ICONS.like} 
              size="sm" 
              className="mr-1" 
            />
            {formatNumber(likesCount)}
          </button>
          
          <button
            onClick={handleFavorite}
            className={`${isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
          >
            <Icon 
              icon={isFavorited ? ICONS.bookmarked : ICONS.bookmark} 
              size="sm" 
            />
          </button>
        </div>
      </div>
      
      {/* 操作按钮 */}
      {type === TOPIC_TYPES.DEMAND && (
        <Button
          variant={isJoined ? 'secondary' : 'primary'}
          size="sm"
          className="w-full"
          onClick={handleJoin}
        >
          {isJoined ? '已申请' : '申请加入'}
        </Button>
      )}
      
      {type === TOPIC_TYPES.PROJECT && (
        <Button
          variant={isJoined ? 'secondary' : 'primary'}
          size="sm"
          className="w-full"
          onClick={handleJoin}
        >
          {isJoined ? '已加入' : '加入项目'}
        </Button>
      )}
    </Card>
  )
}

export default TopicCard
