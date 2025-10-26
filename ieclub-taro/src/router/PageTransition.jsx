/**
 * 页面过渡动画组件
 * 提供页面切换时的动画效果
 */
import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 加载中占位组件
 */
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600">加载中...</p>
    </div>
  </div>
);

/**
 * 页面过渡动画容器
 * @param {ReactNode} children - 子组件
 */
export const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoading />}>
      <div
        key={location.pathname}
        className="animate-fadeIn"
      >
        {children}
      </div>
    </Suspense>
  );
};

export default PageTransition;

