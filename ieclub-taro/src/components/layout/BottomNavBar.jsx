/**
 * 移动端底部导航栏
 * 5个Tab: 广场、社区、发布、活动、我的
 */
import React from 'react';
import Icon from '../common/Icon.jsx';

const BottomNavBar = ({ currentPage, onPageChange, onPublishClick }) => {
  const navItems = [
    {
      id: 'plaza',
      path: '/plaza',
      icon: 'home',
      label: '广场',
      activeColor: '#8B5CF6'
    },
    {
      id: 'community',
      path: '/community',
      icon: 'users',
      label: '社区',
      activeColor: '#EC4899'
    },
    {
      id: 'publish',
      path: '#',
      icon: 'publish',
      label: '发布',
      isSpecial: true,
      activeColor: '#F59E0B'
    },
    {
      id: 'events',
      path: '/events',
      icon: 'calendar',
      label: '活动',
      activeColor: '#10B981'
    },
    {
      id: 'profile',
      path: '/profile',
      icon: 'user',
      label: '我的',
      activeColor: '#3B82F6'
    }
  ];

  const handlePublishClick = (e) => {
    e.preventDefault();
    onPublishClick?.();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          // 发布按钮特殊处理
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={handlePublishClick}
                className="flex flex-col items-center justify-center relative -mt-8"
              >
                <div 
                  className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transform transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  }}
                >
                  <Icon icon={item.icon} size="lg" color="#ffffff" />
                </div>
                <span className="text-xs font-medium text-gray-600 mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          // 普通导航项
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange?.(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative ${
                isActive ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                <Icon 
                  icon={item.icon} 
                  size="md" 
                  color={isActive ? item.activeColor : '#9CA3AF'} 
                />
              </div>
              <span className={`text-xs font-medium mt-1 transition-colors ${
                isActive ? 'font-bold' : ''
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div 
                  className="absolute -top-px left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full"
                  style={{ backgroundColor: item.activeColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;

