import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store'
import './index.scss'

// 菜单项组件
function MenuItem({ icon, label, badge, onClick }) {
  return (
    <View className="menu-item" onClick={onClick}>
      <View className="menu-left">
        <Text className="menu-icon">{icon}</Text>
        <Text className="menu-label">{label}</Text>
      </View>
      <View className="menu-right">
        {badge && (
          <View className="menu-badge">
            <Text className="badge-text">{badge}</Text>
          </View>
        )}
        <Text className="menu-arrow">›</Text>
      </View>
    </View>
  )
}

export default function ProfilePage() {
  const { currentUser } = useUserStore()

  const handleMenuClick = (label) => {
    Taro.showToast({
      title: label,
      icon: 'none'
    })
  }

  const handleEditProfile = () => {
    Taro.showToast({
      title: '编辑个人资料',
      icon: 'none'
    })
  }

  return (
    <View className="profile-page">
      {/* 用户信息区域 */}
      <View className="user-header">
        <View className="user-avatar-large">
          <Text className="avatar-emoji">{currentUser.avatar}</Text>
        </View>
        
        <Text className="user-name">{currentUser.name}</Text>
        <Text className="user-school">{currentUser.major} · {currentUser.grade}</Text>
        <Text className="user-bio">{currentUser.bio}</Text>

        <View className="user-badges">
          <View className="user-level-badge">
            <Text className="level-badge-text">LV{currentUser.level}</Text>
          </View>
          <View className="user-score-badge">
            <Text className="score-icon">⭐</Text>
            <Text className="score-text">{currentUser.score}</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="profile-content">
        {/* 统计区域 */}
        <View className="stats-container">
          <View className="stat-item">
            <Text className="stat-value">{currentUser.stats.topics}</Text>
            <Text className="stat-label">话题</Text>
          </View>
          <View className="stat-divider" />
          <View className="stat-item">
            <Text className="stat-value">{currentUser.stats.comments}</Text>
            <Text className="stat-label">评论</Text>
          </View>
          <View className="stat-divider" />
          <View className="stat-item">
            <Text className="stat-value">{currentUser.stats.followers}</Text>
            <Text className="stat-label">粉丝</Text>
          </View>
          <View className="stat-divider" />
          <View className="stat-item">
            <Text className="stat-value">{currentUser.stats.following}</Text>
            <Text className="stat-label">关注</Text>
          </View>
        </View>

        {/* 编辑按钮 */}
        <View className="edit-profile-btn" onClick={handleEditProfile}>
          <Text className="edit-btn-text">编辑个人资料</Text>
        </View>

        {/* 技能标签 */}
        <View className="skills-section">
          <Text className="section-title">擅长技能</Text>
          <View className="skills-container">
            {currentUser.skills.map((skill, index) => (
              <View key={index} className="skill-tag">
                <Text className="skill-text">{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 成就勋章 */}
        <View className="badges-section">
          <Text className="section-title">我的成就</Text>
          <View className="badges-container">
            {currentUser.badges.map((badge, index) => (
              <Text key={index} className="badge-emoji">{badge}</Text>
            ))}
          </View>
        </View>

        {/* 菜单列表 */}
        <View className="menu-section">
          <MenuItem 
            icon="📝" 
            label="我的话题" 
            badge="23"
            onClick={() => handleMenuClick('我的话题')}
          />
          <MenuItem 
            icon="🎤" 
            label="我来讲" 
            badge="8"
            onClick={() => handleMenuClick('我来讲')}
          />
          <MenuItem 
            icon="📅" 
            label="我的活动" 
            onClick={() => handleMenuClick('我的活动')}
          />
          <MenuItem 
            icon="⭐" 
            label="收藏" 
            badge="45"
            onClick={() => handleMenuClick('收藏')}
          />
          <MenuItem 
            icon="🏆" 
            label="成就中心" 
            onClick={() => handleMenuClick('成就中心')}
          />
          <MenuItem 
            icon="⚙️" 
            label="设置" 
            onClick={() => handleMenuClick('设置')}
          />
        </View>
      </ScrollView>
    </View>
  )
}
