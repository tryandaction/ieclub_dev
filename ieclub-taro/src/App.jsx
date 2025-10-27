import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

// 导入 AuthProvider
import { AuthProvider } from './store/AuthContext.jsx';
// 导入全局组件
import { ToastProvider } from './components/common/Toast.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// 导入移动端优化的UI组件
import MobileOptimizedUI from './MobileOptimizedUI.jsx';

// 导入路由配置
import { routes } from './router';
import { RouteGuard } from './router/RouteGuard.jsx';
import { PageTransition } from './router/PageTransition.jsx';

// 导入布局组件
import { Navbar } from './components/layout/Navbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';


// ==================== 状态管理 ====================
// 移至src/store/AuthContext.jsx

// ==================== 通用组件 ====================
// 移至src/components/common/ 目录下

// ==================== 布局组件 ====================
// 移至src/components/layout/ 目录下

// ==================== 认证页面 ====================
// 移至src/pages/auth/ 目录下

// ==================== 帖子组件 ====================
// 移至src/components/post/PostCard.jsx
// 移至src/components/post/CreatePostModal.jsx

// ==================== 首页 ====================
// 移至src/pages/home/HomePage.jsx

// ==================== 活动页面 ====================
// 移至src/pages/events/ 目录下

// ==================== 兴趣匹配页面 ====================
// 移至src/pages/match/ 目录下

// ==================== 个人主页 ====================
// 移至src/pages/profile/ 目录下

// ==================== 排行榜页面 ====================
// 移至src/pages/leaderboard/LeaderboardPage.jsx

// ==================== 收藏页面 ====================
// 移至src/pages/bookmarks/BookmarksPage.jsx

// ==================== 设置页面 ====================
// 移至src/pages/settings/SettingsPage.jsx




// ==================== 主应用 ====================

// 主布局组件 - 参考小红书左侧固定导航
const MainLayout = () => {
  const [showPublishModal, setShowPublishModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端顶部导航栏 */}
      <div className="lg:hidden">
        <Navbar />
      </div>
      
      {/* 桌面端左侧固定导航 */}
      <Sidebar onPublishClick={() => setShowPublishModal(true)} />
      
      {/* 主内容区域 - 适配左侧导航 */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* 发布模态框（TODO: 实现） */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">发布内容</h2>
              <button 
                onClick={() => setShowPublishModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600">发布功能正在开发中...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. 定义主应用组件，它现在是路由配置中心
function App() {
  const [isMobile, setIsMobile] = useState(false);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            {isMobile ? (
              // 移动端使用优化的UI
              <MobileOptimizedUI />
            ) : (
              // 桌面端使用配置化的路由
              <Routes>
                {routes.map((route, index) => {
                  const { path, element, title, requireAuth, layout } = route;
                  
                  // 包装元素：添加路由守卫和页面过渡
                  const guardedElement = (
                    <RouteGuard requireAuth={requireAuth} title={title}>
                      {element}
                    </RouteGuard>
                  );

                  // 不需要布局的页面（如登录、注册）
                  if (!layout) {
                    return (
                      <Route
                        key={index}
                        path={path}
                        element={<PageTransition>{guardedElement}</PageTransition>}
                      />
                    );
                  }

                  // 需要布局的页面
                  return null; // 将在下面的MainLayout中处理
                })}

                {/* 使用主布局的页面 */}
                <Route path="/" element={<MainLayout />}>
                  {routes
                    .filter((route) => route.layout)
                    .map((route, index) => {
                      const { path, element, title, requireAuth } = route;
                      
                      const guardedElement = (
                        <RouteGuard requireAuth={requireAuth} title={title}>
                          {element}
                        </RouteGuard>
                      );

                      // 首页使用index route
                      if (path === '/') {
                        return <Route key={index} index element={guardedElement} />;
                      }

                      return (
                        <Route key={index} path={path} element={guardedElement} />
                      );
                    })}
                </Route>
              </Routes>
            )}
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
