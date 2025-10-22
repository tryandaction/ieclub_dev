// src/components/MatchedUserCard/index.tsx
// 匹配用户卡片组件 - 第三版本

import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { MatchedUser } from '../../types/matching';
import './index.scss';

interface MatchedUserCardProps {
  user: MatchedUser;
  showDetails?: boolean;
}

const MatchedUserCard: React.FC<MatchedUserCardProps> = ({ user, showDetails = true }) => {
  // 获取匹配度等级
  const getMatchLevel = (score: number) => {
    if (score >= 90) return { text: '极高匹配', color: '#52c41a', icon: '💚' };
    if (score >= 75) return { text: '高度匹配', color: '#1890ff', icon: '💙' };
    if (score >= 60) return { text: '中等匹配', color: '#faad14', icon: '💛' };
    return { text: '一般匹配', color: '#999999', icon: '🤍' };
  };

  const matchLevel = getMatchLevel(user.matchScore);

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/community/profile/index?userId=${user.userId}`
    });
  };

  const handleViewSimilarity = (e: any) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/community/matching/detail/index?userId=${user.userId}`
    });
  };

  return (
    <View className="matched-user-card" onClick={handleClick}>
      {/* 匹配分数徽章 */}
      <View className="matched-user-card__badge" style={{ background: matchLevel.color }}>
        <Text className="matched-user-card__score">{user.matchScore}</Text>
        <Text className="matched-user-card__icon">{matchLevel.icon}</Text>
      </View>

      {/* 用户信息 */}
      <Image
        className="matched-user-card__avatar"
        src={user.avatar}
        mode="aspectFill"
      />

      <View className="matched-user-card__content">
        <View className="matched-user-card__header">
          <Text className="matched-user-card__nickname">{user.nickname}</Text>
          <Text 
            className="matched-user-card__level" 
            style={{ color: matchLevel.color }}
          >
            {matchLevel.text}
          </Text>
        </View>

        {user.bio && (
          <Text className="matched-user-card__bio" numberOfLines={1}>
            {user.bio}
          </Text>
        )}

        {/* 匹配原因 */}
        <View className="matched-user-card__reasons">
          {user.matchReason.slice(0, 2).map((reason, index) => (
            <View key={index} className="reason-tag">
              {reason}
            </View>
          ))}
        </View>

        {/* 共同点 */}
        <View className="matched-user-card__common">
          {user.commonTopics > 0 && (
            <Text className="common-item">🎯 {user.commonTopics}个共同话题</Text>
          )}
          {user.commonFollowers > 0 && (
            <Text className="common-item">👥 {user.commonFollowers}位共同关注</Text>
          )}
          {user.commonInterests.length > 0 && (
            <Text className="common-item">
              ⭐ {user.commonInterests.slice(0, 2).join('、')}
            </Text>
          )}
        </View>

        {/* 详细相似度 */}
        {showDetails && (
          <View className="matched-user-card__details">
            <View 
              className="details-button"
              onClick={handleViewSimilarity}
            >
              查看详细相似度 →
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default MatchedUserCard;
