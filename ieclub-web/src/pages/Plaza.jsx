import { useState } from 'react'

const tabs = [
  { id: 'all', label: '推荐', icon: '✨' },
  { id: 'offer', label: '我来讲', icon: '🎤' },
  { id: 'demand', label: '想听', icon: '👂' },
  { id: 'project', label: '项目', icon: '🚀' },
]

const mockTopics = [
  {
    id: 1,
    type: 'offer',
    title: 'Python爬虫实战',
    cover: '🐍',
    author: { name: '张三', avatar: '👨‍💻', level: 12 },
    tags: ['Python', '爬虫'],
    stats: { views: 456, likes: 89, comments: 34 },
  },
  {
    id: 2,
    type: 'demand',
    title: '线性代数期末串讲',
    cover: '📐',
    author: { name: '李四', avatar: '👩‍🎓', level: 8 },
    tags: ['数学', '期末'],
    stats: { views: 234, likes: 45, comments: 23, wantCount: 12 },
  },
  {
    id: 3,
    type: 'project',
    title: '智能选课助手',
    cover: '🚀',
    author: { name: '王五', avatar: '🎯', level: 10 },
    tags: ['创业', 'AI'],
    stats: { views: 890, likes: 156, comments: 67 },
  },
]

const typeConfig = {
  offer: { label: '我来讲', bg: 'bg-gradient-offer', icon: '🎤' },
  demand: { label: '想听', bg: 'bg-gradient-demand', icon: '👂' },
  project: { label: '项目', bg: 'bg-gradient-project', icon: '🚀' },
}

export default function Plaza() {
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="space-y-6">
      {/* Tab 切换栏 */}
      <div className="bg-white rounded-2xl p-2 shadow-sm">
        <div className="flex items-center space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 话题列表 - 瀑布流布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer hover:scale-105"
          >
            {/* 封面 */}
            <div className={`${typeConfig[topic.type].bg} h-40 flex items-center justify-center relative`}>
              <span className="text-6xl">{topic.cover}</span>
              {/* 类型标识 */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                <span>{typeConfig[topic.type].icon}</span>
                <span className="text-sm font-medium">{typeConfig[topic.type].label}</span>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-4 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{topic.title}</h3>

              {/* 作者信息 */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{topic.author.avatar}</span>
                <span className="text-sm text-gray-600 flex-1">{topic.author.name}</span>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg font-bold">
                  LV{topic.author.level}
                </span>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2">
                {topic.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 统计信息 */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>❤️ {topic.stats.likes}</span>
                <span>💬 {topic.stats.comments}</span>
                <span>👀 {topic.stats.views}</span>
              </div>

              {/* 想听进度条 */}
              {topic.stats.wantCount && (
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-xl">
                  <p className="text-sm text-pink-600 font-bold text-center">
                    {topic.stats.wantCount}/15人想听
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

