// ==================== 热点栏组件 ====================

import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { getTrendingKeywords } from '@/services/trending'
import type { TrendingKeyword } from '@/types'
import './index.scss'

export default function TrendingBar() {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([])

  useEffect(() => {
    loadTrendingKeywords()
    
    // 每5分钟刷新一次
    const interval = setInterval(loadTrendingKeywords, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadTrendingKeywords = async () => {
    try {
      const res = await getTrendingKeywords(10)
      setKeywords(res.keywords)
    } catch (error) {
      console.error('获取热点失败:', error)
    }
  }

  const handleKeywordClick = (keyword: string) => {
    Taro.navigateTo({
      url: `/pages/trending/index?keyword=${encodeURIComponent(keyword)}`
    })
  }

  if (keywords.length === 0) return null

  return (
    <View className='trending-bar'>
      <View className='trending-header'>
        <Text className='icon'>🔥</Text>
        <Text className='title'>正在热议</Text>
      </View>
      
      <ScrollView className='trending-scroll' scrollX>
        <View className='trending-list'>
          {keywords.map((keyword, index) => (
            <View
              key={keyword.word}
              className='trending-item'
              onClick={() => handleKeywordClick(keyword.word)}
            >
              <Text className='rank'>{index + 1}</Text>
              <Text className='word'>{keyword.word}</Text>
              {keyword.growth > 2 && (
                <View className='hot-badge'>🔥</View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}