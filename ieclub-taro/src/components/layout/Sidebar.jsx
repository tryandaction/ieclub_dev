import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Button } from '../common/Button.jsx';
import Icon from '../common/Icon.jsx';

export const Sidebar = ({ onPublishClick }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  // 参考小红书和README：广场、社区、发布、活动、我的
  const menuItems = [
    { id: 'plaza', path: '/', icon: 'home', label: '广场', badge: null, color: '#3b82f6' },
    { id: 'community', path: '/community', icon: 'users', label: '社区', badge: null, color: '#ec4899' },
    { id: 'publish', path: '#', icon: 'publish', label: '发布', isAction: true, color: '#8b5cf6' },
    { id: 'events', path: '/events', icon: 'calendar', label: '活动', badge: null, color: '#10b981' },
    { id: 'profile', path: '/profile', icon: 'user', label: '我的', badge: null, color: '#f59e0b' },
  ];

  const extraMenuItems = [
    { id: 'trending', path: '/trending', icon: 'trending', label: '热门', badge: 'HOT', color: '#f43f5e' },
    { id: 'leaderboard', path: '/leaderboard', icon: 'trophy', label: '排行榜', badge: null, color: '#8b5cf6' },
    { id: 'bookmarks', path: '/bookmarks', icon: 'bookmark', label: '我的收藏', color: '#eab308' },
    { id: 'settings', path: '/settings', icon: 'settings', label: '设置', color: '#64748b' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    onPublishClick?.();
  };

  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
      {/* Logo 区域 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">IE</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">IEclub</h1>
            <p className="text-xs text-gray-500 mt-0.5">创新与交流</p>
          </div>
        </div>
      </div>

      {/* 主导航菜单 - 参考小红书 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {menuItems.map(item => {
            // 发布按钮特殊处理
            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={handlePublish}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-all group"
                >
                  <Icon icon={item.icon} size="md" color="#ffffff" />
                  <span className="text-sm leading-none">{item.label}</span>
                </button>
              );
            }

            // 普通导航项
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${
                    isActive 
                      ? 'bg-purple-50 text-purple-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon icon={item.icon} size="md" color={isActive ? item.color : '#6b7280'} />
                    <span className="text-sm leading-none">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* 额外菜单 */}
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-1">
          {extraMenuItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => 
                `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon icon={item.icon} size="md" color={isActive ? item.color : '#6b7280'} />
                  <span className="text-sm leading-none">{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* 用户信息区域 - 底部 */}
      <div className="p-4 border-t border-gray-100">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <Avatar src={user.avatar} size="sm" status="online" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate text-sm leading-none">{user.username}</p>
                <p className="text-xs text-gray-500 truncate mt-1">{user.major || '学生'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-all"
            >
              <Icon icon="logout" size="sm" color="currentColor" />
              <span className="text-sm">退出登录</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button variant="primary" onClick={() => navigate('/login')} className="w-full">
              登录
            </Button>
            <Button variant="outline" onClick={() => navigate('/register')} className="w-full">
              注册
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};