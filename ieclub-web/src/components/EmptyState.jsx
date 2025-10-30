/**
 * 空状态组件 - 用于显示无数据、无结果等情况
 */
export default function EmptyState({
  icon = '📭',
  title = '暂无内容',
  description = '',
  action,
  actionText = '立即创建'
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 图标 */}
      <div className="text-7xl mb-6 opacity-50">
        {icon}
      </div>

      {/* 标题 */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className="text-gray-500 text-center max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {action && (
        <button
          onClick={action}
          className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

/**
 * 预定义的空状态
 */
export const EmptyStates = {
  NoTopics: (props) => (
    <EmptyState
      icon="💬"
      title="还没有话题"
      description="快来发布第一个话题吧！"
      {...props}
    />
  ),
  
  NoActivities: (props) => (
    <EmptyState
      icon="📅"
      title="暂无活动"
      description="敬请期待即将到来的精彩活动"
      {...props}
    />
  ),
  
  NoSearchResults: (props) => (
    <EmptyState
      icon="🔍"
      title="未找到相关内容"
      description="试试其他关键词吧"
      {...props}
    />
  ),
  
  NoNotifications: (props) => (
    <EmptyState
      icon="🔔"
      title="暂无通知"
      description="有新消息时会在这里显示"
      {...props}
    />
  ),
  
  NetworkError: (props) => (
    <EmptyState
      icon="📡"
      title="网络连接失败"
      description="请检查网络连接后重试"
      actionText="重新加载"
      {...props}
    />
  ),
  
  ServerError: (props) => (
    <EmptyState
      icon="⚠️"
      title="服务器错误"
      description="服务器出了点小问题，请稍后再试"
      actionText="重新加载"
      {...props}
    />
  )
}

