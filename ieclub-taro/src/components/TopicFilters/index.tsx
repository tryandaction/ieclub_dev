// ==================== 话题筛选器组件（增强版） ====================

import { View, Picker } from '@tarojs/components'
import { useState } from 'react'
import type { TopicListParams } from '@/types'
import './index.scss'

interface TopicFiltersProps {
  filters: TopicListParams
  onChange: (filters: Partial<TopicListParams>) => void
}

export default function TopicFilters({ filters, onChange }: TopicFiltersProps) {
  const sortOptions = [
    { label: '最新', value: 'latest' },
    { label: '最热', value: 'hot' },
    { label: '精华', value: 'featured' }
  ]

  const categoryOptions = [
    { label: '全部', value: '' },
    { label: '技术', value: 'tech' },
    { label: '科学', value: 'science' },
    { label: '生活', value: 'life' },
    { label: '学习', value: 'study' },
    { label: '其他', value: 'other' }
  ]

  const [sortIndex, setSortIndex] = useState(0)
  const [categoryIndex, setCategoryIndex] = useState(0)

  const handleSortChange = (e: any) => {
    const index = e.detail.value
    setSortIndex(index)
    onChange({ sortBy: sortOptions[index].value as any })
  }

  const handleCategoryChange = (e: any) => {
    const index = e.detail.value
    setCategoryIndex(index)
    onChange({ category: categoryOptions[index].value || undefined })
  }

  return (
    <View className='topic-filters'>
      <Picker
        mode='selector'
        range={sortOptions.map(o => o.label)}
        value={sortIndex}
        onChange={handleSortChange}
      >
        <View className='filter-item'>
          <View className='filter-label'>{sortOptions[sortIndex].label}</View>
          <View className='filter-arrow'>▼</View>
        </View>
      </Picker>

      <Picker
        mode='selector'
        range={categoryOptions.map(o => o.label)}
        value={categoryIndex}
        onChange={handleCategoryChange}
      >
        <View className='filter-item'>
          <View className='filter-label'>{categoryOptions[categoryIndex].label}</View>
          <View className='filter-arrow'>▼</View>
        </View>
      </Picker>
    </View>
  )
}