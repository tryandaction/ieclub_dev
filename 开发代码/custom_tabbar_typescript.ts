// ieclub-taro/src/custom-tab-bar/index.tsx
import { Component } from 'react';
import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import { 
  SquareIcon, 
  CommunityIcon, 
  PlusIcon, 
  NotificationIcon, 
  ProfileIcon 
} from '../components/CustomIcons';
import './index.scss';

interface TabItem {
  key: string;
  title: string;
  iconComponent: any;
  pagePath: string;
  isCenter?: boolean;
  disabled?: boolean;
}

interface CustomTabBarState {
  selected: number;
  tabList: TabItem[];
}

export default class CustomTabBar extends Component<{}, CustomTabBarState> {
  state: CustomTabBarState = {
    selected: 0,
    tabList: [
      {
        key: 'square',
        title: '广场',
        iconComponent: SquareIcon,
        pagePath: '/pages/index/index'
      },
      {
        key: 'community',
        title: '社区',
        iconComponent: CommunityIcon,
        pagePath: '',
        disabled: true
      },
      {
        key: 'publish',
        title: '',
        iconComponent: PlusIcon,
        pagePath: '/pages/topics/create/index',
        isCenter: true
      },
      {
        key: 'notification',
        title: '通知',
        iconComponent: NotificationIcon,
        pagePath: '/pages/notifications/index'
      },
      {
        key: 'profile',
        title: '我的',
        iconComponent: ProfileIcon,
        pagePath: '/pages/profile/index'
      }
    ]
  };

  switchTab = (index: number, tab: TabItem) => {
    if (tab.disabled) {
      Taro.showToast({
        title: '开发中，敬请期待',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (tab.isCenter) {
      // 发布按钮
      Taro.navigateTo({
        url: tab.pagePath
      });
    } else {
      // 其他 Tab
      const url = tab.pagePath;
      Taro.switchTab({ url });
    }
  };

  render() {
    const { selected, tabList } = this.state;

    return (
      <View className="custom-tab-bar">
        <View className="tab-bar-content">
          {tabList.map((tab, index) => {
            const IconComponent = tab.iconComponent;
            const isActive = selected === index;

            if (tab.isCenter) {
              return (
                <View
                  key={tab.key}
                  className="tab-item center-tab"
                  onClick={() => this.switchTab(index, tab)}
                >
                  <View className="center-icon-wrapper">
                    <IconComponent size={56} />
                  </View>
                </View>
              );
            }

            return (
              <View
                key={tab.key}
                className={`tab-item ${isActive ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                onClick={() => this.switchTab(index, tab)}
              >
                <View className="tab-icon">
                  <IconComponent active={isActive} size={24} />
                </View>
                <View className="tab-title">{tab.title}</View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
}