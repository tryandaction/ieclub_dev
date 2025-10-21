// frontend/src/pages/square/index.jsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DefaultCoverIcon } from '../../components/CustomIcons';
import './index.scss';

// API配置 - 可以根据需要修改服务器地址
const API_CONFIG = {
  // 开发环境服务器地址，请根据实际情况修改
  // 如果你的后端服务器运行在不同端口，请修改这里
  development: 'http://localhost:3000/api',
  // 生产环境服务器地址
  production: 'https://ieclub.online/api'
};

const SquarePage = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  // 设置当前 TabBar 选中项 - 在小程序中通常自动管理
  useEffect(() => {
    // TabBar选中状态在小程序环境中由框架自动管理
    // 这里可以添加其他页面初始化逻辑
    console.log('广场页面加载完成');
  }, []);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      // 根据环境选择API地址
      const isDevelopment = process.env.NODE_ENV === 'development';
      const apiBase = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

      console.log('尝试连接到服务器:', apiBase);

      const res = await Taro.request({
        url: `${apiBase}/topics`,
        method: 'GET',
        data: {
          page: 1,
          limit: 20
        },
        timeout: 10000 // 10秒超时
      });

      if (res.data && res.data.code === 200) {
        setTopics(res.data.data || []);
        console.log('成功获取话题数据:', res.data.data?.length || 0, '条');
      } else {
        console.warn('API返回格式异常:', res.data);
        setTopics([]);
      }
    } catch (error: any) {
      console.error('获取话题列表失败:', error);

      // 根据错误类型显示不同提示
      let errorMessage = '服务器连接失败，请检查网络';
      if (error.errMsg?.includes('timeout')) {
        errorMessage = '请求超时，请检查服务器是否启动';
      } else if (error.errMsg?.includes('refuse')) {
        errorMessage = '无法连接到服务器，请启动后端服务';
      }

      Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const goToTopicDetail = (topicId: string) => {
    Taro.navigateTo({
      url: `/pages/topics/detail/index?id=${topicId}`
    });
  };

  const goToSearch = () => {
    Taro.navigateTo({
      url: '/pages/search/index'
    });
  };

  const renderTopicCard = (topic: any) => (
    <View
      key={topic.id}
      className="topic-card"
      onClick={() => goToTopicDetail(topic.id)}
    >
      {topic.cover ? (
        <Image src={topic.cover} className="topic-cover" mode="aspectFill" />
      ) : (
        <DefaultCoverIcon height="180px" />
      )}
      <View className="topic-info">
        <View className="topic-title">{topic.title}</View>
        <View className="topic-author">
          <Image
            src={topic.author?.avatar || '/default-avatar.png'}
            className="author-avatar"
            mode="aspectFill"
          />
          <View className="author-name">
            {topic.author?.nickname || topic.author?.username}
          </View>
        </View>
        <View className="topic-stats">
          <View className="stat-item">👍 {topic.likeCount || 0}</View>
          <View className="stat-item">💬 {topic.commentCount || 0}</View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="square-page">
      {/* 顶部搜索栏 */}
      <View className="header">
        <View className="search-bar" onClick={goToSearch}>
          <View className="search-icon">🔍</View>
          <View className="search-placeholder">搜索话题、用户...</View>
        </View>
      </View>

      {/* 话题列表 */}
      <ScrollView className="content" scrollY style={{ height: 'calc(100vh - 140px)' }}>
        {loading ? (
          <View className="loading">
            <View className="loading-spinner"></View>
            <View className="loading-text">加载中...</View>
          </View>
        ) : topics.length > 0 ? (
          <View className="topic-waterfall">
            {topics.map(renderTopicCard)}
          </View>
        ) : (
          <View className="empty-state">
            <View className="empty-icon">📭</View>
            <View className="empty-text">暂无话题</View>
            <View className="empty-hint">快来发布第一个话题吧</View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SquarePage;