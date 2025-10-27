import React from 'react';
import Icon from './Icon';

/**
 * Loading 加载组件
 * 用于显示加载状态
 */
export const Loading = ({ 
  size = 'md',
  color = 'primary',
  text = '加载中...',
  fullscreen = false
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const colors = {
    primary: 'text-purple-600',
    secondary: 'text-pink-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  const loadingContent = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} ${colors[color]} animate-spin`}>
        <Icon icon="mdi:loading" size="full" />
      </div>
      {text && (
        <p className={`${colors[color]} text-sm font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {loadingContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {loadingContent}
    </div>
  );
};

// 默认导出
export default Loading;

