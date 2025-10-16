// src/pages/topics/index.tsx - 话题广场页面

import { View, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useTopicStore } from '../../store/topic'
import TopicCard from '../../components/TopicCard'
import TopicFilters from '../../components/TopicFilters'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import './index.scss'

export default function TopicsPage() {
  const { 
    topics, 
    hasMore, 
    loading, 
    filters,
    fetchTopics,
    setFilters,
    clearTopics
  } = useTopicStore()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTopics()
    
    return () => {
      clearTopics()
    }
  }, [])

  // 加载话题列表
  const loadTopics = async () => {
    try {
      await fetchTopics({ page: 1 })
    } catch (error) {
      console.error('加载话题失败:', error)
    }
  }

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchTopics({ page: 1 })
    } finally {
      setRefreshing(false)
    }
  }

  // 加载更多
  const onLoadMore = async () => {
    if (!hasMore || loading) return
    
    try {
      await fetchTopics({ page: filters.page! + 1 }, true)
    } catch (error) {
      console.error('加载更多失败:', error)
    }
  }

  // 筛选变化
  const onFilterChange = async (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 })
    await fetchTopics({ ...newFilters, page: 1 })
  }

  // 跳转到创建页面
  const goToCreate = () => {
    Taro.navigateTo({ url: '/pages/create-topic/index' })
  }

  // 跳转到话题详情
  const goToDetail = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}` })
  }

  return (
    <View className='topics-page'>
      {/* 筛选器 */}
      <TopicFilters 
        filters={filters}
        onChange={onFilterChange}
      />

      {/* 话题列表 */}
      <ScrollView
        className='topics-scroll'
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onRefresh}
        onScrollToLower={onLoadMore}
        lowerThreshold={100}
      >
        {loading && topics.length === 0 ? (
          <LoadingSpinner />
        ) : topics.length === 0 ? (
          <EmptyState 
            title='暂无话题'
            description='快来发布第一个话题吧'
            actionText='发布话题'
            onAction={goToCreate}
          />
        ) : (
          <View className='topics-list'>
            {topics.map(topic => (
              <TopicCard 
                key={topic.id}
                topic={topic}
                onClick={() => goToDetail(topic.id)}
              />
            ))}
            
            {hasMore && (
              <View className='load-more'>
                {loading ? '加载中...' : '上拉加载更多'}
              </View>
            )}
            
            {!hasMore && topics.length > 0 && (
              <View className='no-more'>没有更多了</View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 发布按钮 */}
      <View className='create-btn' onClick={goToCreate}>
        <View className='create-icon'>+</View>
      </View>
    </View>
  )
}


// ==================== src/pages/topics/index.config.ts ====================

export default definePageConfig({
  navigationBarTitleText: '话题广场',
  enablePullDownRefresh: false,
  backgroundColor: '#f5f5f5'
})


// ==================== src/pages/topics/index.scss ====================

.topics-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;

  .topics-scroll {
    flex: 1;
    height: 0;
  }

  .topics-list {
    padding: 16px;
  }

  .load-more,
  .no-more {
    text-align: center;
    padding: 20px;
    font-size: 14px;
    color: #999;
  }

  .create-btn {
    position: fixed;
    right: 20px;
    bottom: 80px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;

    .create-icon {
      font-size: 32px;
      color: white;
      font-weight: 300;
    }
  }
}


// ==================== src/pages/topic-detail/index.tsx ====================

import { View, ScrollView, Image, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { useTopicStore } from '../../store/topic'
import { useCommentStore } from '../../store/comment'
import { useUserStore } from '../../store/user'
import CommentList from '../../components/CommentList'
import CommentInput from '../../components/CommentInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatRelativeTime } from '../../utils/format'
import './index.scss'

export default function TopicDetailPage() {
  const router = useRouter()
  const topicId = router.params.id!

  const { currentTopic, fetchTopicDetail, likeTopic, unlikeTopic } = useTopicStore()
  const { comments, fetchComments, createComment, replyingTo, setReplyingTo } = useCommentStore()
  const { userInfo } = useUserStore()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    
    return () => {
      setReplyingTo(null)
    }
  }, [topicId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTopicDetail(topicId),
        fetchComments(topicId)
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 点赞/取消点赞
  const handleLike = async () => {
    if (!currentTopic) return
    
    try {
      if (currentTopic.isLiked) {
        await unlikeTopic(topicId)
      } else {
        await likeTopic(topicId)
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
    }
  }

  // 发送评论
  const handleSendComment = async (content: string) => {
    try {
      await createComment({
        topicId,
        content,
        parentId: replyingTo?.id
      })
      
      setReplyingTo(null)
      
      // 刷新评论列表
      await fetchComments(topicId)
    } catch (error) {
      console.error('发送评论失败:', error)
    }
  }

  // 预览图片
  const previewImage = (index: number) => {
    if (!currentTopic?.images) return
    
    Taro.previewImage({
      urls: currentTopic.images,
      current: currentTopic.images[index]
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!currentTopic) {
    return (
      <View className='error-state'>
        <Text>话题不存在</Text>
      </View>
    )
  }

  return (
    <View className='topic-detail-page'>
      <ScrollView className='detail-scroll' scrollY>
        {/* 作者信息 */}
        <View className='author-section'>
          <Image 
            className='avatar'
            src={currentTopic.author.avatar}
            mode='aspectFill'
          />
          <View className='author-info'>
            <Text className='nickname'>{currentTopic.author.nickname}</Text>
            <Text className='time'>{formatRelativeTime(currentTopic.createdAt)}</Text>
          </View>
        </View>

        {/* 话题标题 */}
        <View className='title-section'>
          <Text className='title'>{currentTopic.title}</Text>
        </View>

        {/* 话题内容 */}
        <View className='content-section'>
          <Text className='content'>{currentTopic.content}</Text>
        </View>

        {/* 图片列表 */}
        {currentTopic.images && currentTopic.images.length > 0 && (
          <View className='images-section'>
            {currentTopic.images.map((img, index) => (
              <Image
                key={index}
                className='image-item'
                src={img}
                mode='aspectFill'
                onClick={() => previewImage(index)}
              />
            ))}
          </View>
        )}

        {/* 标签 */}
        {currentTopic.tags && currentTopic.tags.length > 0 && (
          <View className='tags-section'>
            {currentTopic.tags.map(tag => (
              <View key={tag} className='tag'>#{tag}</View>
            ))}
          </View>
        )}

        {/* 统计信息 */}
        <View className='stats-section'>
          <View className='stat-item'>
            <Text className='stat-value'>{currentTopic.viewsCount}</Text>
            <Text className='stat-label'>浏览</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{currentTopic.likesCount}</Text>
            <Text className='stat-label'>点赞</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{currentTopic.commentsCount}</Text>
            <Text className='stat-label'>评论</Text>
          </View>
        </View>

        {/* 评论列表 */}
        <View className='comments-section'>
          <View className='comments-header'>
            <Text className='comments-title'>评论 {currentTopic.commentsCount}</Text>
          </View>
          
          <CommentList 
            comments={comments}
            onReply={setReplyingTo}
          />
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='bottom-bar'>
        <CommentInput 
          placeholder={replyingTo ? `回复 @${replyingTo.author.nickname}` : '写下你的评论...'}
          onSend={handleSendComment}
          onCancel={() => setReplyingTo(null)}
        />
        
        <View className='action-btns'>
          <View 
            className={`action-btn ${currentTopic.isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <Text className='icon'>❤️</Text>
            <Text className='label'>{currentTopic.likesCount}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}


