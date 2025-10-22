// src/pages/community/ranking/index.tsx
// 排行榜页面 - 第二版本

import React, { useEffect } from 'react';
import { View, ScrollView, Text } from '@tarojs/components';
import Taro, { useLoad, useReachBottom, usePullDownRefresh } from '@tarojs/taro';
import useRankingStore from '../../../store/ranking';
import { RankingType, RankingPeriod } from '../../../types/ranking';
import RankingCard from '../../../components/RankingCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import './index.scss';

const RankingPage: React.FC = () => {
  const {
    rankings,
    myRanking,
    currentType,
    currentPeriod,
    loading,
    hasMore,
    updateTime,
    rewards,
    setType,
    setPeriod,
    loadRankings,
    loadMore,
    loadMyRanking,
    loadRewards,
    reset
  } = useRankingStore();

  // 页面加载
  useLoad(() => {
    loadRankings(true);
    loadMyRanking();
    loadRewards();
  });

  // 下拉刷新
  usePullDownRefresh(() => {
    Promise.all([
      loadRankings(true),
      loadMyRanking()
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

  // 排行榜类型选项
  const typeOptions = [
    { value: RankingType.CONTRIBUTION, label: '综合贡献' },
    { value: RankingType.TOPIC_QUALITY, label: '话题质量' },
    { value: RankingType.INTERACTION, label: '互动活跃' },
    { value: RankingType.HELP_OTHERS, label: '帮助他人' }
  ];

  // 时间周期选项
  const periodOptions = [
    { value: RankingPeriod.WEEK, label: '周榜' },
    { value: RankingPeriod.MONTH, label: '月榜' },
    { value: RankingPeriod.TOTAL, label: '总榜' }
  ];

  // 查看规则说明
  const handleShowRules = () => {
    Taro.showModal({
      title: '贡献排行榜规则',
      content: `📊 综合贡献分计算方式：

🎯 话题质量分 (40%)
· 获赞数 × 2分
· 收藏数 × 3分
· 评论数 × 1分
· 浏览数 × 0.1分

💬 互动活跃度 (30%)
· 发布评论 × 2分
· 点赞他人 × 1分
· 24h内回复 +5分

🤝 帮助他人分 (30%)
· 供给匹配成功 × 10分
· 需求匹配成功 × 5分
· 评论被点赞 × 3分`,
      showCancel: false,
      confirmText: '我知道了'
    });
  };

  return (
    <View className="ranking-page">
      {/* 头部：我的排名 */}
      {myRanking && (
        <View className="my-ranking">
          <View className="my-ranking__header">
            <Text className="my-ranking__title">我的排名</Text>
            <View className="my-ranking__rules" onClick={handleShowRules}>
              <Text className="my-ranking__rules-text">规则说明</Text>
            </View>
          </View>
          <RankingCard user={myRanking} showDetails />
        </View>
      )}

      {/* 排行榜类型切换 */}
      <View className="ranking-tabs">
        <ScrollView className="ranking-tabs__scroll" scrollX>
          {typeOptions.map(option => (
            <View
              key={option.value}
              className={`ranking-tab ${currentType === option.value ? 'ranking-tab--active' : ''}`}
              onClick={() => setType(option.value)}
            >
              {option.label}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 时间周期切换 */}
      <View className="period-tabs">
        {periodOptions.map(option => (
          <View
            key={option.value}
            className={`period-tab ${currentPeriod === option.value ? 'period-tab--active' : ''}`}
            onClick={() => setPeriod(option.value)}
          >
            {option.label}
          </View>
        ))}
      </View>

      {/* 更新时间 */}
      {updateTime && (
        <View className="ranking-update">
          <Text className="ranking-update__text">
            更新于 {new Date(updateTime).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      )}

      {/* 排行榜列表 */}
      <ScrollView
        className="ranking-list"
        scrollY
        enableBackToTop
      >
        {rankings.length > 0 ? (
          <>
            {rankings.map(user => (
              <RankingCard 
                key={user.userId} 
                user={user}
                showDetails={currentType === RankingType.CONTRIBUTION}
              />
            ))}
            
            {/* 加载更多提示 */}
            {loading && (
              <View className="ranking-list__loading">
                <LoadingSpinner size="small" />
              </View>
            )}
            
            {!hasMore && (
              <View className="ranking-list__no-more">
                已经到底啦~
              </View>
            )}
          </>
        ) : loading ? (
          <View className="ranking-list__loading">
            <LoadingSpinner />
          </View>
        ) : (
          <EmptyState
            icon="🏆"
            message="暂无排行数据"
          />
        )}
      </ScrollView>

      {/* 奖励说明 */}
      {rewards.length > 0 && (
        <View className="ranking-rewards">
          <View className="ranking-rewards__title">🎁 排名奖励</View>
          <View className="ranking-rewards__list">
            {rewards.map(reward => (
              <View key={reward.rank} className="reward-item">
                <Text className="reward-item__rank">Top {reward.rank}</Text>
                <Text className="reward-item__badge" style={{ color: reward.badgeColor }}>
                  {reward.badge}
                </Text>
                <Text className="reward-item__title">{reward.title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default RankingPage;
