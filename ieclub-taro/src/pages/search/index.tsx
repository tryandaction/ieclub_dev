import { useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const [searchHistory, setSearchHistory] = useState(['创业项目', '高数复习', '前端开发'])
  const [hotKeywords] = useState([
    '期末复习',
    '创业团队',
    '技术交流',
    '实习招聘',
    '社团活动',
    '考研经验'
  ])

  const handleSearch = () => {
    if (!keyword.trim()) {
      return
    }
    
    // 添加到搜索历史
    if (!searchHistory.includes(keyword)) {
      setSearchHistory([keyword, ...searchHistory.slice(0, 9)])
    }
    
    console.log('搜索', keyword)
  }

  const clearHistory = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          setSearchHistory([])
        }
      }
    })
  }

  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='search-page'>
      {/* 搜索栏 */}
      <View className='search-bar'>
        <View className='back-btn' onClick={goBack}>
          <View className='iconify-icon' data-icon='mdi:arrow-left' />
        </View>
        
        <View className='search-input-wrapper'>
          <View className='iconify-icon' data-icon='mdi:magnify' />
          <Input
            className='search-input'
            placeholder='搜索话题、活动、用户'
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
            focus
          />
          {keyword && (
            <View 
              className='clear-btn'
              onClick={() => setKeyword('')}
            >
              <View className='iconify-icon' data-icon='mdi:close-circle' />
            </View>
          )}
        </View>
        
        <View className='search-btn' onClick={handleSearch}>
          <Text>搜索</Text>
        </View>
      </View>

      <ScrollView className='content' scrollY>
        {/* 搜索历史 */}
        {searchHistory.length > 0 && (
          <View className='section'>
            <View className='section-header'>
              <Text className='section-title'>搜索历史</Text>
              <View className='clear-history' onClick={clearHistory}>
                <View className='iconify-icon' data-icon='mdi:delete-outline' />
              </View>
            </View>
            
            <View className='tag-list'>
              {searchHistory.map((item, index) => (
                <View 
                  key={index}
                  className='tag'
                  onClick={() => setKeyword(item)}
                >
                  {item}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 热门搜索 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>热门搜索</Text>
          </View>
          
          <View className='tag-list hot'>
            {hotKeywords.map((item, index) => (
              <View 
                key={index}
                className='tag'
                onClick={() => setKeyword(item)}
              >
                <Text className='rank'>{index + 1}</Text>
                <Text>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
