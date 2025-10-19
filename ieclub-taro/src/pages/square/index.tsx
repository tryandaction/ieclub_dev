// ==================== 📱 src/pages/square/index.tsx - 话题广场（来自开发代码） ====================
import { View, ScrollView, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { ContentType, Category, TopicStatus, ITopic, IProject, IUser, IComment } from '../../types'
import './index.scss'

export default function Square() {
  const [activeTab, setActiveTab] = useState<'topic' | 'project'>('topic')
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [showNotice, setShowNotice] = useState(true)
  const [topicData, setTopicData] = useState<ITopic[]>([])
  const [projectData, setProjectData] = useState<IProject[]>([])

  useEffect(() => {
    loadData()
  }, [activeTab, filter])

  const loadData = async () => {
    // TODO: 调用API获取数据
    console.log('加载数据', activeTab, filter)
  }

  const handleCreate = () => {
    Taro.navigateTo({
      url: `/pages/create/index?type=${activeTab}`
    })
  }

  const handleItemClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}&type=${activeTab}`
    })
  }

  return (
    <View className="square-page">
      {/* 顶部导航 */}
      <View className="top-nav">
        <View className="nav-search" onClick={() => Taro.navigateTo({ url: '/pages/search/index' })}>
          <Text className="icon">🔍</Text>
          <Text className="placeholder">搜索话题、项目</Text>
        </View>
      </View>

      {/* Tab 切换 */}
      <View className="main-tabs">
        <View
          className={`tab-item ${activeTab === 'topic' ? 'active' : ''}`}
          onClick={() => setActiveTab('topic')}
        >
          <Text className="tab-text">话题广场</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'project' ? 'active' : ''}`}
          onClick={() => setActiveTab('project')}
        >
          <Text className="tab-text">项目宣传</Text>
        </View>
      </View>

      {/* 公告栏 */}
      {showNotice && (
        <View className="notice-bar">
          <Text className="notice-icon">📢</Text>
          <Text className="notice-text">
            {activeTab === 'topic'
              ? '发起话题或需求，15人响应即可成团！'
              : '展示你的项目，找到志同道合的伙伴！'}
          </Text>
          <View className="notice-close" onClick={() => setShowNotice(false)}>
            <Text>✕</Text>
          </View>
        </View>
      )}

      {/* 分类筛选 */}
      <ScrollView scrollX className="filter-bar">
        {[
          { key: 'all', name: '全部', icon: '📋' },
          { key: Category.TECH, name: '技术', icon: '💻' },
          { key: Category.BUSINESS, name: '商业', icon: '💼' },
          { key: Category.DESIGN, name: '设计', icon: '🎨' },
          { key: Category.STUDY, name: '学习', icon: '📚' },
          { key: Category.LIFE, name: '生活', icon: '🌟' }
        ].map(item => (
          <View
            key={item.key}
            className={`filter-item ${filter === item.key ? 'active' : ''}`}
            onClick={() => setFilter(item.key as Category | 'all')}
          >
            <Text className="filter-icon">{item.icon}</Text>
            <Text className="filter-text">{item.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 内容列表 */}
      <ScrollView
        scrollY
        className="content-list"
        onScrollToLower={loadData}
      >
        {activeTab === 'topic' ? (
          /* 话题列表 */
          <View className="topic-list">
            {mockTopicData.map(topic => (
              <TopicCard key={topic.id} topic={topic} onClick={() => handleItemClick(topic.id)} />
            ))}
          </View>
        ) : (
          /* 项目列表 */
          <View className="project-list">
            {mockProjectData.map(project => (
              <ProjectCard key={project.id} project={project} onClick={() => handleItemClick(project.id)} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 浮动创建按钮 - IEClub蓝紫渐变 */}
      <View className="float-button" onClick={handleCreate}>
        <Text className="plus-icon">+</Text>
      </View>
    </View>
  )
}

// 话题卡片组件
function TopicCard({ topic, onClick }: { topic: ITopic, onClick: () => void }) {
  const isOffer = topic.type === ContentType.TOPIC_OFFER
  const progress = isOffer
    ? ((topic.wantToHearCount || 0) / (topic.threshold || 15)) * 100
    : Math.max(
        ((topic.wantToHearCount || 0) / (topic.threshold || 15)) * 100,
        ((topic.canTellCount || 0) / 1) * 100
      )

  return (
    <View className="topic-card" onClick={onClick}>
      {/* 类型标签 */}
      <View className={`type-badge ${isOffer ? 'offer' : 'demand'}`}>
        <Text>{isOffer ? '🎤 我来讲' : '🎧 想听'}</Text>
      </View>

      {/* 标题 */}
      <View className="card-title">{topic.title}</View>

      {/* 描述 */}
      <View className="card-desc">{topic.description}</View>

      {/* 标签 */}
      <View className="card-tags">
        {topic.tags.map((tag, idx) => (
          <View key={idx} className="tag tag-blue">
            <Text>{tag}</Text>
          </View>
        ))}
      </View>

      {/* 进度条 */}
      <View className="progress-section">
        <View className="progress-bar">
          <View
            className={`progress-fill ${isOffer ? 'blue' : 'purple'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
        <View className="progress-text">
          {isOffer ? (
            <Text>{topic.wantToHearCount}/{topic.threshold} 人想听</Text>
          ) : (
            <Text>
              {topic.wantToHearCount}/{topic.threshold} 想听 · {topic.canTellCount} 能讲
            </Text>
          )}
        </View>
      </View>

      {/* 底部信息 */}
      <View className="card-footer">
        <View className="author-info">
          <Image className="avatar" src={topic.author.avatar} />
          <Text className="name">{topic.author.nickname}</Text>
          <Text className="time">{topic.createdAt}</Text>
        </View>

        <View className="action-buttons">
          {isOffer ? (
            <View className="action-btn want-hear">
              <Text>👂 想听</Text>
            </View>
          ) : (
            <>
              <View className="action-btn want-hear">
                <Text>👂 同求</Text>
              </View>
              <View className="action-btn can-tell">
                <Text>🙋 我能讲</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

// 项目卡片组件
function ProjectCard({ project, onClick }: { project: IProject, onClick: () => void }) {
  return (
    <View className="project-card" onClick={onClick}>
      {/* 封面图 */}
      {project.images && project.images.length > 0 && (
        <Image className="project-cover" src={project.images[0]} mode="aspectFill" />
      )}

      <View className="project-content">
        {/* 标题 */}
        <View className="project-title">{project.title}</View>

        {/* 描述 */}
        <View className="project-desc">{project.description}</View>

        {/* 标签 */}
        <View className="project-tags">
          {project.tags.map((tag, idx) => (
            <View key={idx} className="tag tag-purple">
              <Text>{tag}</Text>
            </View>
          ))}
        </View>

        {/* 招募信息 */}
        {project.lookingForRoles && project.lookingForRoles.length > 0 && (
          <View className="recruiting">
            <Text className="recruiting-label">正在寻找：</Text>
            <Text className="recruiting-roles">{project.lookingForRoles.join('、')}</Text>
          </View>
        )}

        {/* 底部 */}
        <View className="project-footer">
          <View className="author-info">
            <Image className="avatar" src={project.author.avatar} />
            <Text className="name">{project.author.nickname}</Text>
          </View>

          <View className="project-stats">
            <Text className="stat-item">👁️ {project.viewCount}</Text>
            <Text className="stat-item">❤️ {project.likeCount}</Text>
            <Text className="stat-item">💬 {project.commentCount}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

// Mock 数据
const mockTopicData: ITopic[] = [
  {
    id: '1',
    type: ContentType.TOPIC_OFFER,
    category: Category.TECH,
    author: { id: '1', nickname: '张明', avatar: '👨‍💻' },
    title: 'GPT-4 与教育变革：AI如何重塑个性化学习',
    description: '分享我在开发AI学习助手过程中的思考，探讨大模型在教育领域的应用前景、技术挑战和伦理问题...',
    tags: ['人工智能', 'GPT-4', '教育科技'],
    duration: '45分钟',
    wantToHearCount: 23,
    canTellCount: 0,
    threshold: 15,
    status: TopicStatus.COLLECTING,
    viewCount: 156,
    likeCount: 34,
    commentCount: 8,
    shareCount: 3,
    createdAt: '2小时前',
    updatedAt: '2小时前'
  },
  {
    id: '2',
    type: ContentType.TOPIC_DEMAND,
    category: Category.BUSINESS,
    author: { id: '2', nickname: '李思', avatar: '👩‍💼' },
    title: '想了解初创公司如何进行股权设计',
    description: '准备和朋友创业，但对股权分配、期权池、投资人股权等一窍不通，希望有经验的学长学姐分享...',
    tags: ['创业', '股权设计', '融资'],
    wantToHearCount: 18,
    canTellCount: 2,
    threshold: 15,
    status: TopicStatus.COLLECTING,
    viewCount: 89,
    likeCount: 21,
    commentCount: 12,
    shareCount: 1,
    createdAt: '5小时前',
    updatedAt: '5小时前'
  }
]

const mockProjectData: IProject[] = [
  {
    id: '1',
    type: ContentType.PROJECT,
    category: Category.TECH,
    author: { id: '1', nickname: '王芳', avatar: '👩‍💻' },
    title: 'EduAI - 基于GPT的智能学习助手',
    description: '通过AI技术为学生提供个性化学习路径规划、智能答疑和知识图谱构建...',
    tags: ['AI', '教育', 'React', 'Python'],
    images: ['https://example.com/project1.jpg'],
    teamSize: 3,
    lookingForRoles: ['前端开发', 'UI设计师'],
    projectStage: '原型阶段',
    viewCount: 234,
    likeCount: 56,
    commentCount: 18,
    interestedCount: 12,
    createdAt: '1天前',
    updatedAt: '1天前'
  }
]