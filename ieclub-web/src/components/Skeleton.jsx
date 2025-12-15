/**
 * 骨架屏组件
 * 用于优化页面加载体验
 */

// 基础骨架屏元素
export const SkeletonBase = ({ className = '', animate = true }) => (
  <div
    className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
  />
)

// 话题卡片骨架屏 - 响应式
export const TopicCardSkeleton = () => (
  <div className="bg-white rounded-resp-lg overflow-hidden shadow-sm">
    {/* 封面 */}
    <SkeletonBase className="aspect-[4/3] w-full rounded-none" />
    
    {/* 内容 */}
    <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
      {/* 标题 */}
      <SkeletonBase className="h-4 sm:h-5 w-3/4" />
      <SkeletonBase className="h-4 sm:h-5 w-1/2" />

      {/* 作者信息 */}
      <div className="flex items-center gap-1.5">
        <SkeletonBase className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" />
        <SkeletonBase className="h-3 w-16" />
        <SkeletonBase className="h-4 w-8 rounded-full" />
      </div>

      {/* 标签 */}
      <div className="flex gap-1">
        <SkeletonBase className="h-4 w-10 rounded-full" />
        <SkeletonBase className="h-4 w-12 rounded-full" />
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <SkeletonBase className="h-3 w-8" />
          <SkeletonBase className="h-3 w-8" />
        </div>
        <SkeletonBase className="h-6 w-12 rounded-full" />
      </div>
    </div>
  </div>
)

// 评论骨架屏
export const CommentSkeleton = () => (
  <div className="p-4 border-b border-gray-100">
    <div className="flex space-x-3">
      {/* 头像 */}
      <SkeletonBase className="h-10 w-10 rounded-full flex-shrink-0" />
      
      <div className="flex-1 space-y-3">
        {/* 用户名和时间 */}
        <div className="flex items-center space-x-2">
          <SkeletonBase className="h-4 w-20" />
          <SkeletonBase className="h-3 w-24" />
        </div>
        
        {/* 评论内容 */}
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-4/5" />
        
        {/* 操作按钮 */}
        <div className="flex space-x-4">
          <SkeletonBase className="h-6 w-12" />
          <SkeletonBase className="h-6 w-12" />
        </div>
      </div>
    </div>
  </div>
)

// 活动卡片骨架屏 - 响应式
export const ActivityCardSkeleton = () => (
  <div className="bg-white rounded-resp-lg shadow-sm overflow-hidden">
    {/* 封面图 */}
    <SkeletonBase className="aspect-[4/3] w-full rounded-none" />
    
    <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-3">
      {/* 状态标签 */}
      <SkeletonBase className="h-4 w-14 rounded-full" />
      
      {/* 标题 */}
      <SkeletonBase className="h-4 sm:h-5 w-3/4" />
      
      {/* 时间和地点 */}
      <div className="space-y-1">
        <SkeletonBase className="h-3 w-2/3" />
        <SkeletonBase className="h-3 w-1/2" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
      
      {/* 报名按钮 */}
      <SkeletonBase className="h-8 sm:h-10 w-full rounded-resp" />
    </div>
  </div>
)

