import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from '../utils/toast'
import { InlineLoading } from '../components/Loading'

/**
 * 反馈页面
 */
export default function Feedback() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'bug',
    title: '',
    content: '',
    contact: '',
    images: []
  })

  const feedbackTypes = [
    { value: 'bug', label: '🐛 Bug反馈', desc: '报告遇到的问题和错误' },
    { value: 'feature', label: '✨ 功能建议', desc: '建议新功能或改进' },
    { value: 'improvement', label: '💡 体验优化', desc: '提升用户体验的建议' },
    { value: 'other', label: '💬 其他反馈', desc: '其他意见和建议' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (formData.images.length + files.length > 5) {
      toast.error('最多上传5张截图')
      return
    }

    try {
      setLoading(true)
      const uploadFormData = new FormData()
      files.forEach(file => {
        uploadFormData.append('images', file)
      })

      const res = await api.post('/upload/images', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...res.data]
      }))

      toast.success('图片上传成功')
    } catch (error) {
      console.error('上传失败:', error)
      toast.error(error.response?.data?.message || '图片上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 验证
    if (!formData.title.trim()) {
      toast.error('请输入反馈标题')
      return
    }

    if (formData.title.length < 5) {
      toast.error('标题至少5个字符')
      return
    }

    if (!formData.content.trim()) {
      toast.error('请输入反馈内容')
      return
    }

    if (formData.content.length < 10) {
      toast.error('内容至少10个字符')
      return
    }

    try {
      setLoading(true)
      
      await api.post('/feedback', {
        ...formData,
        platform: 'web',
        version: '2.0.0',
        deviceInfo: {
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language
        }
      })

      toast.success('反馈提交成功！感谢您的宝贵意见')
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        navigate('/feedback/my')
      }, 1500)
      
    } catch (error) {
      console.error('提交失败:', error)
      toast.error(error.response?.data?.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">问题反馈</h1>
        <p className="text-gray-600">
          感谢您的反馈！我们会认真对待每一条意见，不断改进产品体验。
        </p>
      </div>

      {/* 反馈表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        {/* 反馈类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            反馈类型 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedbackTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.type === type.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium mb-1">{type.label}</div>
                <div className="text-sm text-gray-500">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 反馈标题 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            反馈标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="简要描述您遇到的问题或建议（5-100字符）"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.title.length}/100
          </div>
        </div>

        {/* 详细描述 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            详细描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="请详细描述问题或建议，包括：&#10;1. 遇到问题的具体场景&#10;2. 预期的效果&#10;3. 实际的情况&#10;4. 其他补充信息（10-2000字符）"
            rows={8}
            maxLength={2000}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.content.length}/2000
          </div>
        </div>

        {/* 上传截图 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            上传截图（可选，最多5张）
          </label>
          
          {/* 已上传的图片 */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3">
              {formData.images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`截图${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 上传按钮 */}
          {formData.images.length < 5 && (
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  点击上传截图
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  支持 JPG、PNG、GIF，单张最大5MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 联系方式 */}
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
            联系方式（可选）
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="如需回复，请留下邮箱或QQ"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            如果需要我们联系您，请留下联系方式
          </p>
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading && <InlineLoading size="sm" />}
            {loading ? '提交中...' : '提交反馈'}
          </button>
        </div>
      </form>

      {/* 温馨提示 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <h3 className="font-medium text-blue-900 mb-2">💡 温馨提示</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 请尽量详细描述问题，这将帮助我们更快地定位和解决</li>
          <li>• 建议附上截图，以便更直观地了解问题</li>
          <li>• 我们会在1-3个工作日内处理您的反馈</li>
          <li>• 您可以在&ldquo;我的反馈&rdquo;中查看处理进度</li>
        </ul>
      </div>
    </div>
  )
}

