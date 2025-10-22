// frontend/src/pages/notifications/index.jsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DefaultAvatarIcon } from '../../components/CustomIcons';
import './index.scss';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 设置当前 TabBar 选中项 - 在小程序中通常自动管理
  useEffect(() => {
    // TabBar选中状态在小程序环境中由框架自动管理
    // 这里可以添加其他页面初始化逻辑
    console.log('通知页面加载完成');
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = Taro.getStorageSync('token');
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          Taro.navigateTo({
            url: '/pages/login/index'
          });
        }, 1500);
        return;
      }

      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/notifications`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.code === 200) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = Taro.getStorageSync('token');
      await Taro.request({
        url: `${process.env.TARO_APP_API}/notifications/${notificationId}/read`,
        method: 'PUT',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      // 刷新列表
      fetchNotifications();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = Taro.getStorageSync('token');
      await Taro.request({
        url: `${process.env.TARO_APP_API}/notifications/read-all`,
        method: 'PUT',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      Taro.showToast({
        title: '已全部标记为已读',
        icon: 'success'
      });

      fetchNotifications();
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      like: '👍',
      heart: '❤️',
      comment: '💬',
      follow: '👤',
      system: '📢',
      topic_threshold: '🎉'
    };
    return iconMap[type] || '📢';
  };

  const renderNotification = (notification: any) => (
    <View
      key={notification.id}
      className={`notification-item ${notification.isRead ? '' : 'unread'}`}
      onClick={() => markAsRead(notification.id)}
    >
      <View className='notification-icon'>
        {getNotificationIcon(notification.type)}
      </View>
      <View className='notification-content'>
        <View className='notification-text'>{notification.content}</View>
        <View className='notification-time'>
          {new Date(notification.createdAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </View>
      </View>
      {!notification.isRead && <View className='unread-dot'></View>}
    </View>
  );

  return (
    <View className='notifications-page'>
      <View className='header'>
        <View className='header-title'>通知</View>
        {unreadCount > 0 && (
          <View className='mark-all-btn' onClick={markAllAsRead}>
            全部已读
          </View>
        )}
      </View>

      <ScrollView className='notifications-scroll' scrollY>
        {loading ? (
          <View className='loading'>
            <View className='loading-spinner'></View>
            <View className='loading-text'>加载中...</View>
          </View>
        ) : notifications.length > 0 ? (
          <View className='notifications-list'>
            {notifications.map(renderNotification)}
          </View>
        ) : (
          <View className='empty-state'>
            <View className='empty-icon'>🔔</View>
            <View className='empty-text'>暂无通知</View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationsPage;