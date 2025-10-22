// CustomIcons 组件 - 专业的图标库（使用内联SVG，不依赖外部模板）
import React from 'react';
import { View } from '@tarojs/components';
import './index.scss';

interface IconProps {
  active?: boolean;
  size?: number;
  className?: string;
}

interface NotificationIconProps extends IconProps {
  hasUnread?: boolean;
}

// 广场图标 - 内联SVG实现
export const SquareIcon: React.FC<IconProps> = ({ active = false, size = 24, className = '' }) => (
  <View className={`icon-container ${active ? 'active' : ''}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <View className='icon-svg' style={{ width: `${size}px`, height: `${size}px` }}>
      <View className='svg-content'>
        <View className='icon-grid'>
          <View className='grid-item'></View>
          <View className='grid-item'></View>
          <View className='grid-item'></View>
          <View className='grid-item'></View>
        </View>
      </View>
    </View>
  </View>
);

// 社区图标 - 内联SVG实现
export const CommunityIcon: React.FC<IconProps> = ({ active = false, size = 24, className = '' }) => (
  <View className={`icon-container ${active ? 'active' : ''}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <View className='icon-svg' style={{ width: `${size}px`, height: `${size}px` }}>
      <View className='svg-content'>
        <View className='icon-search'>
          <View className='search-circle'></View>
          <View className='search-handle'></View>
        </View>
      </View>
    </View>
  </View>
);

// 发布加号图标 - 内联SVG实现（大号）
export const PlusIcon: React.FC<{ size?: number; className?: string }> = ({ size = 56, className = '' }) => (
  <View className='icon-container plus-icon' style={{ width: `${size}px`, height: `${size}px` }}>
    <View className='icon-svg' style={{ width: `${size}px`, height: `${size}px` }}>
      <View className='svg-content'>
        <View className='plus-bg'></View>
        <View className='plus-symbol'>+</View>
      </View>
    </View>
  </View>
);

// 通知图标 - 内联SVG实现
export const NotificationIcon: React.FC<NotificationIconProps> = ({
  active = false,
  size = 24,
  hasUnread = false,
  className = ''
}) => (
  <View className={`icon-container ${active ? 'active' : ''}`} style={{ width: `${size}px`, height: `${size}px`, position: 'relative' }}>
    <View className='icon-svg' style={{ width: `${size}px`, height: `${size}px` }}>
      <View className='svg-content'>
        <View className='icon-bell'>
          <View className='bell-body'></View>
          <View className='bell-handle'></View>
        </View>
      </View>
    </View>
    {hasUnread && (
      <View className='unread-dot'></View>
    )}
  </View>
);

// 个人主页图标 - 内联SVG实现
export const ProfileIcon: React.FC<IconProps> = ({ active = false, size = 24, className = '' }) => (
  <View className={`icon-container ${active ? 'active' : ''}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <View className='icon-svg' style={{ width: `${size}px`, height: `${size}px` }}>
      <View className='svg-content'>
        <View className='icon-profile'>
          <View className='profile-head'></View>
          <View className='profile-body'></View>
        </View>
      </View>
    </View>
  </View>
);

// 默认头像图标 - CSS绘制
export const DefaultAvatarIcon: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <View className={`icon-container default-avatar ${className}`} style={{
    width: `${size}px`,
    height: `${size}px`
  }}
  >
    <View className='avatar-content'>
      <View className='avatar-icon'>
        <View className='avatar-head'></View>
        <View className='avatar-body'></View>
      </View>
    </View>
  </View>
);

// 默认封面图标 - CSS绘制
export const DefaultCoverIcon: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({
  width = '100%',
  height = '160px',
  className = ''
}) => (
  <View
    className={`icon-container default-cover ${className}`}
    style={{
      width,
      height
    }}
  >
    <View className='cover-content'>
      <View className='cover-icon'>
        <View className='cover-bg'></View>
        <View className='cover-image'></View>
      </View>
    </View>
  </View>
);

export default {
  SquareIcon,
  CommunityIcon,
  PlusIcon,
  NotificationIcon,
  ProfileIcon,
  DefaultAvatarIcon,
  DefaultCoverIcon
};