// ==================== src/pages/topic-detail/index.config.ts ====================

export default definePageConfig({
  navigationBarTitleText: '话题详情',
  enablePullDownRefresh: false
})


// ==================== src/pages/topic-detail/index.scss ====================

.topic-detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;

  .detail-scroll {
    flex: 1;
    height: 0;
  }

  .author-section {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 24px;
      margin-right: 12px;
    }

    .author-info {
      flex: 1;

      .nickname {
        display: block;
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }

      .time {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .title-section {
    padding: 16px;

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      line-height: 1.5;
    }
  }

  .content-section {
    padding: 0 16px 16px;

    .content {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
    }
  }

  .images-section {
    display: flex;
    flex-wrap: wrap;
    padding: 0 16px;
    gap: 8px;

    .image-item {
      width: calc((100% - 16px) / 3);
      height: 100px;
      border-radius: 8px;
    }
  }

  .tags-section {
    display: flex;
    flex-wrap: wrap;
    padding: 16px;
    gap: 8px;

    .tag {
      padding: 4px 12px;
      background: #f0f0f0;
      border-radius: 12px;
      font-size: 14px;
      color: #666;
    }
  }

  .stats-section {
    display: flex;
    padding: 16px;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;

    .stat-item {
      flex: 1;
      text-align: center;

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .comments-section {
    padding: 16px;

    .comments-header {
      margin-bottom: 16px;

      .comments-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .bottom-bar {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid #f0f0f0;
    background: #fff;
    gap: 12px;

    .action-btns {
      display: flex;
      gap: 16px;

      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .icon {
          font-size: 20px;
        }

        .label {
          font-size: 12px;
          color: #666;
        }

        &.liked {
          .icon {
            color: #f56c6c;
          }
          
          .label {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-size: 16px;
    color: #999;
  }
}