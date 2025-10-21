// src/components/UserCard/index.tsx
// 用户卡片组件 - 第一版本

import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { formatDate } from '../../utils/format';
import type { CommunityUser } from '../../types/community';
import './index.scss';

interface UserCardProps {
  user: CommunityUser;
  showInteraction?: boolean;  // 是否显示互动数
}

const UserCard: React.FC<UserCardProps> = ({ user, showInteraction = true }) => {
  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/community/profile/index?userId=${user.id}`
    });
  };

  return (
    <View className="user-card" onClick={handleClick}>
      {/* 头像 */}
      <Image 
        className="user-card__avatar" 
        src={user.avatar}
        mode="aspectFill"
      />

      {/* 用户信息 */}
      <View className="user-card__content">
        <View className="user-card__header">
          <Text className="user-card__nickname">{user.nickname}</Text>
          <Text className="user-card__register-time">
            {formatDate(user.registerTime, 'relative')}加入
          </Text>
        </View>

        <Text className="user-card__bio" numberOfLines={2}>
          {user.bio || '这个人很懒,什么都没留下~'}
        </Text>

        {/* 统计信息 */}
        <View className="user-card__stats">
          <View className="stat-item">
            <Text className="stat-item__value">{user.topicsCount}</Text>
            <Text className="stat-item__label">话题</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-item__value">{user.commentsCount}</Text>
            <Text className="stat-item__label">评论</Text>
          </View>
          {showInteraction && (
            <View className="stat-item stat-item--highlight">
              <Text className="stat-item__value">{user.interactionCount}</Text>
              <Text className="stat-item__label">互动</Text>
            </View>
          )}
        </View>
      </View>

      {/* 箭头图标 */}
      <View className="user-card__arrow">
        <Text className="iconfont">&#xe61c;</Text>
      </View>
    </View>
  );
};

export default UserCard;
