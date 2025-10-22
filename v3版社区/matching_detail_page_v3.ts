// src/pages/community/matching/detail/index.tsx
// 相似度详情页面 - 第三版本

import React, { useState } from 'react';
import { View, Image, Text, Progress } from '@tarojs/components';
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import matchingService from '../../../../services/matching';
import type { MatchedUser } from '../../../../types/matching';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import './index.scss';

const MatchingDetailPage: React.FC = () => {
  const router = useRouter();
  const userId = Number(router.params.userId);

  const [user, setUser] = useState<MatchedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载相似度数据
  useLoad(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await matchingService.getUserSimilarity(userId);
      setUser(data);
    } catch (error) {
      console.error('加载相似度失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  });

  // 访问用户主页
  const handleViewProfile = () => {
    Taro.navigateTo({
      url: `/pages/community/profile/index?userId=${userId}`
    });
  };

  if (loading) {
    return (
      <View className="matching-detail">
        <LoadingSpinner />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="matching-detail">
        <View className="matching-detail__error">数据加载失败</View>
      </View>
    );
  }

  const similarity = user.similarity;

  return (
    <View className="matching-detail">
      {/* 用户信息卡片 */}
      <View className="user-info">
        <Image 
          className="user-info__avatar"
          src={user.avatar}
          mode="aspectFill"
        />
        <Text className="user-info__nickname">{user.nickname}</Text>
        {user.bio && (
          <Text className="user-info__bio">{user.bio}</Text>
        )}
        
        {/* 总体匹配度 */}
        <View className="user-info__score">
          <Text className="score-label">综合匹配度</Text>
          <Text className="score-value">{user.matchScore}</Text>
          <Text className="score-unit">分</Text>
        </View>

        <View className="user-info__button" onClick={handleViewProfile}>
          <Text className="user-info__button-text">访问主页</Text>
        </View>
      </View>

      {/* 详细相似度 */}
      <View className="similarity-details">
        <Text className="similarity-details__title">📊 相似度分析</Text>

        {/* 三大维度 */}
        <View className="dimension-item">
          <View className="dimension-item__header">
            <Text className="dimension-item__label">📝 主页相似度</Text>
            <Text className="dimension-item__value">
              {similarity.profileSimilarity.toFixed(0)}%
            </Text>
          </View>
          <Progress
            percent={similarity.profileSimilarity}
            strokeWidth={12}
            activeColor="#667eea"
            backgroundColor="#f0f0f0"
            borderRadius={6}
          />
          <View className="dimension-item__sub">
            <Text className="sub-label">话题类型</Text>
            <Text className="sub-value">
              {similarity.topicTypeSimilarity.toFixed(0)}%
            </Text>
          </View>
          <View className="dimension-item__sub">
            <Text className="sub-label">分类相似</Text>
            <Text className="sub-value">
              {similarity.categorySimilarity.toFixed(0)}%
            </Text>
          </View>
        </View>

        <View className="dimension-item">
          <View className="dimension-item__header">
            <Text className="dimension-item__label">👀 行为相似度</Text>
            <Text className="dimension-item__value">
              {similarity.behaviorSimilarity.toFixed(0)}%
            </Text>
          </View>
          <Progress
            percent={similarity.behaviorSimilarity}
            strokeWidth={12}
            activeColor="#52c41a"
            backgroundColor="#f0f0f0"
            borderRadius={6}
          />
          <View className="dimension-item__sub">
            <Text className="sub-label">兴趣相似</Text>
            <Text className="sub-value">
              {similarity.interestSimilarity.toFixed(0)}%
            </Text>
          </View>
        </View>

        <View className="dimension-item">
          <View className="dimension-item__header">
            <Text className="dimension-item__label">✨ 综合相似度</Text>
            <Text className="dimension-item__value">
              {similarity.comprehensiveSimilarity.toFixed(0)}%
            </Text>
          </View>
          <Progress
            percent={similarity.comprehensiveSimilarity}
            strokeWidth={12}
            activeColor="#faad14"
            backgroundColor="#f0f0f0"
            borderRadius={6}
          />
          <View className="dimension-item__sub">
            <Text className="sub-label">活跃时段</Text>
            <Text className="sub-value">
              {similarity.activitySimilarity.toFixed(0)}%
            </Text>
          </View>
          <View className="dimension-item__sub">
            <Text className="sub-label">社交圈</Text>
            <Text className="sub-value">
              {similarity.socialCircleSimilarity.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      {/* 共同点 */}
      <View className="common-points">
        <Text className="common-points__title">🤝 你们的共同点</Text>
        
        {user.commonTopics > 0 && (
          <View className="common-item">
            <Text className="common-item__icon">🎯</Text>
            <Text className="common-item__text">
              {user.commonTopics}个共同话题
            </Text>
          </View>
        )}

        {user.commonFollowers > 0 && (
          <View className="common-item">
            <Text className="common-item__icon">👥</Text>
            <Text className="common-item__text">
              {user.commonFollowers}位共同关注
            </Text>
          </View>
        )}

        {user.commonInterests.length > 0 && (
          <View className="common-item">
            <Text className="common-item__icon">⭐</Text>
            <Text className="common-item__text">
              共同兴趣：{user.commonInterests.join('、')}
            </Text>
          </View>
        )}
      </View>

      {/* 匹配原因 */}
      <View className="match-reasons">
        <Text className="match-reasons__title">💡 为什么推荐TA</Text>
        {user.matchReason.map((reason, index) => (
          <View key={index} className="reason-item">
            <Text className="reason-item__dot">•</Text>
            <Text className="reason-item__text">{reason}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default MatchingDetailPage;
