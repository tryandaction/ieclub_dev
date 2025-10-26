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
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${typeConfig.badgeClass}`}>
      <Icon icon={typeConfig.icon} size="sm" />
      <span>{typeConfig.name}</span>
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
      {/* 封面图区域 - 小红书风格 */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{
        background: type === TopicType.OFFER 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : type === TopicType.DEMAND
          ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
          : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      }}>
        {/* 装饰性渐变叠加 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
        
        {/* 类型徽章 - 左上角 */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${typeConfig.badgeClass} shadow-sm`}>
            <Icon icon={typeConfig.icon} size="sm" />
            <span>{typeConfig.name}</span>
          </div>
        </div>

        {/* 收藏按钮 - 右上角 */}
        <button
          onClick={handleBookmark}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm"
        >
          <Icon
            icon={isBookmarked ? 'bookmarked' : 'bookmark'}
            size="sm"
            color={isBookmarked ? '#eab308' : '#64748b'}
          />
        </button>

        {/* 内容预览区域 */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
          {/* 标题 */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2" style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            {title}
          </h3>
          
          {/* 标签 */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 bg-white/95 backdrop-blur-sm text-gray-800 rounded-full text-xs font-medium shadow-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 类型特有标签 - 底部左侧 */}
        <div className="absolute bottom-3 left-3 z-10 flex gap-2 text-xs">
          {type === TopicType.OFFER && format && (
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full font-medium text-gray-700 shadow-sm">
              {format === 'online' ? '🌐 线上' : '📍 线下'}
            </span>
          )}
          {type === TopicType.DEMAND && wantToHearCount && (
            <span className="px-2 py-1 bg-pink-500/90 backdrop-blur-sm text-white rounded-full font-medium shadow-sm">
              👥 {wantToHearCount}人想听
            </span>
          )}
          {type === TopicType.PROJECT && recruiting && (
            <span className="px-2 py-1 bg-orange-500/90 backdrop-blur-sm text-white rounded-full font-medium shadow-sm">
              🔥 招募中
            </span>
          )}
        </div>
      </div>

      {/* 卡片底部信息 */}
      <div className="p-3">
        {/* 作者信息 */}
        <div className="flex items-center justify-between mb-2">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 跳转到用户主页
              console.log('跳转到用户主页:', author);
            }}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold">
              {avatar || author?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">{author || '匿名用户'}</span>
          </div>
          <span className="text-xs text-gray-400">{formattedTime}</span>
        </div>

        {/* 互动数据 */}
        <div className="flex items-center gap-4 text-gray-600">
          {/* 点赞 */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
          >
            <Icon
              icon={isLiked ? 'liked' : 'like'}
              size="sm"
              color={isLiked ? '#f43f5e' : 'currentColor'}
            />
            <span className="text-xs">{likesCount > 0 ? likesCount : ''}</span>
          </button>

          {/* 评论 */}
          <button
            onClick={handleComment}
            className="flex items-center gap-1 hover:text-blue-500 transition-colors"
          >
            <Icon icon="comment" size="sm" />
            <span className="text-xs">{commentsCount > 0 ? commentsCount : ''}</span>
          </button>

          {/* 浏览 */}
          <div className="flex items-center gap-1 text-gray-400">
            <Icon icon="view" size="xs" />
            <span className="text-xs">{viewsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;

