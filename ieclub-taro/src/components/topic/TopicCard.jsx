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
      className={`bg-white rounded-xl border-2 ${typeConfig.borderColor} p-4 hover:shadow-card-hover transition-all cursor-pointer`}
    >
      {/* 头部：作者信息和类型徽章 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 头像 */}
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
            {avatar || author?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{author || '匿名用户'}</div>
            <div className="text-xs text-gray-500">{formattedTime}</div>
          </div>
        </div>
        {renderTypeBadge()}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
        {title}
      </h3>

      {/* 内容 */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
        {content}
      </p>

      {/* 标签 */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
            >
              <Icon icon="tag" size="xs" />
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-400">+{tags.length - 3}</span>
          )}
        </div>
      )}

      {/* 类型特有信息 */}
      {renderOfferInfo()}
      {renderDemandInfo()}
      {renderProjectInfo()}

      {/* 底部：互动按钮 */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {/* 点赞 */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors"
          >
            <Icon
              icon={isLiked ? 'liked' : 'like'}
              size="sm"
              color={isLiked ? '#f43f5e' : 'currentColor'}
            />
            <span className="text-sm">{likesCount}</span>
          </button>

          {/* 评论 */}
          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <Icon icon="comment" size="sm" />
            <span className="text-sm">{commentsCount}</span>
          </button>

          {/* 浏览 */}
          <div className="flex items-center gap-1.5 text-gray-500">
            <Icon icon="view" size="sm" />
            <span className="text-sm">{viewsCount}</span>
          </div>
        </div>

        {/* 收藏 */}
        <button
          onClick={handleBookmark}
          className="flex items-center gap-1.5 text-gray-600 hover:text-yellow-500 transition-colors"
        >
          <Icon
            icon={isBookmarked ? 'bookmarked' : 'bookmark'}
            size="sm"
            color={isBookmarked ? '#eab308' : 'currentColor'}
          />
        </button>
      </div>
    </div>
  );
};

export default TopicCard;

