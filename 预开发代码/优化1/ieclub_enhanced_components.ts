// ==================== src/components/EnhancedTopicCard/index.tsx ====================

import { View, Image, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { formatRelativeTime } from '../../utils/format'
import { useEnhancedTopicStore } from '../../store/enhanced-topic'
import { useActionTracking } from '../../hooks/useAnalytics'
import type { EnhancedTopic } from '../../types/enhanced'
import './index.scss'

interface EnhancedTopicCardProps {
  topic: EnhancedTopic
  onClick?: () => void
}

export default function EnhancedTopicCard({ topic, onClick }: EnhancedTopicCardProps) {
  const { handleQuickAction } = useEnhancedTopicStore()
  const { track } = useActionTracking()
  const [actionsExpanded, setActionsExpanded] = useState(false)
  
  const userInfo = Taro.getStorageSync('userInfo')
  const userId = userInfo?.id

  // 快速操作配置
  const quickActions = [
    {
      id: 'interested',
      icon: '👂',
      label: '想听',
      color: '#3b82f6',
      active: topic.quickActions.interested?.includes(userId),
      count: topic.quickActions.interested?.length || 0
    },
    {
      id: 'wantToShare',
      icon: '🎤',
      label: '我来分享',
      color: '#10b981',
      active: topic.quickActions.wantToShare?.includes(userId),
      count: topic.quickActions.wantToShare?.length || 0
    },
    {
      id: 'offeringHelp',
      icon: '🤝',
      label: '我来帮',
      color: '#f59e0b',
      active: topic.quickActions.offeringHelp?.includes(userId),
      count: topic.quickActions.offeringHelp?.length || 0
    },
    {
      id: 'haveResource',
      icon: '💎',
      label: '有资源',
      color: '#8b5cf6',
      active: topic.quickActions.haveResource?.includes(userId),
      count: topic.quickActions.haveResource?.length || 0
    }
  ]

  const handleActionClick = async (actionId: string, e: any) => {
    e.stopPropagation()
    
    track('quick_action_click', {
      topicId: topic.id,
      action: actionId
    })
    
    try {
      await handleQuickAction(topic.id, actionId)
    } catch (error) {
      console.error('快速操作失败:', error)
    }
  }

  const getDemandBadge = () => {
    if (!topic.demand) return null
    
    const badges = {
      seeking: { icon: '🎯', label: '求助', color: '#ef4444' },
      offering: { icon: '💡', label: '分享', color: '#10b981' },
      collaboration: { icon: '🤝', label: '求合作', color: '#f59e0b' }
    }
    
    const badge = badges[topic.demand.type]
    return (
      <View className='demand-badge' style={{ background: badge.color }}>
        <Text>{badge.icon} {badge.label}</Text>
      </View>
    )
  }

  return (
    <View className='enhanced-topic-card' onClick={onClick}>
      {/* 头部：作者信息 + 推荐理由 */}
      <View className='card-header'>
        <Image className='avatar' src={topic.author.avatar} mode='aspectFill' />
        <View className='author-info'>
          <Text className='nickname'>{topic.author.nickname}</Text>
          <Text className='time'>{formatRelativeTime(topic.createdAt)}</Text>
        </View>
        
        {topic.recommendation && (
          <View className='recommend-tag'>
            ✨ {topic.recommendation.reason}
          </View>
        )}
      </View>

      {/* 需求标识 */}
      {getDemandBadge()}

      {/* 内容区 */}
      <View className='card-content'>
        <Text className='title'>{topic.title}</Text>
        <Text className='content'>{topic.content}</Text>
        
        {/* 图片网格 */}
        {topic.media.images && topic.media.images.length > 0 && (
          <View className='images-grid'>
            {topic.media.images.slice(0, 3).map((img, index) => (
              <Image
                key={index}
                className='image-item'
                src={img}
                mode='aspectFill'
              />
            ))}
            {topic.media.images.length > 3 && (
              <View className='more-images'>+{topic.media.images.length - 3}</View>
            )}
          </View>
        )}
        
        {/* 文档附件 */}
        {topic.media.documents && topic.media.documents.length > 0 && (
          <View className='documents-list'>
            {topic.media.documents.map(doc => (
              <View key={doc.id} className='document-item'>
                <View className='doc-icon'>📄</View>
                <View className='doc-info'>
                  <Text className='doc-name'>{doc.name}</Text>
                  <Text className='doc-meta'>{formatFileSize(doc.size)} · {doc.pageCount}页</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* 链接卡片 */}
        {topic.media.linkCards && topic.media.linkCards.length > 0 && (
          <View className='link-cards'>
            {topic.media.linkCards.map((link, index) => (
              <View key={index} className='link-card'>
                <Image className='link-cover' src={link.coverImage} mode='aspectFill' />
                <View className='link-info'>
                  <Text className='link-title'>{link.title}</Text>
                  <Text className='link-desc'>{link.description}</Text>
                  <View className='link-source'>
                    {link.favicon && <Image className='favicon' src={link.favicon} />}
                    <Text className='source-name'>{getSourceName(link.source)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 标签 */}
      {(topic.tags.length > 0 || topic.demand?.skillsRequired) && (
        <View className='tags-section'>
          {topic.tags.map(tag => (
            <View key={tag} className='tag'>#{tag}</View>
          ))}
          {topic.demand?.skillsRequired?.map(skill => (
            <View key={skill} className='skill-tag'>💪 {skill}</View>
          ))}
        </View>
      )}

      {/* 统计信息 */}
      <View className='stats-section'>
        <View className='stat-item'>
          <Text className='icon'>👁</Text>
          <Text className='value'>{formatNumber(topic.stats.views)}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>❤️</Text>
          <Text className='value'>{formatNumber(topic.stats.likes)}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>💬</Text>
          <Text className='value'>{formatNumber(topic.stats.comments)}</Text>
        </View>
        
        {topic.stats.interestedCount > 0 && (
          <View className='stat-item highlight'>
            <Text className='icon'>👂</Text>
            <Text className='value'>{topic.stats.interestedCount}人想听</Text>
          </View>
        )}
      </View>

      {/* 快速操作栏 */}
      <View className='quick-actions'>
        {quickActions.slice(0, actionsExpanded ? 4 : 2).map(action => (
          <View
            key={action.id}
            className={`action-btn ${action.active ? 'active' : ''}`}
            style={{ borderColor: action.color }}
            onClick={(e) => handleActionClick(action.id, e)}
          >
            <Text className='action-icon'>{action.icon}</Text>
            <Text className='action-label'>{action.label}</Text>
            {action.count > 0 && (
              <Text className='action-count'>({action.count})</Text>
            )}
          </View>
        ))}
        
        <View 
          className='expand-btn'
          onClick={(e) => {
            e.stopPropagation()
            setActionsExpanded(!actionsExpanded)
          }}
        >
          <Text>{actionsExpanded ? '收起' : '更多'}</Text>
        </View>
      </View>

      {/* 热度指示器 */}
      {topic.status.isHot && topic.stats.realtimeViewers > 0 && (
        <View className='hot-indicator'>
          🔥 正在热议 · {topic.stats.realtimeViewers}人在看
        </View>
      )}
    </View>
  )
}

// 辅助函数
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 10000) return (num / 1000).toFixed(1) + 'k'
  return (num / 10000).toFixed(1) + 'w'
}

function getSourceName(source: string): string {
  const names = {
    wechat: '微信公众号',
    zhihu: '知乎',
    bilibili: 'B站',
    github: 'GitHub',
    general: '网页链接'
  }
  return names[source] || '链接'
}


// ==================== src/components/EnhancedTopicCard/index.scss ====================

.enhanced-topic-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      margin-right: 12px;
    }

    .author-info {
      flex: 1;

      .nickname {
        display: block;
        font-size: 15px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .time {
        font-size: 12px;
        color: #999;
      }
    }

    .recommend-tag {
      padding: 4px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border-radius: 12px;
      font-size: 12px;
    }
  }

  .demand-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 12px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 12px;
  }

  .card-content {
    margin-bottom: 12px;

    .title {
      display: block;
      font-size: 17px;
      font-weight: 600;
      color: #333;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .content {
      display: block;
      font-size: 15px;
      color: #666;
      line-height: 1.6;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
    }

    .images-grid {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      position: relative;

      .image-item {
        width: calc((100% - 16px) / 3);
        height: 100px;
        border-radius: 12px;
      }

      .more-images {
        position: absolute;
        right: 8px;
        bottom: 8px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        border-radius: 8px;
        font-size: 12px;
      }
    }

    .documents-list {
      margin-top: 12px;

      .document-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 12px;
        margin-bottom: 8px;

        .doc-icon {
          font-size: 32px;
          margin-right: 12px;
        }

        .doc-info {
          flex: 1;

          .doc-name {
            display: block;
            font-size: 14px;
            color: #333;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .doc-meta {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }

    .link-cards {
      margin-top: 12px;

      .link-card {
        display: flex;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 12px;
        border-left: 4px solid #667eea;

        .link-cover {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .link-info {
          flex: 1;
          overflow: hidden;

          .link-title {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .link-desc {
            display: block;
            font-size: 12px;
            color: #666;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            margin-bottom: 6px;
          }

          .link-source {
            display: flex;
            align-items: center;

            .favicon {
              width: 16px;
              height: 16px;
              margin-right: 6px;
            }

            .source-name {
              font-size: 11px;
              color: #999;
            }
          }
        }
      }
    }
  }

  .tags-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;

    .tag {
      padding: 4px 12px;
      background: #f0f0f0;
      border-radius: 12px;
      font-size: 13px;
      color: #666;
    }

    .skill-tag {
      padding: 4px 12px;
      background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
      border: 1px solid #667eea;
      border-radius: 12px;
      font-size: 13px;
      color: #667eea;
      font-weight: 500;
    }
  }

  .stats-section {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .icon {
        font-size: 16px;
      }

      .value {
        font-size: 13px;
        color: #666;
      }

      &.highlight {
        padding: 4px 8px;
        background: #fff3e0;
        border-radius: 8px;

        .value {
          color: #f59e0b;
          font-weight: 600;
        }
      }
    }
  }

  .quick-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px;
      border: 1.5px solid #e0e0e0;
      border-radius: 12px;
      background: #fff;
      transition: all 0.3s ease;

      .action-icon {
        font-size: 18px;
      }

      .action-label {
        font-size: 13px;
        color: #666;
        font-weight: 500;
      }

      .action-count {
        font-size: 12px;
        color: #999;
      }

      &.active {
        background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
        border-color: #667eea;

        .action-label {
          color: #667eea;
        }
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .expand-btn {
      padding: 10px 16px;
      background: #f5f5f5;
      border-radius: 12px;
      font-size: 13px;
      color: #666;
    }
  }

  .hot-indicator {
    margin-top: 12px;
    padding: 8px 12px;
    background: linear-gradient(90deg, #ff6b6b20, #ee5a6f20);
    border-left: 3px solid #ff6b6b;
    border-radius: 8px;
    font-size: 13px;
    color: #ff6b6b;
    font-weight: 500;
  }
}


// ==================== src/components/FloatingActionButton/index.tsx ====================

import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function FloatingActionButton() {
  const [expanded, setExpanded] = useState(false)

  const actions = [
    { id: 'demand', label: '发布需求', icon: '🎯', color: '#ef4444' },
    { id: 'share', label: '分享经验', icon: '💡', color: '#3b82f6' },
    { id: 'project', label: '发起项目', icon: '🚀', color: '#8b5cf6' },
    { id: 'event', label: '组织活动', icon: '📅', color: '#10b981' },
    { id: 'question', label: '提问求助', icon: '❓', color: '#f59e0b' }
  ]

  const handleActionClick = (actionId: string) => {
    setExpanded(false)
    Taro.navigateTo({
      url: `/pages/create-topic/index?type=${actionId}`
    })
  }

  return (
    <View className='floating-action-button'>
      {expanded && (
        <>
          <View className='fab-mask' onClick={() => setExpanded(false)} />
          <View className='fab-menu'>
            {actions.map((action, index) => (
              <View
                key={action.id}
                className='fab-menu-item'
                style={{
                  animationDelay: `${index * 50}ms`,
                  background: action.color
                }}
                onClick={() => handleActionClick(action.id)}
              >
                <Text className='fab-icon'>{action.icon}</Text>
                <Text className='fab-label'>{action.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      <View
        className={`fab-main ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <Text className='fab-icon'>{expanded ? '✕' : '✨'}</Text>
      </View>
    </View>
  )
}


// ==================== src/components/FloatingActionButton/index.scss ====================

.floating-action-button {
  position: fixed;
  right: 20px;
  bottom: 80px;
  z-index: 1000;

  .fab-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999;
  }

  .fab-menu {
    position: absolute;
    bottom: 80px;
    right: 0;

    .fab-menu-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      margin-bottom: 12px;
      border-radius: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: fabSlideIn 0.3s ease forwards;
      transform: translateY(20px);
      opacity: 0;

      .fab-icon {
        font-size: 24px;
        margin-right: 12px;
      }

      .fab-label {
        font-size: 15px;
        color: #fff;
        font-weight: 500;
        white-space: nowrap;
      }
    }
  }

  .fab-main {
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    .fab-icon {
      font-size: 28px;
      color: #fff;
    }

    &.expanded {
      transform: rotate(45deg);
    }

    &:active {
      transform: scale(0.9);
    }
  }
}

@keyframes fabSlideIn {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}


// ==================== src/components/TrendingBar/index.tsx ====================

import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { getTrendingKeywords } from '../../services/trending'
import type { TrendingKeyword } from '../../types/enhanced'
import './index.scss'

export default function TrendingBar() {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([])

  useEffect(() => {
    loadTrendingKeywords()
    
    // 每5分钟刷新一次
    const interval = setInterval(loadTrendingKeywords, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadTrendingKeywords = async () => {
    try {
      const res = await getTrendingKeywords(10)
      setKeywords(res.keywords)
    } catch (error) {
      console.error('获取热点失败:', error)
    }
  }

  const handleKeywordClick = (keyword: string) => {
    Taro.navigateTo({
      url: `/pages/trending/index?keyword=${encodeURIComponent(keyword)}`
    })
  }

  if (keywords.length === 0) return null

  return (
    <View className='trending-bar'>
      <View className='trending-header'>
        <Text className='icon'>🔥</Text>
        <Text className='title'>正在热议</Text>
      </View>
      
      <ScrollView className='trending-scroll' scrollX>
        <View className='trending-list'>
          {keywords.map((keyword, index) => (
            <View
              key={keyword.word}
              className='trending-item'
              onClick={() => handleKeywordClick(keyword.word)}
            >
              <Text className='rank'>{index + 1}</Text>
              <Text className='word'>{keyword.word}</Text>
              {keyword.growth > 2 && (
                <View className='hot-badge'>🔥</View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}


// ==================== src/components/TrendingBar/index.scss ====================

.trending-bar {
  background: linear-gradient(135deg, #ff6b6b20 0%, #ee5a6f20 100%);
  padding: 12px 16px;
  margin-bottom: 12px;

  .trending-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .icon {
      font-size: 18px;
      margin-right: 6px;
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }

  .trending-scroll {
    white-space: nowrap;
  }

  .trending-list {
    display: inline-flex;
    gap: 12px;

    .trending-item {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      position: relative;

      .rank {
        font-size: 12px;
        color: #ff6b6b;
        font-weight: 700;
        margin-right: 6px;
      }

      .word {
        font-size: 13px;
        color: #333;
        font-weight: 500;
      }

      .hot-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        font-size: 14px;
      }
    }
  }
}


// ==================== src/components/MatchingCard/index.tsx ====================

import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { DemandMatchResult } from '../../types/enhanced'
import './index.scss'

interface MatchingCardProps {
  match: DemandMatchResult
  onContact?: () => void
}

export default function MatchingCard({ match, onContact }: MatchingCardProps) {
  const { user, score, matchedSkills, reasons } = match

  return (
    <View className='matching-card'>
      <View className='match-score'>
        <Text className='score-value'>{score}</Text>
        <Text className='score-label'>匹配度</Text>
      </View>

      <View className='user-info'>
        <Image className='avatar' src={user.avatar} mode='aspectFill' />
        <View className='info'>
          <Text className='nickname'>{user.nickname}</Text>
          <Text className='bio'>{user.bio || '暂无简介'}</Text>
        </View>
      </View>

      <View className='matched-skills'>
        <Text className='skills-label'>匹配技能：</Text>
        {matchedSkills.map(skill => (
          <View key={skill} className='skill-tag'>💪 {skill}</View>
        ))}
      </View>

      <View className='match-reasons'>
        {reasons.map((reason, index) => (
          <View key={index} className='reason-item'>
            <Text className='bullet'>•</Text>
            <Text className='reason-text'>{reason}</Text>
          </View>
        ))}
      </View>

      <View className='actions'>
        <View className='action-btn primary' onClick={onContact}>
          立即联系
        </View>
        <View className='action-btn'>查看主页</View>
      </View>
    </View>
  )
}