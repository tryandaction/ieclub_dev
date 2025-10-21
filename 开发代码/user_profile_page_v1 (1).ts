// src/pages/community/profile/index.tsx
// 个人主页页面 - 第一版本

import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView } from '@tarojs/components';
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import communityService from '../../../services/community';
import { formatDate } from '../../../utils/format';
import type { UserProfile } from '../../../types/community';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Button from '../../../components/Button';
import './index.scss';

const UserProfilePage: React.FC = () => {
  const router = useRouter();
  const userId = Number(router.params.userId);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  // 加载用户信息
  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await communityService.getUserProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('加载用户信息失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  useLoad(() => {
    if (userId) {
      loadProfile();
    }
  });

  // 关注/取消关注
  const handleFollow = async () => {
    if (!profile || followLoading) return;

    try {
      setFollowLoading(true);
      
      if (profile.isFollowing) {
        await communityService.unfollowUser(userId);
        Taro.showToast({
          title: '已取消关注',
          icon: 'success'
        });
      } else {
        await communityService.followUser(userId);
        Taro.showToast({
          title: '关注成功',
          icon: 'success'
        });
      }

      // 刷新数据
      await loadProfile();
    } catch (error) {
      console.error('关注操作失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    } finally {
      setFollowLoading(false);
    }
  };

  // 查看话题详情
  const handleTopicClick = (topicId: number) => {
    Taro.navigateTo({
      url: `/pages/topics/detail/index?id=${topicId}`
    });
  };

  if (loading) {
    return (
      <View className="profile-page">
        <LoadingSpinner />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="profile-page">
        <View className="profile-page__error">用户不存在</View>
      </View>
    );
  }

  return (
    <View className="profile-page">
      <ScrollView className="profile-page__scroll" scrollY>
        {/* 用户信息卡片 */}
        <View className="profile-header">
          <View className="profile-header__bg" />
          
          <View className="profile-header__content">
            <Image 
              className="profile-header__avatar"
              src={profile.avatar}
              mode="aspectFill"
            />
            
            <Text className="profile-header__nickname">{profile.nickname}</Text>
            
            <Text className="profile-header__bio">
              {profile.bio || '这个人很懒,什么都没留下~'}
            </Text>

            <View className="profile-header__tags">
              {profile.tags.map((tag, index) => (
                <View key={index} className="tag">
                  {tag}
                </View>
              ))}
            </View>

            <Text className="profile-header__time">
              {formatDate(profile.registerTime, 'relative')}加入
            </Text>
          </View>
        </View>

        {/* 统计数据 */}
        <View className="profile-stats">
          <View className="profile-stats__item">
            <Text className="profile-stats__value">{profile.topicsCount}</Text>
            <Text className="profile-stats__label">话题</Text>
          </View>
          <View className="profile-stats__item">
            <Text className="profile-stats__value">{profile.followersCount}</Text>
            <Text className="profile-stats__label">粉丝</Text>
          </View>
          <View className="profile-stats__item">
            <Text className="profile-stats__value">{profile.followingCount}</Text>
            <Text className="profile-stats__label">关注</Text>
          </View>
          <View className="profile-stats__item profile-stats__item--highlight">
            <Text className="profile-stats__value">{profile.interactionCount}</Text>
            <Text className="profile-stats__label">互动</Text>
          </View>
        </View>

        {/* 关注按钮 */}
        <View className="profile-actions">
          <Button
            type={profile.isFollowing ? 'default' : 'primary'}
            onClick={handleFollow}
            loading={followLoading}
            block
          >
            {profile.isFollowing ? '已关注' : '+ 关注'}
          </Button>
        </View>

        {/* 最近话题 */}
        {profile.recentTopics.length > 0 && (
          <View className="profile-topics">
            <View className="profile-topics__header">
              <Text className="profile-topics__title">最近话题</Text>
            </View>
            
            {profile.recentTopics.map(topic => (
              <View
                key={topic.id}
                className="topic-item"
                onClick={() => handleTopicClick(topic.id)}
              >
                <Text className="topic-item__title">{topic.title}</Text>
                <View className="topic-item__meta">
                  <Text className="topic-item__time">
                    {formatDate(topic.createdAt, 'relative')}
                  </Text>
                  <Text className="topic-item__likes">
                    ❤️ {topic.likesCount}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default UserProfilePage;