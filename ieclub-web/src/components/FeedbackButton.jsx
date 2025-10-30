import { useState } from 'react'
import { message } from '../utils/message'

/**
 * 反馈按钮组件 - 收集用户反馈
 */
export default function FeedbackButton() {
  const [show, setShow] = useState(false)
  const [type, setType] = useState('bug') // bug, feature, other
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const types = [
    { value: 'bug', label: '错误反馈', icon: '🐛' },
    { value: 'feature', label: '功能建议', icon: '💡' },
    { value: 'other', label: '其他反馈', icon: '💬' }
  ]

  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('请输入反馈内容')
      return
    }

    setSubmitting(true)
    
    try {
      // 这里可以调用后端API保存反馈
      // await api.submitFeedback({ type, content })
      
      // 临时方案：保存到localStorage
      const feedbacks = JSON.parse(localStorage.getItem('user_feedbacks') || '[]')
      feedbacks.push({
        id: Date.now(),
        type,
        content,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
      localStorage.setItem('user_feedbacks', JSON.stringify(feedbacks))
      
      message.success('感谢您的反馈！我们会认真处理')
      setShow(false)
      setContent('')
      setType('bug')
    } catch (error) {
      console.error('提交反馈失败:', error)
      message.error('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setShow(true)}
        className="fixed right-6 bottom-24 z-40 w-14 h-14 bg-gradient-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        title="意见反馈"
      >
        <span className="text-2xl">💬</span>
      </button>

      {/* 反馈表单弹窗 */}
      {show && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center p-4"
          onClick={() => setShow(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full sm:max-w-md shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">意见反馈</h3>
              <button
                onClick={() => setShow(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 内容 */}
            <div className="px-6 py-4 space-y-4">
              {/* 类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  反馈类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {types.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all text-sm ${
                        type === t.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{t.icon}</div>
                      <div className="font-medium">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 反馈内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细描述
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请详细描述您遇到的问题或建议..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {content.length}/500
                </p>
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="w-full py-3 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