// 详情页骨架屏
export const TopicDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    {/* 返回按钮 */}
    <SkeletonBase className="h-10 w-20" />
    
    {/* 主内容区 */}
    <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
      {/* 类型标签 */}
      <SkeletonBase className="h-8 w-24 rounded-full" />
      
      {/* 标题 */}
      <SkeletonBase className="h-10 w-2/3" />
      
      {/* 作者信息 */}
      <div className="flex items-center space-x-4 pb-6 border-b">
        <SkeletonBase className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-5 w-24" />
          <SkeletonBase className="h-4 w-32" />
        </div>
        <SkeletonBase className="h-9 w-20 rounded-lg" />
      </div>
      
      {/* 内容 */}
      <div className="space-y-3">
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-5/6" />
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-4/5" />
      </div>
      
      {/* 操作栏 */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex space-x-4">
          <SkeletonBase className="h-10 w-24" />
          <SkeletonBase className="h-10 w-24" />
          <SkeletonBase className="h-10 w-24" />
        </div>
      </div>
    </div>
    
    {/* 评论区标题 */}
    <div className="bg-white rounded-2xl p-6">
      <SkeletonBase className="h-7 w-32 mb-6" />
      
      {/* 评论列表 */}
      {[1, 2, 3].map((i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  </div>
)

// 列表骨架屏 - 小红书风格双列布局
export const TopicListSkeleton = ({ count = 6 }) => (
  <div className="card-grid">
    {Array.from({ length: count }).map((_, index) => (
      <TopicCardSkeleton key={index} />
    ))}
  </div>
)

export const ActivityListSkeleton = ({ count = 6 }) => (
  <div className="card-grid">
    {Array.from({ length: count }).map((_, index) => (
      <ActivityCardSkeleton key={index} />
    ))}
  </div>
)

export const CommentListSkeleton = ({ count = 3 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, index) => (
      <CommentSkeleton key={index} />
    ))}
  </div>
)

// 用户卡片骨架屏 - 响应式
export const UserCardSkeleton = () => (
  <div className="card text-center space-y-2 sm:space-y-3">
    {/* 头像 */}
    <div className="flex justify-center">
      <SkeletonBase className="h-14 w-14 sm:h-16 sm:w-16 rounded-full" />
    </div>
    
    {/* 昵称 */}
    <SkeletonBase className="h-4 w-20 mx-auto" />
    
    {/* 简介 */}
    <SkeletonBase className="h-3 w-3/4 mx-auto" />
    
    {/* 统计 */}
    <div className="flex items-center justify-center gap-2">
      <SkeletonBase className="h-3 w-10" />
      <SkeletonBase className="h-3 w-10" />
    </div>
    
    {/* 关注按钮 */}
    <SkeletonBase className="h-8 sm:h-10 w-full rounded-resp" />
  </div>
)

// 小组卡片骨架屏
export const GroupCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
    <div className="flex items-center space-x-4">
      {/* 图标 */}
      <SkeletonBase className="h-16 w-16 rounded-2xl" />
      
      <div className="flex-1 space-y-2">
        {/* 名称 */}
        <SkeletonBase className="h-6 w-32" />
        {/* 分类 */}
        <SkeletonBase className="h-4 w-20" />
      </div>
    </div>
    
    {/* 描述 */}
    <SkeletonBase className="h-4 w-full" />
    <SkeletonBase className="h-4 w-4/5" />
    
    {/* 底部信息 */}
    <div className="flex items-center justify-between pt-2">
      <SkeletonBase className="h-5 w-20" />
      <SkeletonBase className="h-9 w-20 rounded-lg" />
    </div>
  </div>
)

// 个人中心骨架屏
export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6">
    {/* 头部信息 */}
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex items-center space-x-6">
        <SkeletonBase className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <SkeletonBase className="h-8 w-32" />
          <SkeletonBase className="h-4 w-48" />
          <div className="flex space-x-4">
            <SkeletonBase className="h-5 w-20" />
            <SkeletonBase className="h-5 w-20" />
            <SkeletonBase className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
    
    {/* 统计卡片 */}
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center">
          <SkeletonBase className="h-8 w-12 mx-auto mb-2" />
          <SkeletonBase className="h-4 w-16 mx-auto" />
        </div>
      ))}
    </div>
    
    {/* 内容区 */}
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <SkeletonBase className="h-6 w-24 mb-4" />
      <TopicListSkeleton count={2} />
    </div>
  </div>
)

// 消息列表骨架屏
export const MessageListSkeleton = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl p-4 flex items-center space-x-4">
        <SkeletonBase className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonBase className="h-5 w-24" />
            <SkeletonBase className="h-4 w-16" />
          </div>
          <SkeletonBase className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
)

// 通知列表骨架屏
export const NotificationSkeleton = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl p-4 flex items-start space-x-3">
        <SkeletonBase className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-full" />
          <SkeletonBase className="h-4 w-2/3" />
          <SkeletonBase className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
)

// 用户列表骨架屏 - 小红书风格双列
export const UserListSkeleton = ({ count = 8 }) => (
  <div className="card-grid">
    {Array.from({ length: count }).map((_, index) => (
      <UserCardSkeleton key={index} />
    ))}
  </div>
)

// 小组列表骨架屏 - 小红书风格双列
export const GroupListSkeleton = ({ count = 6 }) => (
  <div className="card-grid">
    {Array.from({ length: count }).map((_, index) => (
      <GroupCardSkeleton key={index} />
    ))}
  </div>
)

// 页面级骨架屏包装器
export const PageSkeleton = ({ children, loading, skeleton }) => {
  if (loading) {
    return skeleton
  }
  return children
}

