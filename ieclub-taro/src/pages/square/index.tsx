// frontend/src/pages/square/index.jsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { DefaultCoverIcon, DefaultAvatarIcon } from '@/components/CustomIcons';
import { getApiBaseUrl } from '@/utils/api-config';
import './index.scss';

const SquarePage = () => {
  // ==================== 添加组件渲染日志 ====================
  console.log('🎯 [SquarePage] Component is rendering/re-rendering');
  // =========================================================

  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 设置当前 TabBar 选中项 - 在小程序中通常自动管理
  useEffect(() => {
    // TabBar选中状态在小程序环境中由框架自动管理
    // 这里可以添加其他页面初始化逻辑
    console.log('广场页面加载完成');
    
    // 确保页面有内容显示
    if (topics.length === 0 && !loading) {
      console.log('页面初始化，准备加载数据');
    }
  }, [topics.length, loading]);

  useEffect(() => {
    console.log('🚀 [SquarePage] useEffect triggered, calling fetchTopics');
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      console.log('📡 API地址:', apiBase);

      // 尝试获取话题列表
      // apiBase已经包含/api，所以直接拼接路由
      const res = await Taro.request({
        url: `${apiBase}/topics`,
        method: 'GET',
        data: {
          page: 1,
          limit: 20
        },
        timeout: 10000
      });

      console.log('📊 话题API响应:', res);

      // 检查响应数据
      if (res.statusCode === 200) {
        const data = res.data;
        
        // 处理不同的响应格式
        if (data && data.success && Array.isArray(data.data)) {
          setTopics(data.data);
          console.log('✅ 成功获取话题数据:', data.data.length, '条');
          return;
        } else if (data && Array.isArray(data.topics)) {
          setTopics(data.topics);
          console.log('✅ 成功获取话题数据:', data.topics.length, '条');
          return;
        }
      }

      // 如果后端未运行，显示友好提示和测试数据
      throw new Error('后端服务暂未启动');
      
    } catch (error: any) {
      console.warn('⚠️ 获取话题列表失败:', error.errMsg || error.message);

      // 显示丰富的测试数据
      setTopics([
        {
          id: '1',
          title: '欢迎来到IEClub社区！',
          content: '这是一个测试话题，后端服务暂未启动。',
          cover: null,
          author: { 
            id: 'test1',
            nickname: 'IEClub团队', 
            avatar: null 
          },
          likesCount: 128,
          commentsCount: 45,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: '如何开始使用IEClub？',
          content: '浏览话题、参与讨论、发现更多可能...',
          cover: null,
          author: { 
            id: 'test2',
            nickname: '小助手', 
            avatar: null 
          },
          likesCount: 96,
          commentsCount: 32,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: '分享你的创业想法',
          content: '在这里找到志同道合的伙伴',
          cover: null,
          author: { 
            id: 'test3',
            nickname: '创业者', 
            avatar: null 
          },
          likesCount: 73,
          commentsCount: 18,
          createdAt: new Date().toISOString()
        }
      ]);

      console.log('💡 已显示测试数据（共3条）');
      
      // 只在第一次加载时显示提示
      Taro.showToast({
        title: '使用测试数据展示',
        icon: 'none',
        duration: 2000
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

  // ==================== 添加渲染前状态日志 ====================
  console.log('🎨 [SquarePage] Before return - Current state:', {
    loading: loading,
    topics: topics,
    topicsCount: topics ? topics.length : 'topics is null/undefined',
    topicsType: typeof topics,
    topicsIsArray: Array.isArray(topics),
    hasTopics: topics && topics.length > 0
  });

  // 添加错误边界保护
  if (!topics) {
    console.error('❌ [SquarePage] topics is null or undefined!');
    return (
      <View className='square-page'>
        <View className='error-state'>
          <View className='error-text'>数据加载异常</View>
          <View className='error-hint'>topics 状态为 null</View>
        </View>
      </View>
    );
  }

  if (!Array.isArray(topics)) {
    console.error('❌ [SquarePage] topics is not an array!', typeof topics, topics);
    return (
      <View className='square-page'>
        <View className='error-state'>
          <View className='error-text'>数据格式异常</View>
          <View className='error-hint'>topics 不是数组类型</View>
        </View>
      </View>
    );
  }
  // ================================================================

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