import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default class CustomTabBar extends Component {
  state = {
    selected: 0,
    list: [
      {
        pagePath: '/pages/square/index',
        text: '广场',
        iconName: 'mdi:view-dashboard',
        selectedIconName: 'mdi:view-dashboard'
      },
      {
        pagePath: '/pages/community/index',
        text: '社区',
        iconName: 'mdi:account-group-outline',
        selectedIconName: 'mdi:account-group'
      },
      {
        pagePath: '/pages/publish/index',
        text: '',
        iconName: 'mdi:plus-circle',
        selectedIconName: 'mdi:plus-circle',
        isSpecial: true
      },
      {
        pagePath: '/pages/activities/index',
        text: '活动',
        iconName: 'mdi:calendar-outline',
        selectedIconName: 'mdi:calendar'
      },
      {
        pagePath: '/pages/profile/index',
        text: '我的',
        iconName: 'mdi:account-outline',
        selectedIconName: 'mdi:account'
      }
    ]
  }

  switchTab = (index: number, url: string) => {
    this.setState({ selected: index })
    Taro.switchTab({ url })
  }

  render() {
    const { selected, list } = this.state

    return (
      <View className='custom-tab-bar'>
        {list.map((item, index) => (
          <View
            key={index}
            className={`tab-item ${item.isSpecial ? 'tab-item-special' : ''}`}
            onClick={() => this.switchTab(index, item.pagePath)}
          >
            {item.isSpecial ? (
              <View className='special-icon'>
                <View className='iconify-icon' data-icon={item.iconName} />
              </View>
            ) : (
              <>
                <View 
                  className={`iconify-icon ${selected === index ? 'active' : ''}`}
                  data-icon={selected === index ? item.selectedIconName : item.iconName}
                />
                <Text className={`tab-text ${selected === index ? 'active' : ''}`}>
                  {item.text}
                </Text>
              </>
            )}
          </View>
        ))}
      </View>
    )
  }
}
