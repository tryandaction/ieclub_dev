// 搜索页面 - 支持话题、用户搜索，搜索历史，热门搜索

import Taro from '@tarojs/taro';
import { View, Input, ScrollView, Image, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { searchTopics, searchUsers, getHotKeywords, getSearchHistory, clearSearchHistory } from '../../services/api/search';
import TopicCard from '../../components/TopicCard';
import './index.scss';

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'topic' | 'user'>('topic');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hotKeywords, setHotKeywords] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      const [hotRes, historyRes] = await Promise.all([
        getHotKeywords(),
        getSearchHistory(),
      ]);
      setHotKeywords(hotRes.keywords || []);
      setSearchHistory(historyRes.history || []);
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  };

  // 执行搜索
  const handleSearch = async () => {
    if (!keyword.trim()) {
      Taro.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    setLoading(true);
    setShowHistory(false);

    try {
      if (searchType === 'topic') {
        const res = await searchTopics({ q: keyword });
        setSearchResults(res.topics || []);
      } else {
        const res = await searchUsers({ q: keyword });
        setSearchResults(res.users || []);
      }

      // 刷新搜索历史
      const historyRes = await getSearchHistory();
      setSearchHistory(historyRes.history || []);
    } catch (error) {
      Taro.showToast({ title: '搜索失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 点击热门搜索词
  const handleHotKeywordClick = (kw: string) => {
    setKeyword(kw);
    setShowHistory(false);
    // 自动搜索
    setTimeout(() => handleSearch(), 100);
  };

  // 点击搜索历史
  const handleHistoryClick = (item: any) => {
    setKeyword(item.keyword);
    setSearchType(item.type);
    setShowHistory(false);
    setTimeout(() => handleSearch(), 100);
  };

  // 清除搜索历史
  const handleClearHistory = async () => {
    Taro.showModal({
      title: '提示',
      content: '确定要清除所有搜索历史吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await clearSearchHistory();
            setSearchHistory([]);
            Taro.showToast({ title: '已清除', icon: 'success' });
          } catch (error) {
            Taro.showToast({ title: '清除失败', icon: 'none' });
          }
        }
      },
    });
  };

  return (
    <View className="search-page">
      {/* 搜索栏 */}
      <View className="search-bar">
        <View className="search-input-wrapper">
          <Text className="search-icon">🔍</Text>
          <Input
            className="search-input"
            placeholder={searchType === 'topic' ? '搜索话题' : '搜索用户'}
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
            focus
          />
          {keyword && (
            <Text
              className="clear-icon"
              onClick={() => {
                setKeyword('');
                setShowHistory(true);
                setSearchResults([]);
              }}
            >
              ✕
            </Text>
          )}
        </View>
        <View className="search-btn" onClick={handleSearch}>
          搜索
        </View>
      </View>

      {/* 搜索类型切换 */}
      <View className="search-type-tabs">
        <View
          className={`tab ${searchType === 'topic' ? 'active' : ''}`}
          onClick={() => setSearchType('topic')}
        >
          <Text>💬</Text>
          <Text>话题</Text>
        </View>
        <View
          className={`tab ${searchType === 'user' ? 'active' : ''}`}
          onClick={() => setSearchType('user')}
        >
          <Text>👤</Text>
          <Text>用户</Text>
        </View>
      </View>

      {/* 搜索历史和热门搜索 */}
      {showHistory && (
        <ScrollView scrollY className="history-section">
          {/* 搜索历史 */}
          {searchHistory.length > 0 && (
            <View className="history-block">
              <View className="block-header">
                <View className="header-left">
                  <Text>🕐</Text>
                  <Text>搜索历史</Text>
                </View>
                <Text className="clear-btn" onClick={handleClearHistory}>
                  清除
                </Text>
              </View>
              <View className="keyword-list">
                {searchHistory.map((item, index) => (
                  <View
                    key={index}
                    className="keyword-item"
                    onClick={() => handleHistoryClick(item)}
                  >
                    {item.keyword}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 热门搜索 */}
          {hotKeywords.length > 0 && (
            <View className="history-block">
              <View className="block-header">
                <View className="header-left">
                  <Text>🔥</Text>
                  <Text>热门搜索</Text>
                </View>
              </View>
              <View className="keyword-list">
                {hotKeywords.map((item, index) => (
                  <View
                    key={index}
                    className={`keyword-item hot ${index < 3 ? 'top3' : ''}`}
                    onClick={() => handleHotKeywordClick(item.keyword)}
                  >
                    <Text className="rank">{index + 1}</Text>
                    <Text className="keyword">{item.keyword}</Text>
                    {item.count > 10 && (
                      <Text className="count">{item.count}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* 搜索结果 */}
      {!showHistory && (
        <ScrollView scrollY className="search-results">
          {loading ? (
            <View className="loading">搜索中...</View>
          ) : searchResults.length > 0 ? (
            <View>
              {searchType === 'topic' ? (
                searchResults.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))
              ) : (
                <View className="user-list">
                  {searchResults.map((user) => (
                    <View
                      key={user.id}
                      className="user-item"
                      onClick={() =>
                        Taro.navigateTo({ url: `/pages/profile/index?id=${user.id}` })
                      }
                    >
                      <Image className="avatar" src={user.avatar} />
                      <View className="user-info">
                        <Text className="nickname">{user.nickname}</Text>
                        <Text className="bio">{user.bio || '暂无简介'}</Text>
                        <View className="stats">
                          <Text>话题 {user._count.topics}</Text>
                          <Text>粉丝 {user._count.followers}</Text>
                        </View>
                      </View>
                      {!user.isFollowing && (
                        <View className="follow-btn">关注</View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="empty">
              <Text>没有找到相关内容</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}