// 1. 创建响应式工具类 src/utils/responsive.ts
import Taro from '@tarojs/taro'

export interface DeviceInfo {
  screenWidth: number
  screenHeight: number
  windowWidth: number
  windowHeight: number
  pixelRatio: number
  platform: string
  isPhone: boolean
  isTablet: boolean
  isDesktop: boolean
}

// 获取设备信息
export const getDeviceInfo = (): DeviceInfo => {
  const systemInfo = Taro.getSystemInfoSync()
  const screenWidth = systemInfo.screenWidth
  
  return {
    screenWidth: systemInfo.screenWidth,
    screenHeight: systemInfo.screenHeight,
    windowWidth: systemInfo.windowWidth,
    windowHeight: systemInfo.windowHeight,
    pixelRatio: systemInfo.pixelRatio,
    platform: systemInfo.platform,
    isPhone: screenWidth < 768,
    isTablet: screenWidth >= 768 && screenWidth < 1024,
    isDesktop: screenWidth >= 1024
  }
}

// 响应式px转换
export const rpx2px = (rpx: number): number => {
  const { screenWidth } = getDeviceInfo()
  return (rpx / 750) * screenWidth
}

// 根据屏幕宽度返回不同值
export const responsive = <T>(values: {
  phone: T
  tablet?: T
  desktop?: T
}): T => {
  const { isPhone, isTablet, isDesktop } = getDeviceInfo()
  
  if (isDesktop && values.desktop) return values.desktop
  if (isTablet && values.tablet) return values.tablet
  return values.phone
}

// 2. 创建全局样式配置 src/styles/variables.scss
/*
 * 响应式断点
 */
$breakpoint-phone: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1440px;

/*
 * 响应式间距
 */
$spacing-xs: 8px;
$spacing-sm: 12px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

/*
 * 字体大小
 */
$font-xs: 24px;   /* 12px */
$font-sm: 28px;   /* 14px */
$font-md: 32px;   /* 16px */
$font-lg: 36px;   /* 18px */
$font-xl: 40px;   /* 20px */
$font-xxl: 48px;  /* 24px */

/*
 * 响应式容器宽度
 */
$container-phone: 100%;
$container-tablet: 750px;
$container-desktop: 1200px;

/*
 * Mixins
 */
@mixin phone {
  @media (max-width: #{$breakpoint-phone - 1px}) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: $breakpoint-phone) and (max-width: #{$breakpoint-tablet - 1px}) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: $breakpoint-tablet) {
    @content;
  }
}

@mixin container {
  width: 100%;
  margin: 0 auto;
  padding: 0 $spacing-md;
  
  @include tablet {
    max-width: $container-tablet;
    padding: 0 $spacing-lg;
  }
  
  @include desktop {
    max-width: $container-desktop;
    padding: 0 $spacing-xl;
  }
}

// 3. 优化话题列表组件 src/components/TopicCard/index.scss
@import '@/styles/variables.scss';

.topic-card {
  background: #fff;
  border-radius: 16px;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  @include tablet {
    padding: $spacing-lg;
    border-radius: 20px;
  }

  @include desktop {
    padding: $spacing-xl;
    border-radius: 24px;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-right: $spacing-sm;

    @include tablet {
      width: 96px;
      height: 96px;
    }

    @include desktop {
      width: 112px;
      height: 112px;
      margin-right: $spacing-md;
    }
  }

  &__author {
    flex: 1;
    font-size: $font-md;
    font-weight: 500;
    color: #333;

    @include desktop {
      font-size: $font-lg;
    }
  }

  &__time {
    font-size: $font-xs;
    color: #999;

    @include desktop {
      font-size: $font-sm;
    }
  }

  &__title {
    font-size: $font-lg;
    font-weight: 600;
    color: #333;
    margin-bottom: $spacing-sm;
    line-height: 1.4;

    @include desktop {
      font-size: $font-xl;
      margin-bottom: $spacing-md;
    }
  }

  &__content {
    font-size: $font-sm;
    color: #666;
    line-height: 1.6;
    margin-bottom: $spacing-sm;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;

    @include desktop {
      font-size: $font-md;
      -webkit-line-clamp: 4;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
  }

  &__tag {
    padding: 8px 16px;
    background: #f5f5f5;
    border-radius: 20px;
    font-size: $font-xs;
    color: #666;

    @include desktop {
      padding: 10px 20px;
      font-size: $font-sm;
      
      &:hover {
        background: #e8e8e8;
      }
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    padding-top: $spacing-sm;
    border-top: 1px solid #f0f0f0;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-sm;
    color: #999;
    cursor: pointer;
    transition: color 0.3s;

    @include desktop {
      font-size: $font-md;
      
      &:hover {
        color: #4a90e2;
      }
    }
  }

  &__icon {
    width: 32px;
    height: 32px;

    @include desktop {
      width: 40px;
      height: 40px;
    }
  }
}

// 4. 优化页面布局 src/pages/plaza/index.scss
@import '@/styles/variables.scss';

.plaza-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: calc(100px + env(safe-area-inset-bottom));

  @include desktop {
    padding-bottom: $spacing-xl;
  }

  &__container {
    @include container;
    padding-top: $spacing-md;

    @include tablet {
      padding-top: $spacing-lg;
    }

    @include desktop {
      padding-top: $spacing-xl;
    }
  }

  &__header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #fff;
    padding: $spacing-md;
    margin: -#{$spacing-md} -#{$spacing-md} $spacing-md;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    @include desktop {
      position: relative;
      margin: 0 0 $spacing-xl 0;
      border-radius: 24px;
      box-shadow: none;
    }
  }

  &__tabs {
    display: flex;
    gap: $spacing-sm;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    @include desktop {
      justify-content: center;
      gap: $spacing-lg;
      overflow-x: visible;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__tab {
    flex-shrink: 0;
    padding: 16px 32px;
    background: #f5f5f5;
    border-radius: 24px;
    font-size: $font-md;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;

    @include desktop {
      padding: 20px 48px;
      font-size: $font-lg;
      
      &:hover {
        background: #e8e8e8;
      }
    }

    &--active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-weight: 600;

      @include desktop {
        &:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      }
    }
  }

  &__list {
    display: grid;
    gap: $spacing-md;

    @include tablet {
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-lg;
    }

    @include desktop {
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-xl;
    }
  }

  &__create-btn {
    position: fixed;
    right: $spacing-md;
    bottom: calc(120px + env(safe-area-inset-bottom));
    width: 112px;
    height: 112px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99;

    @include desktop {
      right: $spacing-xl;
      bottom: $spacing-xl;
      width: 128px;
      height: 128px;
      transition: all 0.3s;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
      }
    }
  }

  &__create-icon {
    width: 56px;
    height: 56px;
    color: #fff;

    @include desktop {
      width: 64px;
      height: 64px;
    }
  }
}

// 5. 创建响应式容器组件 src/components/ResponsiveContainer/index.tsx
import React from 'react'
import { View } from '@tarojs/components'
import { getDeviceInfo } from '@/utils/responsive'
import './index.scss'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = ''
}) => {
  const deviceInfo = getDeviceInfo()
  
  return (
    <View 
      className={`responsive-container ${className}`}
      data-platform={deviceInfo.platform}
      data-device={
        deviceInfo.isDesktop ? 'desktop' : 
        deviceInfo.isTablet ? 'tablet' : 
        'phone'
      }
    >
      {children}
    </View>
  )
}

export default ResponsiveContainer

// 6. 响应式容器样式 src/components/ResponsiveContainer/index.scss
@import '@/styles/variables.scss';

.responsive-container {
  @include container;
  
  &[data-device="desktop"] {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
