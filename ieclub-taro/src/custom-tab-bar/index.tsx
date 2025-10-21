// ieclub-taro/src/custom-tab-bar/index.tsx
// 自定义 TabBar 组件 - 纯文字版本优化
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

interface TabItem {
  key: string;
  title: string;
  pagePath: string;
  isCenter?: boolean;
}

const CustomTabBar: React.FC = () => {
  const [selected, setSelected] = useState(0);

  const tabList: TabItem[] = useMemo(() => [
    {
      key: 'square',
      title: '广场',
      pagePath: '/pages/square/index'
    },
    {
      key: 'community',
      title: '社区',
      pagePath: '/pages/community/index'
    },
    {
      key: 'publish',
      title: '', // 中间加号按钮占位
      pagePath: 'center',
      isCenter: true
    },
    {
      key: 'notification',
      title: '消息',
      pagePath: '/pages/notifications/index'
    },
    {
      key: 'profile',
      title: '主页',
      pagePath: '/pages/profile/index'
    }
  ], []);

  useEffect(() => {
    // 获取当前页面路径
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentPath = `/${currentPage.route}`;

    // 找到对应的 tab index
    const index = tabList.findIndex(item => item.pagePath === currentPath);
    if (index !== -1) {
      setSelected(index);
    }
  }, [tabList]);

  const switchTab = (index: number, tab: TabItem) => {
    if (tab.isCenter || tab.pagePath === 'center') {
      // 中间加号：跳转到创建话题页面
      Taro.navigateTo({
        url: '/pages/topics/create/index'
      });
      return;
    }

    setSelected(index);
    Taro.switchTab({ url: tab.pagePath });
  };

  return (
    <View className='custom-tab-bar'>
      {tabList.map((item, index) => {
        const isCenter = item.isCenter || item.pagePath === 'center';
        const isActive = selected === index;

        return (
          <View
            key={item.key}
            className={`tab-bar-item ${isActive ? 'tab-bar-item--active' : ''} ${isCenter ? 'tab-bar-item--center' : ''}`}
            onClick={() => switchTab(index, item)}
          >
            {isCenter ? (
              <View className='center-button'>
                <Text className='center-button__icon'>+</Text>
              </View>
            ) : (
              <Text className='tab-bar-item__text'>{item.title}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default CustomTabBar;