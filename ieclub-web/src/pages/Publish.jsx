import { useState } from 'react'

const typeOptions = [
  { id: 'offer', label: '我来讲', icon: '🎤', bg: 'bg-gradient-offer' },
  { id: 'demand', label: '想听', icon: '👂', bg: 'bg-gradient-demand' },
  { id: 'project', label: '项目', icon: '🚀', bg: 'bg-gradient-project' },
]

export default function Publish() {
  const [publishType, setPublishType] = useState('offer')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handlePublish = () => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }
    if (!description.trim()) {
      alert('请输入描述')
      return
    }
    alert('发布成功！')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">发布内容</h1>
        <p className="text-white/90">分享你的知识与想法</p>
      </div>

      {/* 类型选择 */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">选择类型</h2>
        <div className="grid grid-cols-3 gap-4">
          {typeOptions.map((type) => (
            <button
              key={type.id}
              onClick={() => setPublishType(type.id)}
              className={`p-6 rounded-xl border-2 transition-all ${
                publishType === type.id
                  ? `${type.bg} text-white border-transparent shadow-lg scale-105`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-4xl mb-2">{type.icon}</div>
              <div className="font-bold">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 表单 */}
      <div className="card space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            详细描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细说明你的内容..."
            rows={8}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <button
          onClick={handlePublish}
          className="w-full bg-gradient-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
        >
          发布
        </button>
      </div>
    </div>
  )
}

