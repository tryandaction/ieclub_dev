/**
 * 骨架屏卡片组件
 * 用于加载状态的占位符
 */
import React from 'react';

export const SkeletonCard = ({ variant = 'topic' }) => {
  if (variant === 'topic') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
        {/* 封面骨架 */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300"></div>
        
        {/* 底部信息骨架 */}
        <div className="p-3 space-y-2">
          {/* 作者信息 */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200"></div>
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
          </div>
          
          {/* 互动数据 */}
          <div className="flex items-center gap-4">
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'event') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
        {/* 头部骨架 */}
        <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300"></div>
        
        {/* 内容骨架 */}
        <div className="p-4 space-y-3">
          <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (variant === 'community') {
    return (
      <div className="bg-white rounded-2xl p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="flex gap-2 mt-3">
              <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 默认骨架
  return (
    <div className="bg-white rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * 骨架屏网格
 * 用于展示多个加载状态的卡片
 */
export const SkeletonGrid = ({ count = 6, variant = 'topic' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </div>
  );
};

export default SkeletonCard;

