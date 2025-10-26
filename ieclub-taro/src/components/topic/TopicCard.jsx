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
        {/* 装饰性渐变叠加 - 增强底部对比度 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
        
        {/* 类型徽章 - 左上角 */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md bg-white shadow-md`}>
            <Icon icon={typeConfig.icon} size="sm" color={type === TopicType.OFFER ? '#5B7FFF' : type === TopicType.DEMAND ? '#FF6B9D' : '#FFA500'} />
            <span className={type === TopicType.OFFER ? 'text-blue-700' : type === TopicType.DEMAND ? 'text-pink-700' : 'text-orange-700'}>{typeConfig.name}</span>
          </div>
        </div>

        {/* 收藏按钮 - 右上角 */}
        <button
          onClick={handleBookmark}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-md hover:scale-110"
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
          <h3 className="text-xl font-black text-white mb-2 line-clamp-2 leading-tight" style={{
            textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)'
          }}>
            {title}
          </h3>
          
          {/* 标签 */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 bg-white backdrop-blur-sm text-gray-800 rounded-full text-xs font-bold shadow-lg"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 类型特有标签 - 底部 */}
          <div className="flex gap-2 text-xs">
            {type === TopicType.OFFER && format && (
              <span className="px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full font-bold text-gray-800 shadow-lg">
                {format === 'online' ? '🌐 线上' : '📍 线下'}
              </span>
            )}
            {type === TopicType.DEMAND && wantToHearCount && (
              <span className="px-2.5 py-1.5 bg-pink-600 backdrop-blur-md text-white rounded-full font-bold shadow-lg">
                👥 {wantToHearCount}人想听
              </span>
            )}
            {type === TopicType.PROJECT && recruiting && (
              <span className="px-2.5 py-1.5 bg-orange-600 backdrop-blur-md text-white rounded-full font-bold shadow-lg">
                🔥 招募中
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 卡片底部信息 */}
      <div className="p-4 bg-white">
        {/* 作者信息 */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 跳转到用户主页
              console.log('跳转到用户主页:', author);
            }}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {avatar || author?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-bold text-gray-900 hover:text-purple-600 transition-colors">{author || '匿名用户'}</span>
          </div>
          <span className="text-xs font-medium text-gray-500">{formattedTime}</span>
        </div>

        {/* 互动数据 */}
        <div className="flex items-center gap-5 text-gray-700">
          {/* 点赞 */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 hover:text-red-500 transition-colors group"
          >
            <Icon
              icon={isLiked ? 'liked' : 'like'}
              size="sm"
              color={isLiked ? '#f43f5e' : 'currentColor'}
            />
            <span className="text-sm font-semibold">{likesCount > 0 ? likesCount : 0}</span>
          </button>

          {/* 评论 */}
          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group"
          >
            <Icon icon="comment" size="sm" />
            <span className="text-sm font-semibold">{commentsCount > 0 ? commentsCount : 0}</span>
          </button>

          {/* 浏览 */}
          <div className="flex items-center gap-1.5 text-gray-500">
            <Icon icon="view" size="sm" />
            <span className="text-sm font-semibold">{viewsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;

