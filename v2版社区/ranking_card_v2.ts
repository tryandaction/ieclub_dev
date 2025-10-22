// src/components/RankingCard/index.tsx
// 排行榜卡片组件 - 第二版本

import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { RankingUser } from '../../types/ranking';
import './index.scss';

interface RankingCardProps {
  user: RankingUser;
  showDetails?: boolean;
}

const RankingCard: React.FC<RankingCardProps> = ({ user, showDetails = false }) => {
  // 获取排名徽章
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: '#FFD700' };
    if (rank === 2) return { emoji: '🥈', color: '#C0C0C0' };
    if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: rank.toString(), color: '#999999' };
  };

  // 获取排名变化图标
  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) return { icon: '━', color: '#999999' };
    if (change > 0) return { icon: `↑${change}`, color: '#52c41a' };
    return { icon: `↓${Math.abs(change)}`, color: '#ff4d4f' };
  };

  const badge = getRankBadge(user.rank);
  const rankChange = getRankChangeIcon(user.rankChange);

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/community/profile/index?userId=${user.userId}`
    });
  };

  return (
    <View className="ranking-card" onClick={handleClick}>
      {/* 排名徽章 */}
      <View className="ranking-card__badge" style={{ color: badge.color }}>
        <Text className="ranking-card__badge-text">{badge.emoji}</Text>
      </View>

      {/* 用户信息 */}
      <Image
        className="ranking-card__avatar"
        src={user.avatar}
        mode="aspectFill"
      />

      <View className="ranking-card__content">
        <View className="ranking-card__header">
          <Text className="ranking-card__nickname">{user.nickname}</Text>
          <View className="ranking-card__change" style={{ color: rankChange.color }}>
            <Text className="ranking-card__change-text">{rankChange.icon}</Text>
          </View>
        </View>

        {user.bio && (
          <Text className="ranking-card__bio" numberOfLines={1}>
            {user.bio}
          </Text>
        )}

        {/* 得分展示 */}
        <View className="ranking-card__scores">
          <View className="score-item score-item--main">
            <Text className="score-item__value">{user.totalScore.toFixed(0)}</Text>
            <Text className="score-item__label">总分</Text>
          </View>
          
          {showDetails && (
            <>
              <View className="score-item">
                <Text className="score-item__value">{user.topicQualityScore.toFixed(0)}</Text>
                <Text className="score-item__label">话题</Text>
              </View>
              <View className="score-item">
                <Text className="score-item__value">{user.interactionScore.toFixed(0)}</Text>
                <Text className="score-item__label">互动</Text>
              </View>
              <View className="score-item">
                <Text className="score-item__value">{user.helpOthersScore.toFixed(0)}</Text>
                <Text className="score-item__label">帮助</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default RankingCard;
