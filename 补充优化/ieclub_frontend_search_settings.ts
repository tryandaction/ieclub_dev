// ==================== frontend/src/pages/search/index.tsx ====================
// 搜索页面 - 支持话题、用户搜索，搜索历史，热门搜索

import Taro from '@tarojs/taro';
import { View, Input, ScrollView, Image, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { searchTopics, searchUsers, getHotKeywords, getSearchHistory, clearSearchHistory } from '../../services/api/search';
import { Search, Clock, TrendingUp, X, User, FileText } from 'lucide-react';
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
          <Search className="search-icon" size={20} />
          <Input
            className="search-input"
            placeholder={searchType === 'topic' ? '搜索话题' : '搜索用户'}
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
            focus
          />
          {keyword && (
            <X
              className="clear-icon"
              size={18}
              onClick={() => {
                setKeyword('');
                setShowHistory(true);
                setSearchResults([]);
              }}
            />
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
          <FileText size={16} />
          <Text>话题</Text>
        </View>
        <View
          className={`tab ${searchType === 'user' ? 'active' : ''}`}
          onClick={() => setSearchType('user')}
        >
          <User size={16} />
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
                  <Clock size={18} />
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
                  <TrendingUp size={18} />
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


// ==================== frontend/src/pages/settings/index.tsx ====================
// 设置页面 - 账号设置、隐私设置、通知设置、关于

import Taro from '@tarojs/taro';
import { View, Text, Switch, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import {
  ChevronRight,
  User,
  Bell,
  Shield,
  Info,
  LogOut,
  Moon,
  Globe,
  HelpCircle,
} from 'lucide-react';
import './index.scss';

export default function SettingsPage() {
  const { userInfo, logout } = useUserStore();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 加载设置
    const settings = Taro.getStorageSync('settings') || {};
    setNotificationEnabled(settings.notificationEnabled !== false);
    setDarkMode(settings.darkMode === true);
  }, []);

  // 保存设置
  const saveSetting = (key: string, value: any) => {
    const settings = Taro.getStorageSync('settings') || {};
    settings[key] = value;
    Taro.setStorageSync('settings', settings);
  };

  // 通知开关
  const handleNotificationToggle = (value: boolean) => {
    setNotificationEnabled(value);
    saveSetting('notificationEnabled', value);
    Taro.showToast({
      title: value ? '已开启通知' : '已关闭通知',
      icon: 'success',
    });
  };

  // 深色模式开关
  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    saveSetting('darkMode', value);
    Taro.showToast({
      title: value ? '已开启深色模式' : '已关闭深色模式',
      icon: 'success',
    });
  };

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.showToast({ title: '已退出登录', icon: 'success' });
          setTimeout(() => {
            Taro.reLaunch({ url: '/pages/login/index' });
          }, 1000);
        }
      },
    });
  };

  // 清除缓存
  const handleClearCache = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          // 保留登录信息，清除其他缓存
          const token = Taro.getStorageSync('token');
          const userInfo = Taro.getStorageSync('userInfo');
          Taro.clearStorageSync();
          Taro.setStorageSync('token', token);
          Taro.setStorageSync('userInfo', userInfo);

          Taro.showToast({ title: '缓存已清除', icon: 'success' });
        }
      },
    });
  };

  // 检查更新
  const handleCheckUpdate = () => {
    Taro.showLoading({ title: '检查中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '已是最新版本', icon: 'success' });
    }, 1000);
  };

  return (
    <View className="settings-page">
      {/* 用户信息 */}
      <View className="user-section">
        <View className="user-card">
          <Image className="avatar" src={userInfo?.avatar} />
          <View className="user-info">
            <Text className="nickname">{userInfo?.nickname}</Text>
            <Text className="level">Lv.{userInfo?.level} · {userInfo?.points}积分</Text>
          </View>
          <ChevronRight size={20} />
        </View>
      </View>

      {/* 账号设置 */}
      <View className="settings-section">
        <Text className="section-title">账号设置</Text>
        <View className="setting-item" onClick={() => Taro.navigateTo({ url: '/pages/edit-profile/index' })}>
          <View className="item-left">
            <User size={20} />
            <Text>编辑资料</Text>
          </View>
          <ChevronRight size={18} />
        </View>
        <View className="setting-item" onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}>
          <View className="item-left">
            <Shield size={20} />
            <Text>隐私设置</Text>
          </View>
          <ChevronRight size={18} />
        </View>
      </View>

      {/* 通知设置 */}
      <View className="settings-section">
        <Text className="section-title">通知设置</Text>
        <View className="setting-item">
          <View className="item-left">
            <Bell size={20} />
            <Text>接收通知</Text>
          </View>
          <Switch
            checked={notificationEnabled}
            onChange={(e) => handleNotificationToggle(e.detail.value)}
          />
        </View>
      </View>

      {/* 偏好设置 */}
      <View className="settings-section">
        <Text className="section-title">偏好设置</Text>
        <View className="setting-item">
          <View className="item-left">
            <Moon size={20} />
            <Text>深色模式</Text>
          </View>
          <Switch
            checked={darkMode}
            onChange={(e) => handleDarkModeToggle(e.detail.value)}
          />
        </View>
        <View className="setting-item" onClick={() => Taro.navigateTo({ url: '/pages/language/index' })}>
          <View className="item-left">
            <Globe size={20} />
            <Text>语言</Text>
          </View>
          <View className="item-right">
            <Text className="value">简体中文</Text>
            <ChevronRight size={18} />
          </View>
        </View>
      </View>

      {/* 其他设置 */}
      <View className="settings-section">
        <Text className="section-title">其他</Text>
        <View className="setting-item" onClick={handleClearCache}>
          <View className="item-left">
            <Text>清除缓存</Text>
          </View>
          <View className="item-right">
            <Text className="value">23.5MB</Text>
            <Chev