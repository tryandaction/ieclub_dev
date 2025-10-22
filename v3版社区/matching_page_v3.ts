// src/pages/community/matching/index.tsx
// 智能匹配页面 - 第三版本

import React, { useEffect } from 'react';
import { View, ScrollView, Text } from '@tarojs/components';
import Taro, { useLoad, useReachBottom, usePullDownRefresh } from '@tarojs/taro';
import useMatchingStore from '../../../store/matching';
import { MatchingType } from '../../../types/matching';
import MatchedUserCard from '../../../components/MatchedUserCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import './index.scss';

const MatchingPage: React.FC = () => {
  const {
    matches,
    currentType,
    loading,
    hasMore,
    averageScore,
    suggestions,
    refreshing,
    setType,
    loadMatches,
    loadMore,
    loadSuggestions,
    refreshMatching,
    reset
  } = useMatchingStore();

  // 页面加载
  useLoad(() => {
    loadMatches(true);
    loadSuggestions();
  });

  // 下拉刷新
  usePullDownRefresh(() => {
    Promise.all([
      loadMatches(true),
      loadSuggestions()
    ]).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  // 上拉加载更多
  useReachBottom(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  });

  // 页面卸载
  useEffect(() => {
    return () => {
      reset();
    };
  }, []);

  // 匹配类型选项
  const typeOptions = [
    { value: MatchingType.COMPREHENSIVE, label: '综合匹配', icon: '✨' },
    { value: MatchingType.PROFILE, label: '主页相似', icon: '📝' },
    { value: MatchingType.BEHAVIOR, label: '行为相似', icon: '👀' }
  ];

  // 重新匹配
  const handleRefresh = async () => {
    Taro.showModal({
      title: '重新匹配',
      content: '将根据您最新的行为数据重新计算匹配度,确定继续吗?',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '计算中...' });
          await refreshMatching();
          Taro.hideLoading();
          Taro.showToast({
            title: '匹配完成',
            icon: 'success'
          });
        }
      }
    });
  };

  // 查看匹配规则
  const handleShowRules = () => {
    Taro.showModal({
      title: '智能匹配规则',
      content: `🎯 匹配度计算方式：

📝 主页相似度 (30%)
· 话题类型互补性
· 话题分类相似度
· 活跃时间相似度

👀 行为相似度 (40%)
· 评论关键词匹配
· 浏览兴趣重合度
· 互动对象交集

✨ 综合相似度 (30%)
· 注册时间接近度
· 活跃时段相似度
· 社交圈重合度

匹配分数越高,表示你们越相似!`,
      showCancel: false,
      confirmText: '我知道了'
    });
  };

  return (
    <View className="matching-page">
      {/* 头部信息 */}
      <View className="matching-header">
        <View className="matching-header__top">
          <View className="matching-header__info">
            <Text className="matching-header__title">智能匹配</Text>
            <Text className="matching-header__subtitle">
              找到与你最相似的伙伴
            </Text>
          </View>
          <View className="matching-header__actions">
            <View className="action-button" onClick={handleShowRules}>
              <Text className="action-button__text">规则</Text>
            </View>
            <View 
              className="action-button action-button--primary" 
              onClick={handleRefresh}
            >
              <Text className="action-button__text">
                {refreshing ? '计算中...' : '重新匹配'}
              </Text>
            </View>
          </View>
        </View>

        {/* 平均匹配度 */}
        {averageScore > 0 && (
          <View className="matching-header__score">
            <Text className="score-label">平均匹配度</Text>
            <Text className="score-value">{averageScore.toFixed(0)}分</Text>
          </View>
        )}
      </View>

      {/* 匹配建议 */}
      {suggestions.length > 0 && (
        <View className="matching-suggestions">
          <Text className="matching-suggestions__title">💡 匹配建议</Text>
          <ScrollView className="matching-suggestions__scroll" scrollX>
            {suggestions.map((suggestion, index) => (
              <View key={index} className="suggestion-card">
                <Text className="suggestion-card__title">{suggestion.title}</Text>
                <Text className="suggestion-card__desc">{suggestion.description}</Text>
                <Text className="suggestion-card__count">
                  {suggestion.users.length}位用户
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 匹配类型切换 */}
      <View className="matching-tabs">
        {typeOptions.map(option => (
          <View
            key={option.value}
            className={`matching-tab ${currentType === option.value ? 'matching-tab--active' : ''}`}
            onClick={() => setType(option.value)}
          >
            <Text className="matching-tab__icon">{option.icon}</Text>
            <Text className="matching-tab__label">{option.label}</Text>
          </View>
        ))}
      </View>

      {/* 匹配列表 */}
      <ScrollView
        className="matching-list"
        scrollY
        enableBackToTop
      >
        {matches.length > 0 ? (
          <>
            {matches.map(user => (
              <MatchedUserCard key={user.userId} user={user} />
            ))}
            
            {/* 加载更多提示 */}
            {loading && (
              <View className="matching-list__loading">
                <LoadingSpinner size="small" />
              </View>
            )}
            
            {!hasMore && (
              <View className="matching-list__no-more">
                没有更多匹配用户了~
              </View>
            )}
          </>
        ) : loading ? (
          <View className="matching-list__loading">
            <LoadingSpinner />
          </View>
        ) : (
          <EmptyState
            icon="🔍"
            message="暂无匹配用户"
            description="多发布话题、多互动，系统会找到更多与你相似的人"
          />
        )}
      </ScrollView>
    </View>
  );
};

export default MatchingPage;
