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

// 话题卡片骨架屏
export const TopicCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    {/* 类型标签 */}
    <div className="flex items-center justify-between mb-4">
      <SkeletonBase className="h-8 w-24 rounded-full" />
      <SkeletonBase className="h-5 w-16" />
    </div>

    {/* 标题 */}
    <SkeletonBase className="h-7 w-3/4 mb-3" />

    {/* 作者信息 */}
    <div className="flex items-center space-x-3 mb-4">
      <SkeletonBase className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-3 w-32" />
      </div>
    </div>

    {/* 标签 */}
    <div className="flex space-x-2 mb-4">
      <SkeletonBase className="h-6 w-16 rounded-full" />
      <SkeletonBase className="h-6 w-20 rounded-full" />
    </div>

    {/* 统计信息 */}
    <div className="flex items-center justify-between">
      <div className="flex space-x-4">
        <SkeletonBase className="h-5 w-12" />
        <SkeletonBase className="h-5 w-12" />
      </div>
      <SkeletonBase className="h-9 w-20 rounded-full" />
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

// 活动卡片骨架屏
export const ActivityCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    {/* 封面图 */}
    <SkeletonBase className="h-48 w-full rounded-none" />
    
    <div className="p-6 space-y-4">
      {/* 标题 */}
      <SkeletonBase className="h-6 w-3/4" />
      
      {/* 时间和地点 */}
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-1/2" />
        <SkeletonBase className="h-4 w-2/3" />
      </div>
      
      {/* 标签和状态 */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <SkeletonBase className="h-6 w-16 rounded-full" />
          <SkeletonBase className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBase className="h-6 w-20 rounded-full" />
      </div>
      
      {/* 参与信息 */}
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-4 w-32" />
        <SkeletonBase className="h-9 w-24 rounded-lg" />
      </div>
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

// 列表骨架屏 - 用于多个卡片的加载
export const TopicListSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <TopicCardSkeleton key={index} />
    ))}
  </div>
)

export const ActivityListSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

