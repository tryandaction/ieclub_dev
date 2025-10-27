import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Button } from '../common/Button.jsx';
import Icon from '../common/Icon.jsx';

export const Sidebar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'home', path: '/', icon: 'home', label: '首页', badge: null, color: '#667eea' },
    { id: 'trending', path: '/trending', icon: 'trending', label: '热门', badge: 'HOT', color: '#f43f5e' },
    { id: 'events', path: '/events', icon: 'calendar', label: '活动', badge: null, color: '#10b981' },
    { id: 'match', path: '/match', icon: 'users', label: '兴趣匹配', badge: 'NEW', color: '#f59e0b' },
    { id: 'leaderboard', path: '/leaderboard', icon: 'trophy', label: '排行榜', badge: null, color: '#8b5cf6' },
  ];

  const userMenuItems = [
    { id: 'profile', path: '/profile', icon: 'user', label: '我的主页', color: '#3b82f6' },
    { id: 'bookmarks', path: '/bookmarks', icon: 'bookmark', label: '我的收藏', color: '#eab308' },
    { id: 'settings', path: '/settings', icon: 'settings', label: '设置', color: '#64748b' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:block w-56 xl:w-60 space-y-2">
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Avatar src={user.avatar} size="md" status="online" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate text-sm leading-none mb-1">{user.username}</p>
                <p className="text-xs text-gray-500 truncate leading-none">{user.major}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-2.5 border-t">
              <div className="text-center">
                <p className="font-bold text-gray-900 text-sm leading-none mb-1">{user.followers || 0}</p>
                <p className="text-xs text-gray-500 leading-none">粉丝</p>
              </div>
              <div className="text-center border-l border-r">
                <p className="font-bold text-gray-900 text-sm leading-none mb-1">{user.following || 0}</p>
                <p className="text-xs text-gray-500 leading-none">关注</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-sm leading-none mb-1">{user.reputation || 0}</p>
                <p className="text-xs text-gray-500 leading-none">声望</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-3">加入IEclub社区</p>
            <Button variant="primary" onClick={() => navigate('/register')} className="w-full">
              立即注册
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {menuItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `w-full inline-flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all group ${
                isActive 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="inline-flex items-center gap-2.5">
                  <Icon icon={item.icon} size="sm" color={isActive ? '#ffffff' : item.color} />
                  <span className="leading-none text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-purple-600'
                  } leading-none`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {isAuthenticated && (
        <>
          <div className="border-t my-4"></div>
          <div className="space-y-1">
            {userMenuItems.map(item => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => 
                  `w-full inline-flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium bg-white transition-all ${
                    isActive ? 'text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon icon={item.icon} size="sm" color={isActive ? '#8b5cf6' : item.color} />
                    <span className="leading-none text-sm">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium bg-white hover:bg-red-50 text-red-600 transition-all"
            >
              <Icon icon="logout" size="sm" color="#dc2626" />
              <span className="leading-none text-sm">退出登录</span>
            </button>
          </div>
        </>
      )}

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="school" size="sm" color="#8b5cf6" />
          <p className="font-bold text-gray-900 leading-none text-sm">校区交流</p>
        </div>
        <p className="text-xs text-gray-600 mb-2 leading-relaxed">即将支持跨校区、跨学校交流功能</p>
        <Button variant="outline" className="w-full text-xs py-1.5">了解更多</Button>
      </div>
    </aside>
  );
};