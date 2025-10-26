import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const [searchHistory, setSearchHistory] = useState([
    '高等数学',
    'Python',
    '创业项目',
    '期末复习'
  ])
  const [hotKeywords] = useState([
    '线性代数',
    '数据结构',
    '机器学习',
    '考研经验',
    '实验室',
    '竞赛组队'
  ])

  const handleSearch = () => {
    if (!keyword.trim()) return
    
    if (!searchHistory.includes(keyword)) {
      setSearchHistory([keyword, ...searchHistory.slice(0, 9)])
    }

    console.log('搜索:', keyword)
  }

  const handleHotKeywordClick = (kw: string) => {
    setKeyword(kw)
    Taro.showToast({
      title: `搜索 "${kw}"`,
      icon: 'none'
    })
  }

  const clearHistory = () => {
    Taro.showModal({
      title: '提示',
      content: '确认清空搜索历史？',
      success: (res) => {
        if (res.confirm) {
          setSearchHistory([])
        }
      }
    })
  }

  return (
    <View className='search-page'>
      <View className='search-bar'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <View className='iconify-icon' data-icon='mdi:arrow-left' />
        </View>
        <View className='search-input'>
          <View className='iconify-icon' data-icon='mdi:magnify' />
          <Input
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
            placeholder='搜索话题、用户'
            placeholderClass='placeholder'
            confirmType='search'
          />
        </View>
        <Text className='search-btn' onClick={handleSearch}>搜索</Text>
      </View>

      {searchHistory.length > 0 && (
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>搜索历史</Text>
            <View className='clear-btn' onClick={clearHistory}>
              <View className='iconify-icon' data-icon='mdi:delete-outline' />
            </View>
          </View>
          <View className='tag-list'>
            {searchHistory.map((item, index) => (
              <View 
                key={index} 
                className='tag-item'
                onClick={() => handleHotKeywordClick(item)}
              >
                {item}
              </View>
            ))}
          </View>
        </View>
      )}

      <View className='section'>
        <View className='section-header'>
          <Text className='section-title'>热门搜索</Text>
        </View>
        <View className='tag-list hot'>
          {hotKeywords.map((item, index) => (
            <View 
              key={index} 
              className='tag-item'
              onClick={() => handleHotKeywordClick(item)}
            >
              <View className='hot-icon'>
                <View className='iconify-icon' data-icon='mdi:fire' />
              </View>
              {item}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
