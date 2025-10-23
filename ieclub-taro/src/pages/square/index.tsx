// frontend/src/pages/square/index.jsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DefaultCoverIcon, DefaultAvatarIcon } from '@/components/CustomIcons';
import './index.scss';

// 使用统一的API配置
const getApiBase = () => {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online/api'
    case 'H5':
      return '/api'  // 使用代理
    case 'RN':
      return 'https://api.ieclub.online/api'
    default:
      return '/api'  // 开发环境也使用代理
  }
};

const SquarePage = () => {
  const [topics, setTopics] = useState<any[]>([]);
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
      const apiBase = getApiBase();
      console.log('尝试连接到服务器:', apiBase);

      // 先尝试测试API
      const testRes = await Taro.request({
        url: `${apiBase}/test`,
        method: 'GET',
        timeout: 5000
      });

      console.log('测试API响应:', testRes);

      if (testRes.data && testRes.data.success) {
        setTopics(testRes.data.data.topics || []);
        console.log('成功获取测试数据:', testRes.data.data.topics?.length || 0, '条');
        return;
      }

      // 如果测试API失败，尝试真实API
      const res = await Taro.request({
        url: `${apiBase}/topics`,
        method: 'GET',
        data: {
          page: 1,
          limit: 20
        },
        timeout: 10000
      });

      console.log('话题API响应:', res);

      if (res.data && res.data.success) {
        setTopics(res.data.data || []);
        console.log('成功获取话题数据:', res.data.data?.length || 0, '条');
      } else {
        throw new Error('API返回格式异常');
      }
    } catch (error: any) {
      console.error('获取话题列表失败:', error);

      // 显示测试数据
      setTopics([
        {
          id: '1',
          title: '测试话题1（离线模式）',
          cover: null,
          author: { nickname: '测试用户', avatar: null },
          likesCount: 10,
          commentsCount: 5
        },
        {
          id: '2',
          title: '测试话题2（离线模式）',
          cover: null,
          author: { nickname: '测试用户2', avatar: null },
          likesCount: 8,
          commentsCount: 3
        }
      ]);

      // 根据错误类型显示不同提示
      let errorMessage = '服务器连接失败，已显示测试数据';
      if (error.errMsg?.includes('timeout')) {
        errorMessage = '请求超时，已显示测试数据';
      } else if (error.errMsg?.includes('refuse')) {
        errorMessage = '无法连接到服务器，已显示测试数据';
      }

      Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
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

  const renderTopicCard = (topic: any) => (
    <View
      key={topic.id}
      className='topic-card'
      onClick={() => goToTopicDetail(topic.id)}
    >
      {topic.cover ? (
        <Image src={topic.cover} className='topic-cover' mode='aspectFill' />
      ) : (
        <DefaultCoverIcon height='180px' />
      )}
      <View className='topic-info'>
        <View className='topic-title'>{topic.title}</View>
        <View className='topic-author'>
          {topic.author?.avatar ? (
            <Image
              src={topic.author.avatar}
              className='author-avatar'
              mode='aspectFill'
            />
          ) : (
            <DefaultAvatarIcon size={32} />
          )}
          <View className='author-name'>
            {topic.author?.nickname || topic.author?.username}
          </View>
        </View>
        <View className='topic-stats'>
          <View className='stat-item'>👍 {topic.likesCount || 0}</View>
          <View className='stat-item'>💬 {topic.commentsCount || 0}</View>
        </View>
      </View>
    </View>
  );

  return (
    <View className='square-page'>
      {/* 顶部搜索栏 */}
      <View className='header'>
        <View className='search-bar' onClick={goToSearch}>
          <View className='search-icon'>🔍</View>
          <View className='search-placeholder'>搜索话题、用户...</View>
        </View>
      </View>

      {/* 话题列表 */}
      <ScrollView className='content' scrollY style={{ height: 'calc(100vh - 140px)' }}>
        {loading ? (
          <View className='loading'>
            <View className='loading-spinner'></View>
            <View className='loading-text'>加载中...</View>
          </View>
        ) : topics.length > 0 ? (
          <View className='topic-waterfall'>
            {topics.map(renderTopicCard)}
          </View>
        ) : (
          <View className='empty-state'>
            <View className='empty-icon'>📭</View>
            <View className='empty-text'>暂无话题</View>
            <View className='empty-hint'>快来发布第一个话题吧</View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SquarePage;