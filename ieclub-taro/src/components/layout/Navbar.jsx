import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Button } from '../common/Button.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Tooltip } from '../common/Tooltip.jsx';
import { Bell, Search } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const notifications = [
    { id: 1, type: 'like', user: '李思', content: '赞了你的帖子', time: '5分钟前', unread: true },
    { id: 2, type: 'comment', user: '王浩', content: '评论了你的帖子', time: '1小时前', unread: true },
    { id: 3, type: 'follow', user: '陈晓', content: '关注了你', time: '2小时前', unread: false }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-panel')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-40 lg:hidden">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo区域 - 移动端显示 */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="text-2xl transform group-hover:scale-110 transition-transform">🎓</div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IEclub
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* 搜索按钮 */}
            <button 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => navigate('/search')}
            >
              <Search size={20} />
            </button>

            {isAuthenticated ? (
              <>
                {/* 通知按钮 */}
                <button 
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell size={20} />
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                </button>

                {/* 用户头像 */}
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  <Avatar src={user.avatar} size="sm" status="online" />
                </div>
              </>
            ) : (
              <button className="p-2" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                <div className="w-6 h-5 flex flex-col justify-between">
                  <span className="w-full h-0.5 bg-gray-600 rounded"></span>
                  <span className="w-full h-0.5 bg-gray-600 rounded"></span>
                  <span className="w-full h-0.5 bg-gray-600 rounded"></span>
                </div>
              </button>
            )}
          </div>
        </div>

        {showMobileMenu && (
          <div className="mt-4 pb-4 border-t pt-4 animate-slideDown">
            {!isAuthenticated && (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="flex-1">登录</Button>
                <Button variant="primary" onClick={() => navigate('/register')} className="flex-1">注册</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};