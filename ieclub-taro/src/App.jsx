import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';

// 导入 AuthProvider
import { AuthProvider } from './store/AuthContext.jsx';

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

// 主布局组件 - 包含导航栏和侧边栏
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
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
    <AuthProvider>
      <HashRouter>
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
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
