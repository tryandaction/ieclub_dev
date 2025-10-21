// ieclub-taro/src/pages/index/index.tsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DefaultCoverIcon, DefaultAvatarIcon } from '../../components/CustomIcons';
import { getTopic列表 } from '../../services/topic';
import './index.scss';

interface Topic {
  id: string;
  title: string;
  cover?: string;
  author: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  likeCount: number;
  commentCount: number;
  viewCount: number;
}

const IndexPage = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

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
    if (loading) return;
    
    setLoading(true);
    try {
      const res = await getTopic列表({
        page,
        limit: 20
      });

      if (res.code === 200) {
        setTopics(prevTopics => [...prevTopics, ...res.data]);
        setPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      console.error('获取话题列表失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
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

  const renderTopicCard = (topic: Topic) => (
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
          {topic.author?.avatar ? (
            <Image 
              src={topic.author.avatar} 
              className="author-avatar"
              mode="aspectFill"
            />
          ) : (
            <DefaultAvatarIcon size={20} />
          )}
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
    <View className="index-page">
      {/* 顶部搜索栏 */}
      <View className="header">
        <View className="search-bar" onClick={goToSearch}>
          <View className="search-icon">🔍</View>
          <View className="search-placeholder">搜索话题、用户...</View>
        </View>
      </View>

      {/* 话题瀑布流列表 */}
      <ScrollView 
        className="content" 
        scrollY
        onScrollToLower={fetchTopics}
        lowerThreshold={50}
      >
        {topics.length > 0 ? (
          <View className="topic-waterfall">
            {topics.map(renderTopicCard)}
          </View>
        ) : loading ? (
          <View className="loading">
            <View className="loading-spinner"></View>
            <View className="loading-text">加载中...</View>
          </View>
        ) : (
          <View className="empty-state">
            <View className="empty-icon">📭</View>
            <View className="empty-text">暂无话题</View>
            <View className="empty-hint">快来发布第一个话题吧</View>
          </View>
        )}

        {loading && topics.length > 0 && (
          <View className="loading-more">
            <View className="loading-spinner-small"></View>
            <View className="loading-text">加载更多...</View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default IndexPage;