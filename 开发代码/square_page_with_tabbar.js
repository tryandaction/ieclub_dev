// frontend/src/pages/square/index.jsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DefaultCoverIcon } from '../../components/CustomIcons';
import './index.scss';

const SquarePage = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  // 设置当前 TabBar 选中项
  useEffect(() => {
    const tabbar = Taro.getTabBar();
    if (tabbar) {
      tabbar.setData({
        selected: 0
      });
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/topics`,
        method: 'GET',
        data: {
          page: 1,
          limit: 20
        }
      });

      if (res.data.code === 200) {
        setTopics(res.data.data);
      }
    } catch (error) {
      console.error('获取话题列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToTopicDetail = (topicId) => {
    Taro.navigateTo({
      url: `/pages/topic-detail/index?id=${topicId}`
    });
  };

  const goToSearch = () => {
    Taro.navigateTo({
      url: '/pages/search/index'
    });
  };

  const renderTopicCard = (topic) => (
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
      <ScrollView className="content" scrollY>
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