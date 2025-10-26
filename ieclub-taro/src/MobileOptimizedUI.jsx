import React, { useState, useEffect } from 'react';
import Icon from './components/common/Icon.jsx';
import BottomNavBar from './components/layout/BottomNavBar.jsx';
import PublishModal from './components/common/PublishModal.jsx';

// 导入页面组件
import PlazaPage from './pages/plaza/PlazaPage.jsx';
import CommunityPage from './pages/community/CommunityPage.jsx';
import { EventsPage } from './pages/events/EventsPage.jsx';
import { ProfilePage } from './pages/profile/ProfilePage.jsx';
import { BookmarksPage } from './pages/bookmarks/BookmarksPage.jsx';
import { SettingsPage } from './pages/settings/SettingsPage.jsx';

export default function MobileOptimizedUI() {
  const [currentPage, setCurrentPage] = useState('plaza');
  const [isMobile, setIsMobile] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理页面切换
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 移动端顶部导航栏
  const MobileTopNav = () => (
    <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 z-40 safe-area-top">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          IEclub
        </h1>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Icon icon="search" size="md" color="#374151" />
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-full relative"
          >
            <Icon icon="notification" size="md" color="#374151" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </div>
  );

  // 桌面端侧边栏
  const DesktopSidebar = () => (
    <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 overflow-y-auto z-30">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
          🎓 IEclub
        </h1>
        <nav className="space-y-2">
          {[
            { id: 'plaza', icon: 'home', label: '话题广场' },
            { id: 'community', icon: 'users', label: '社区' },
            { id: 'events', icon: 'calendar', label: '活动' },
            { id: 'bookmarks', icon: 'bookmark', label: '收藏' },
            { id: 'profile', icon: 'user', label: '我的' },
            { id: 'settings', icon: 'settings', label: '设置' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon 
                icon={item.icon} 
                size="md"
                color={currentPage === item.id ? '#8B5CF6' : '#374151'}
              />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* 发布按钮 */}
        <button
          onClick={() => setShowPublishModal(true)}
          className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Icon icon="publish" size="md" color="#ffffff" />
          <span>发布</span>
        </button>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50">
      {/* 桌面端侧边栏 */}
      <DesktopSidebar />

      {/* 移动端顶部导航 */}
      {isMobile && <MobileTopNav />}

      {/* 主内容区 */}
      <div className={`${isMobile ? '' : 'md:ml-64'}`}>
        <div className="max-w-6xl mx-auto">
          {currentPage === 'plaza' && <PlazaPage />}
          {currentPage === 'community' && <CommunityPage />}
          {currentPage === 'events' && <EventsPage />}
          {currentPage === 'profile' && <ProfilePage />}
          {currentPage === 'bookmarks' && <BookmarksPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </div>

      {/* 移动端底部导航 */}
      {isMobile && (
        <BottomNavBar 
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPublishClick={() => setShowPublishModal(true)}
        />
      )}

      {/* 发布模态框 */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
      />
    </div>
  );
}