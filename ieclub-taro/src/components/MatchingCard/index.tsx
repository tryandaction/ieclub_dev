// ==================== 匹配卡片组件 ====================

import { View, Image, Text } from '@tarojs/components'
import type { DemandMatchResult } from '@/types'
import './index.scss'

interface MatchingCardProps {
  match: DemandMatchResult
  onContact?: () => void
}

export default function MatchingCard({ match, onContact }: MatchingCardProps) {
  const { user, score, matchedSkills, reasons } = match

  return (
    <View className='matching-card'>
      <View className='match-score'>
        <Text className='score-value'>{score}</Text>
        <Text className='score-label'>匹配度</Text>
      </View>

      <View className='user-info'>
        <Image className='avatar' src={user.avatar} mode='aspectFill' />
        <View className='info'>
          <Text className='nickname'>{user.nickname}</Text>
          <Text className='bio'>{user.bio || '暂无简介'}</Text>
        </View>
      </View>

      <View className='matched-skills'>
        <Text className='skills-label'>匹配技能：</Text>
        {matchedSkills.map(skill => (
          <View key={skill} className='skill-tag'>💪 {skill}</View>
        ))}
      </View>

      <View className='match-reasons'>
        {reasons.map((reason, index) => (
          <View key={index} className='reason-item'>
            <Text className='bullet'>•</Text>
            <Text className='reason-text'>{reason}</Text>
          </View>
        ))}
      </View>

      <View className='actions'>
        <View className='action-btn primary' onClick={onContact}>
          立即联系
        </View>
        <View className='action-btn'>查看主页</View>
      </View>
    </View>
  )
}