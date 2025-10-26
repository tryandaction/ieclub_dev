/**
 * 话题列表组件
 * 渲染话题列表，支持加载更多、空状态、加载状态
 * 使用小红书风格的瀑布流布局
 */
import React from 'react';
import TopicCard from './TopicCard.jsx';
import MasonryGrid from './MasonryGrid.jsx';
import Icon from '../common/Icon.jsx';
import { SkeletonCard } from '../common/SkeletonCard.jsx';

/**
 * 空状态组件
 */
const EmptyState = ({ type }) => {
  const emptyMessages = {
    offer: '暂无"我来讲"话题，快来分享你的知识吧！',
    demand: '暂无"想听"需求，快来发布你的学习需求吧！',
    project: '暂无项目宣传，快来展示你的项目吧！',
    default: '暂无话题，快来发布第一个话题吧！',
  };

  const message = emptyMessages[type] || emptyMessages.default;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon icon="search" size="3xl" color="#d1d5db" />
      </div>
      <p className="text-gray-500 text-center mb-4">{message}</p>
      <button className="px-6 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-primary transition-all">
        <Icon icon="publish" size="sm" color="#ffffff" className="mr-2" />
        立即发布
      </button>
    </div>
  );
};

/**
 * 加载中组件
 */
const LoadingState = () => {
  return (
    <MasonryGrid gap={16} minColumnWidth={260}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} variant="topic" />
      ))}
    </MasonryGrid>
  );
};

/**
 * 话题列表组件
 * @param {array} topics - 话题列表
 * @param {boolean} loading - 是否加载中
 * @param {boolean} hasMore - 是否还有更多
 * @param {function} onLoadMore - 加载更多回调
 * @param {function} onTopicClick - 话题点击回调
 * @param {function} onLike - 点赞回调
 * @param {function} onBookmark - 收藏回调
 * @param {function} onComment - 评论回调
 * @param {string} emptyType - 空状态类型
 */
const TopicList = ({
  topics = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  onTopicClick,
  onLike,
  onBookmark,
  onComment,
  emptyType,
}) => {
  // 加载中状态
  if (loading && topics.length === 0) {
    return <LoadingState />;
  }

  // 空状态
  if (!loading && topics.length === 0) {
    return <EmptyState type={emptyType} />;
  }

  return (
    <div className="topic-list">
      {/* 瀑布流布局 - 小红书风格 */}
      <MasonryGrid gap={16} minColumnWidth={260}>
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onClick={onTopicClick}
            onLike={onLike}
            onBookmark={onBookmark}
            onComment={onComment}
          />
        ))}
      </MasonryGrid>

      {/* 加载更多按钮 */}
      {hasMore && (
        <div className="flex justify-center py-8 mt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-primary-500 text-primary-500 rounded-full font-medium hover:bg-primary-50 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span>加载中...</span>
              </>
            ) : (
              <>
                <Icon icon="refresh" size="sm" />
                <span>加载更多</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 没有更多了 */}
      {!hasMore && topics.length > 0 && (
        <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
          <Icon icon="check" size="sm" className="mr-1" />
          <span>已经到底了～</span>
        </div>
      )}
    </div>
  );
};

export default TopicList;

