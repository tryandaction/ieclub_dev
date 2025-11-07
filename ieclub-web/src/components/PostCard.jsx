import { Link } from 'react-router-dom'

const typeConfig = {
  offer: { label: '我来讲', bg: 'bg-gradient-offer', icon: '🎤' },
  demand: { label: '想听', bg: 'bg-gradient-demand', icon: '👂' },
  project: { label: '项目', bg: 'bg-gradient-project', icon: '🚀' },
}

export default function PostCard({ post }) {
  const config = typeConfig[post.type || post.topicType] || typeConfig.offer
  
  return (
    <Link 
      to={`/topic/${post.id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
    >
      <div className="p-4">
        {/* 类型标签 */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-white text-sm ${config.bg}`}>
            {config.icon} {config.label}
          </span>
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* 内容预览 */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {post.content || post.description}
        </p>

        {/* 统计信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>👁 {post.viewCount || post.stats?.views || 0}</span>
          <span>❤️ {post.likeCount || post.stats?.likes || 0}</span>
          <span>💬 {post.commentCount || post.stats?.comments || 0}</span>
          {post.createdAt && (
            <span className="ml-auto text-xs">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

