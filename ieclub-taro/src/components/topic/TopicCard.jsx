/**
 * 话题卡片组件
 * 支持三种类型：我来讲(offer)、想听(demand)、项目宣传(project)
 */
import React from 'react';
import Icon from '../common/Icon.jsx';
import { TopicType } from '../../store/topicStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 话题类型配置
 */
const TopicTypeConfig = {
  [TopicType.OFFER]: {
    name: '我来讲',
    icon: 'topicOffer',
    bgGradient: 'bg-gradient-offer',
    borderColor: 'border-topic-offer',
    textColor: 'text-topic-offer',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  [TopicType.DEMAND]: {
    name: '想听',
    icon: 'topicDemand',
    bgGradient: 'bg-gradient-demand',
    borderColor: 'border-topic-demand',
    textColor: 'text-topic-demand',
    badgeClass: 'bg-pink-100 text-pink-700',
  },
  [TopicType.PROJECT]: {
    name: '项目',
    icon: 'project',
    bgGradient: 'bg-gradient-project',
    borderColor: 'border-topic-project',
    textColor: 'text-topic-project',
    badgeClass: 'bg-orange-100 text-orange-700',
  },
};

/**
 * 话题卡片组件
 * @param {object} topic - 话题数据
 * @param {function} onClick - 点击事件
 * @param {function} onLike - 点赞事件
 * @param {function} onBookmark - 收藏事件
 * @param {function} onComment - 评论事件
 */
const TopicCard = ({
  topic,
  onClick,
  onLike,
  onBookmark,
  onComment,
}) => {
  const {
    id,
    type = TopicType.OFFER,
    title,
    content,
    author,
    avatar,
    category,
    tags = [],
    likesCount = 0,
    commentsCount = 0,
    viewsCount = 0,
    bookmarksCount = 0,
    isLiked = false,
    isBookmarked = false,
    createdAt,
    // 我来讲特有字段
    availableTimes,
    format, // online/offline/hybrid
    maxParticipants,
    // 想听特有字段
    wantToHearCount, // 想听人数
    isTeamFormed, // 是否已成团
    // 项目特有字段
    projectStage, // 项目阶段
    teamSize, // 团队人数
    recruiting, // 是否招募中
  } = topic;

  const typeConfig = TopicTypeConfig[type] || TopicTypeConfig[TopicType.OFFER];

  // 格式化时间
  const formattedTime = dayjs(createdAt).fromNow();

  // 处理卡片点击
  const handleCardClick = () => {
    onClick?.(topic);
  };

  // 处理点赞
  const handleLike = (e) => {
    e.stopPropagation();
    onLike?.(id);
  };

  // 处理收藏
  const handleBookmark = (e) => {
    e.stopPropagation();
    onBookmark?.(id);
  };

  // 处理评论
  const handleComment = (e) => {
    e.stopPropagation();
    onComment?.(id);
  };

  // 渲染类型徽章
  const renderTypeBadge = () => (
    <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${typeConfig.badgeClass}`}>
      <Icon icon={typeConfig.icon} size="sm" />
      <span className="leading-none">{typeConfig.name}</span>
    </div>
  );

  // 渲染"想听"特有信息
  const renderDemandInfo = () => {
    if (type !== TopicType.DEMAND) return null;

    return (
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-sm">
          <Icon icon="users" size="sm" color="#FF6B9D" />
          <span className="text-gray-600">
            <span className="font-semibold text-topic-demand">{wantToHearCount || 0}</span>
            人想听
          </span>
        </div>
        {isTeamFormed && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
            <Icon icon="success" size="xs" />
            已成团
          </div>
        )}
        {!isTeamFormed && wantToHearCount >= 15 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-medium">
            <Icon icon="fire" size="xs" />
            即将成团
          </div>
        )}
      </div>
    );
  };

  // 渲染"我来讲"特有信息
  const renderOfferInfo = () => {
    if (type !== TopicType.OFFER) return null;

    return (
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
        {format && (
          <div className="flex items-center gap-1.5">
            <Icon icon={format === 'online' ? 'online' : 'offline'} size="sm" color="#5B7FFF" />
            <span>{format === 'online' ? '线上' : format === 'offline' ? '线下' : '混合'}</span>
          </div>
        )}
        {maxParticipants && (
          <div className="flex items-center gap-1.5">
            <Icon icon="participants" size="sm" color="#5B7FFF" />
            <span>最多{maxParticipants}人</span>
          </div>
        )}
      </div>
    );
  };

  // 渲染"项目"特有信息
  const renderProjectInfo = () => {
    if (type !== TopicType.PROJECT) return null;

    return (
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-sm">
          <Icon icon="team" size="sm" color="#FFA500" />
          <span className="text-gray-600">团队{teamSize || 0}人</span>
        </div>
        {projectStage && (
          <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {projectStage}
          </div>
        )}
        {recruiting && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
            <Icon icon="users" size="xs" />
            招募中
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className="topic-card bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group active:scale-95"
    >
      {/* 封面图区域 - IE风格渐变 */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{
        background: type === TopicType.OFFER 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : type === TopicType.DEMAND
          ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
          : 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)'
      }}>
        {/* 装饰性渐变叠加 - 增强底部对比度 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
        
        {/* 类型徽章 - 左上角 */}
        <div className="absolute z-10" style={{ top: '24rpx', left: '24rpx' }}>
          <div className={`flex-center-perfect gap-responsive-xs badge-responsive bg-white shadow-md font-bold backdrop-blur-md`} style={{ 
            borderRadius: 'var(--radius-full)',
            padding: '0 24rpx',
            height: '52rpx'
          }}>
            <div className="icon-wrapper-sm">
              <Icon icon={typeConfig.icon} size="sm" color={type === TopicType.OFFER ? '#5B7FFF' : type === TopicType.DEMAND ? '#FF6B9D' : '#FFA500'} />
            </div>
            <span className={`text-responsive-xs ${type === TopicType.OFFER ? 'text-blue-700' : type === TopicType.DEMAND ? 'text-pink-700' : 'text-orange-700'}`} style={{ lineHeight: 1 }}>{typeConfig.name}</span>
          </div>
        </div>

        {/* 收藏按钮 - 右上角 */}
        <button
          onClick={handleBookmark}
          className="touch-target absolute z-10 flex-center-perfect bg-white/90 backdrop-blur-md hover:bg-white transition-all shadow-md hover:scale-110"
          style={{
            top: '24rpx',
            right: '24rpx',
            width: '72rpx',
            height: '72rpx',
            borderRadius: 'var(--radius-full)',
            minWidth: '72rpx',
            minHeight: '72rpx'
          }}
        >
          <div className="icon-wrapper-md">
            <Icon
              icon={isBookmarked ? 'bookmarked' : 'bookmark'}
              size="sm"
              color={isBookmarked ? '#eab308' : '#64748b'}
            />
          </div>
        </button>

        {/* 内容预览区域 */}
        <div className="absolute inset-0 flex flex-col justify-end z-10" style={{ padding: '32rpx' }}>
          {/* 标题 */}
          <h3 className="text-white line-clamp-2 font-black" style={{
            fontSize: 'var(--text-2xl)',
            lineHeight: 'var(--leading-tight)',
            marginBottom: '16rpx',
            textShadow: '0 4rpx 24rpx rgba(0,0,0,0.6), 0 2rpx 6rpx rgba(0,0,0,0.8)'
          }}>
            {title}
          </h3>
          
          {/* 标签 */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-responsive-sm" style={{ marginBottom: '24rpx' }}>
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="badge-responsive-sm flex-center-perfect bg-white backdrop-blur-sm text-gray-800 font-bold shadow-lg"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '0 20rpx',
                    height: '48rpx',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 类型特有标签 - 底部 */}
          <div className="flex gap-responsive-sm">
            {type === TopicType.OFFER && format && (
              <span className="flex-center-perfect gap-responsive-xs bg-white/95 backdrop-blur-md font-bold text-gray-800 shadow-lg" style={{
                borderRadius: 'var(--radius-full)',
                padding: '0 24rpx',
                height: '56rpx',
                fontSize: 'var(--text-xs)',
                lineHeight: 1
              }}>
                <span style={{ fontSize: '24rpx', lineHeight: 1 }}>{format === 'online' ? '🌐' : '📍'}</span>
                <span>{format === 'online' ? '线上' : '线下'}</span>
              </span>
            )}
            {type === TopicType.DEMAND && wantToHearCount && (
              <span className="flex-center-perfect gap-responsive-xs bg-pink-600 backdrop-blur-md text-white font-bold shadow-lg" style={{
                borderRadius: 'var(--radius-full)',
                padding: '0 24rpx',
                height: '56rpx',
                fontSize: 'var(--text-xs)',
                lineHeight: 1
              }}>
                <span style={{ fontSize: '24rpx', lineHeight: 1 }}>👥</span>
                <span>{wantToHearCount}人想听</span>
              </span>
            )}
            {type === TopicType.PROJECT && recruiting && (
              <span className="flex-center-perfect gap-responsive-xs bg-orange-600 backdrop-blur-md text-white font-bold shadow-lg" style={{
                borderRadius: 'var(--radius-full)',
                padding: '0 24rpx',
                height: '56rpx',
                fontSize: 'var(--text-xs)',
                lineHeight: 1
              }}>
                <span style={{ fontSize: '24rpx', lineHeight: 1 }}>🔥</span>
                <span>招募中</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 卡片底部信息 */}
      <div className="bg-white" style={{ padding: '32rpx' }}>
        {/* 作者信息 */}
        <div className="flex items-center justify-between" style={{ marginBottom: '24rpx' }}>
          <div 
            className="flex-center-perfect gap-responsive-sm cursor-pointer hover:opacity-80 transition-opacity touch-target"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 跳转到用户主页
              console.log('跳转到用户主页:', author);
            }}
            style={{ minHeight: '56rpx', paddingRight: '16rpx' }}
          >
            <div className="flex-center-perfect bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold shadow-sm flex-shrink-0" style={{
              width: '56rpx',
              height: '56rpx',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              lineHeight: 1
            }}>
              {avatar || author?.charAt(0) || 'U'}
            </div>
            <span className="font-bold text-gray-900 hover:text-purple-600 transition-colors" style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 1
            }}>{author || '匿名用户'}</span>
          </div>
          <span className="font-medium text-gray-500 flex-shrink-0" style={{
            fontSize: 'var(--text-xs)',
            lineHeight: 1
          }}>{formattedTime}</span>
        </div>

        {/* 互动数据 */}
        <div className="flex items-center text-gray-700" style={{ gap: '40rpx' }}>
          {/* 点赞 */}
          <button
            onClick={handleLike}
            className="flex-center-perfect gap-responsive-xs hover:text-red-500 transition-colors group touch-target"
            style={{ minHeight: '64rpx', padding: '0 8rpx' }}
          >
            <div className="icon-wrapper-md">
              <Icon
                icon={isLiked ? 'liked' : 'like'}
                size="sm"
                color={isLiked ? '#f43f5e' : 'currentColor'}
              />
            </div>
            <span className="font-semibold" style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 1
            }}>{likesCount > 0 ? likesCount : 0}</span>
          </button>

          {/* 评论 */}
          <button
            onClick={handleComment}
            className="flex-center-perfect gap-responsive-xs hover:text-blue-500 transition-colors group touch-target"
            style={{ minHeight: '64rpx', padding: '0 8rpx' }}
          >
            <div className="icon-wrapper-md">
              <Icon icon="comment" size="sm" />
            </div>
            <span className="font-semibold" style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 1
            }}>{commentsCount > 0 ? commentsCount : 0}</span>
          </button>

          {/* 浏览 */}
          <div className="flex-center-perfect gap-responsive-xs text-gray-500" style={{ minHeight: '64rpx' }}>
            <div className="icon-wrapper-md">
              <Icon icon="view" size="sm" />
            </div>
            <span className="font-semibold" style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 1
            }}>{viewsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;

