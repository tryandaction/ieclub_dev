import { useEffect } from 'react'

/**
 * 操作菜单组件 - 底部弹出菜单
 */
export default function ActionSheet({ show, onClose, title, actions = [] }) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  if (!show) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* 菜单内容 */}
      <div 
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 text-center">{title}</h3>
          </div>
        )}

        {/* 操作列表 */}
        <div className="py-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick?.()
                onClose()
              }}
              disabled={action.disabled}
              className={`w-full px-6 py-4 text-left transition-colors ${
                action.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : action.primary
                  ? 'text-primary-600 font-medium hover:bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                {action.icon && <span className="text-xl">{action.icon}</span>}
                <span>{action.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* 取消按钮 */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
          >
            取消
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

