import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCommunityStore } from '../../store'
import './index.scss'

// 用户卡片组件
function UserCard({ user }) {
  const { toggleFollow } = useCommunityStore()

  const handleFollow = (e) => {
    e.stopPropagation()
    toggleFollow(user.id)
    Taro.showToast({
      title: user.isFollowing ? '已取消关注' : '关注成功',
      icon: 'success',
      duration: 1500
    })
  }

  const handleCardClick = () => {
    Taro.showToast({
      title: `查看 ${user.name} 的主页`,
      icon: 'none'
    })
  }

  return (
    <View className="user-card" onClick={handleCardClick}>
      <View className="user-avatar">
        <Text className="avatar-emoji">{user.avatar}</Text>
      </View>
      
      <View className="user-info">
        <View className="user-name-row">
          <Text className="user-name">{user.name}</Text>
          <View className="user-level">
            <Text className="level-text">LV{user.level}</Text>
          </View>
        </View>
        
        <Text className="user-major">{user.major}</Text>
        <Text className="user-bio">{user.bio}</Text>
        
        <View className="user-stats">
          <View className="stat-item">
            <Text className="stat-value">{user.stats.topics}</Text>
            <Text className="stat-label">话题</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{user.stats.followers}</Text>
            <Text className="stat-label">粉丝</Text>
          </View>
        </View>
        
        <View 
          className={`follow-btn ${user.isFollowing ? 'following' : ''}`}
          onClick={handleFollow}
        >
          <Text className="follow-text">
            {user.isFollowing ? '已关注' : '+ 关注'}
          </Text>
        </View>
      </View>
    </View>
  )
}

// 排行榜组件
function Leaderboard({ users }) {
  return (
    <View className="leaderboard">
      <View className="leaderboard-header">
        <Text className="leaderboard-icon">🏆</Text>
        <Text className="leaderboard-title">本周排行榜</Text>
        <Text className="leaderboard-more">查看更多 ›</Text>
      </View>
      
      <View className="leaderboard-list">
        {users.slice(0, 3).map((user, index) => (
          <View key={user.id} className="leaderboard-item">
            <View className={`rank-badge rank-${index + 1}`}>
              <Text className="rank-text">{index + 1}</Text>
            </View>
            <Text className="rank-avatar">{user.avatar}</Text>
            <View className="rank-info">
              <Text className="rank-name">{user.name}</Text>
              <Text className="rank-score">{user.score}分</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default function CommunityPage() {
  const { users } = useCommunityStore()

  return (
    <View className="community-page">
      <View className="community-header">
        <Text className="page-title">发现伙伴</Text>
      </View>

      <ScrollView scrollY className="community-content">
        {/* 排行榜 */}
        <Leaderboard users={users} />
        
        {/* 用户列表 */}
        <View className="section-header">
          <Text className="section-title">可能认识的人</Text>
        </View>
        
        <View className="user-grid">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
