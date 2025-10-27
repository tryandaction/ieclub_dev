/**
 * 通知中心页面
 * 显示用户的所有通知
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/common/Avatar.jsx';
import Loading from '../../components/common/Loading.jsx';
import Icon from '../../components/common/Icon.jsx';
import api from '../../services/api.js';
import { Bell, CheckCheck, Trash2, MessageCircle, Heart, UserPlus, Award } from 'lucide-react';

/**
 * 通知类型图标映射
 */
const getNotificationIcon = (type) => {
  const icons = {
    comment: { icon: MessageCircle, color: '#3B82F6' },
    like: { icon: Heart, color: '#EF4444' },
    follow: { icon: UserPlus, color: '#8B5CF6' },
    achievement: { icon: Award, color: '#F59E0B' },
    system: { icon: Bell, color: '#6B7280' }
  };
  return icons[type] || icons.system;
};

/**
 * 通知项组件
 */
const NotificationItem = ({ notification, onRead, onDelete, onClick }) => {
  const iconConfig = getNotificationIcon(notification.type);
  const IconComponent = iconConfig.icon;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
        notification.isRead
          ? 'bg-white border-gray-200 hover:bg-gray-50'
          : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:shadow-md'
      }`}
    >
      {/* 未读标识 */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></div>
      )}

      <div className="flex items-start gap-3">
        {/* 头像或图标 */}
        <div className="flex-shrink-0">
          {notification.sender?.avatar ? (
            <Avatar
              src={notification.sender.avatar}
              name={notification.sender.name}
              size="md"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${iconConfig.color}20` }}
            >
              <IconComponent size={20} color={iconConfig.color} />
            </div>
          )}
        </div>

        {/* 通知内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.sender?.name && (
                <span className="font-bold">{notification.sender.name} </span>
              )}
              {notification.title}
            </p>
          </div>

          {notification.content && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {notification.content}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatTime(notification.createdAt)}
            </span>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead(notification.id);
                  }}
                  className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                  title="标记为已读"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 格式化时间
 */
const formatTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return time.toLocaleDateString('zh-CN');
  }
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
};

/**
 * 通知中心页面组件
 */
const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [unreadCount, setUnreadCount] = useState(0);

  // 加载通知列表
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getList();
      if (response.success) {
        setNotifications(response.data || []);
        const unread = response.data?.filter(n => !n.isRead).length || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('获取通知列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记为已读
  const handleMarkAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 全部标记为已读
  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  // 删除通知
  const handleDelete = async (id) => {
    try {
      await api.notifications.delete(id);
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  // 点击通知
  const handleNotificationClick = async (notification) => {
    // 标记为已读
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // 跳转到相应页面
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // 筛选通知
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell size={24} className="text-purple-600" />
                通知中心
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  你有 <span className="font-bold text-purple-600">{unreadCount}</span> 条未读通知
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                全部已读
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            全部 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            未读 ({unreadCount})
          </button>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="max-w-4xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" text="加载中..." />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {filter === 'unread' ? '没有未读通知' : '暂无通知'}
            </h3>
            <p className="text-sm text-gray-500">
              {filter === 'unread'
                ? '所有通知都已读取'
                : '当有人点赞、评论或关注你时，会在这里显示'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

