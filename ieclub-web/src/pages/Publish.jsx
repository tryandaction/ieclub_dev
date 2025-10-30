import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTopic } from '../api/topic'
import { showToast } from '../components/Toast'
import ImageUpload from '../components/ImageUpload'

const typeOptions = [
  { id: 'offer', label: '我来讲', icon: '🎤', bg: 'bg-gradient-offer' },
  { id: 'demand', label: '想听', icon: '👂', bg: 'bg-gradient-demand' },
  { id: 'project', label: '项目', icon: '🚀', bg: 'bg-gradient-project' },
]

export default function Publish() {
  const navigate = useNavigate()
  const [publishType, setPublishType] = useState('offer')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    // 验证
    if (!title.trim()) {
      showToast('请输入标题', 'warning')
      return
    }
    if (!description.trim()) {
      showToast('请输入描述', 'warning')
      return
    }

    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('需要登录后才能发布', 'warning')
      setTimeout(() => navigate('/login'), 1500)
      return
    }

    try {
      setLoading(true)
      
      // 处理标签
      const tagArray = tags
        .split(/[,，\s]+/)
        .filter(tag => tag.trim())
        .map(tag => tag.trim())

      // 调用API
      await createTopic({
        type: publishType,
        title: title.trim(),
        description: description.trim(),
        tags: tagArray,
        images: images.map(img => img.url), // 传递图片URL数组
      })

      showToast('发布成功！🎉', 'success')
      
      // 清空表单
      setTitle('')
      setDescription('')
      setTags('')
      setImages([])
      
      // 跳转到广场
      setTimeout(() => navigate('/plaza'), 1000)
    } catch (error) {
      console.error('发布失败:', error)
      showToast(error.response?.data?.message || '发布失败，请稍后重试', 'error')
    } finally {
      setLoading(false)
    }
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

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            标签
            <span className="ml-2 text-xs text-gray-500 font-normal">（用逗号或空格分隔，选填）</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：Python, 机器学习, 期末复习"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {tags && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.split(/[,，\s]+/).filter(tag => tag.trim()).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 图片上传 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            上传图片
            <span className="ml-2 text-xs text-gray-500 font-normal">（选填，最多9张）</span>
          </label>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxCount={9}
            maxSize={5}
          />
        </div>

        <button
          onClick={handlePublish}
          disabled={loading}
          className={`w-full bg-gradient-primary text-white py-4 rounded-xl font-bold text-lg transition-all ${
            loading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-lg hover:scale-105'
          }`}
        >
          {loading ? '发布中...' : '发布'}
        </button>
      </div>
    </div>
  )
}

