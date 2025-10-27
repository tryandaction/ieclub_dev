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
import '../../styles/responsive.scss';

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
    <div className="flex flex-col items-center justify-center" style={{ padding: '128rpx 0' }}>
      <div className="flex-center-perfect bg-gray-100 mb-4" style={{
        width: '192rpx',
        height: '192rpx',
        borderRadius: 'var(--radius-full)'
      }}>
        <Icon icon="search" size="3xl" color="#d1d5db" />
      </div>
      <p className="text-gray-500 text-center" style={{
        marginBottom: '32rpx',
        fontSize: 'var(--text-base)'
      }}>{message}</p>
      <button className="bg-gradient-primary text-white font-medium hover:shadow-primary transition-all touch-target" style={{
        padding: '0 48rpx',
        height: 'var(--touch-target-min)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '16rpx',
        fontSize: 'var(--text-base)'
      }}>
        <Icon icon="publish" size="sm" color="#ffffff" />
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
    <MasonryGrid gap={32} minColumnWidth={520}>
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
      {/* 瀑布流布局 - rpx适配 */}
      <MasonryGrid gap={32} minColumnWidth={520}>
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
        <div className="flex justify-center" style={{ padding: '64rpx 0', marginTop: '32rpx' }}>
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="flex-center-perfect bg-white border-2 border-primary-500 text-primary-500 font-medium hover:bg-primary-50 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            style={{
              gap: '16rpx',
              padding: '0 64rpx',
              height: 'var(--touch-target-min)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-base)'
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{
                  width: '32rpx',
                  height: '32rpx',
                  border: '4rpx solid',
                  borderColor: 'currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: 'var(--radius-full)'
                }}></div>
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
        <div className="flex-center-perfect text-gray-400" style={{
          padding: '64rpx 0',
          fontSize: 'var(--text-sm)',
          gap: '8rpx'
        }}>
          <Icon icon="check" size="sm" />
          <span>已经到底了～</span>
        </div>
      )}
    </div>
  );
};

export default TopicList;

