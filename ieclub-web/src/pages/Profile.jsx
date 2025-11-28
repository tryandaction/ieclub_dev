import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProfile, getUserPosts, getUserStats } from '../api/profile'
import { followUser, unfollowUser } from '../api/user'
import { showToast } from '../components/Toast'
import PostCard from '../components/PostCard'

// 获取完整图片URL（图片走静态文件服务，不走/api）
const getFullImageUrl = (url) => {
  if (!url) return null;
  // 渐变背景直接返回
  if (url.startsWith('linear-gradient')) return url;
  // 已经是完整URL
  if (url.startsWith('http')) return url;
  // 相对路径，添加网站根地址（不是API地址）
  const siteUrl = 'https://ieclub.online';
  return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function Profile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('posts') // posts, about, achievements
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    loadProfile()
    loadPosts()
    loadStats()
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await getProfile(userId)
      console.log('✅ Profile数据加载成功:', data)
      setProfile(data)
      setIsFollowing(data.isFollowing || false)
    } catch (error) {
      console.error('❌ 加载个人主页失败:', error)
      showToast(error.message || '加载个人主页失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const data = await getUserPosts(userId)
      console.log('✅ Posts数据加载成功:', data)
      setPosts(data.posts || data || [])
    } catch (error) {
      console.error('❌ 加载发布内容失败:', error)
      setPosts([])
    }
  }

  const loadStats = async () => {
    try {
      const data = await getUserStats(userId)
      console.log('✅ Stats数据加载成功:', data)
      setStats(data)
    } catch (error) {
      console.error('❌ 加载统计数据失败:', error)
      setStats(null)
    }
  }

  // 处理关注/取消关注
  const handleFollow = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      navigate('/login')
      return
    }

    try {
      setFollowLoading(true)
      if (isFollowing) {
        await unfollowUser(userId)
        setIsFollowing(false)
        setProfile(prev => ({
          ...prev,
          fansCount: Math.max(0, (prev.fansCount || 0) - 1)
        }))
        showToast('已取消关注', 'success')
      } else {
        await followUser(userId)
        setIsFollowing(true)
        setProfile(prev => ({
          ...prev,
          fansCount: (prev.fansCount || 0) + 1
        }))
        showToast('关注成功 ✓', 'success')
      }
    } catch (error) {
      console.error('关注操作失败:', error)
      showToast(error.response?.data?.message || '操作失败', 'error')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">用户不存在</p>
            <button
            onClick={() => navigate('/plaza')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            返回广场
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 封面图 */}
      <div 
        className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 relative"
        style={profile.coverImage ? (
          profile.coverImage.startsWith('linear-gradient') 
            ? { background: profile.coverImage }
            : {
                backgroundImage: `url(${getFullImageUrl(profile.coverImage)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
        ) : undefined}
      >
        {profile.isOwner && (
          <Link
            to={`/profile/${userId}/edit`}
            className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur rounded-lg text-sm font-medium hover:bg-white transition z-10"
          >
            ✏️ 编辑主页
          </Link>
        )}
      </div>

      {/* 主要内容 */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
      {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* 头像 */}
            <img
              src={getFullImageUrl(profile.avatar) || '/default-avatar.png'}
              alt={profile.nickname}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            />

            {/* 信息区 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.nickname}</h1>
                {profile.isCertified && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    ✓ 已认证
                  </span>
                )}
                {profile.level && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                    Lv.{profile.level}
                  </span>
                )}
              </div>

              {profile.motto && (
                <p className="text-gray-600 italic mb-3">"{profile.motto}"</p>
              )}

              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              {/* 学校信息 */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                {profile.school && (
                  <span className="flex items-center gap-1">
                    🏫 {profile.school}
                  </span>
                )}
                {profile.major && (
                  <span className="flex items-center gap-1">
                    📚 {profile.major}
                  </span>
                )}
                {profile.grade && (
                  <span className="flex items-center gap-1">
                    🎓 {profile.grade}
                  </span>
                )}
              </div>

              {/* 社交链接 */}
              {(profile.website || profile.github || profile.bilibili) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      🌐 个人网站
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      💻 GitHub
                    </a>
                  )}
                  {profile.bilibili && (
                    <a
                      href={profile.bilibili}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      📺 Bilibili
                    </a>
                  )}
                  </div>
                )}

              {/* 统计数据 */}
              <div className="flex gap-6 text-sm">
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate('/my-topics')}
                >
                  <div className="text-xl font-bold text-purple-600">
                    {stats?.totalPosts || profile.topicsCount || profile._count?.topics || 0}
                  </div>
                  <div className="text-gray-500">发布</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate(`/my-following/${userId}`)}
                >
                  <div className="text-xl font-bold text-purple-600">
                    {profile.followsCount || profile.followingCount || profile._count?.follows || 0}
                  </div>
                  <div className="text-gray-500">关注</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate(`/my-followers/${userId}`)}
                >
                  <div className="text-xl font-bold text-purple-600">
                    {profile.fansCount || profile.followerCount || profile._count?.followers || 0}
                  </div>
                  <div className="text-gray-500">粉丝</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {stats?.totalLikes || profile.likesCount || 0}
                  </div>
                  <div className="text-gray-500">获赞</div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            {!profile.isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                  }`}
                >
                  {followLoading ? '...' : isFollowing ? '✓ 已关注' : '+ 关注'}
                </button>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('token')
                    if (!token) {
                      showToast('请先登录', 'warning')
                      navigate('/login')
                      return
                    }
                    // 获取或创建会话，然后跳转
                    fetch(`https://ieclub.online/api/messages/conversation/${userId}`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          navigate(`/messages/${data.data.conversationId}`)
                        } else {
                          showToast('无法发起对话', 'error')
                        }
                      })
                      .catch(() => showToast('网络错误', 'error'))
                  }}
                  className="px-6 py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  💬 私信
                </button>
              </div>
            )}
          </div>

          {/* 技能和兴趣标签 */}
          <div className="mt-6 pt-6 border-t">
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">✨ 技能</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">❤️ 兴趣</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab导航 */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 font-medium transition ${
                activeTab === 'posts'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              发布内容 ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-4 font-medium transition ${
                activeTab === 'about'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              关于我
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-4 font-medium transition ${
                activeTab === 'achievements'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              成就勋章
            </button>
          </div>

          <div className="p-6">
            {/* 发布内容 */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    还没有发布任何内容
                  </div>
                )}
              </div>
            )}

            {/* 关于我 */}
            {activeTab === 'about' && (
              <div className="prose max-w-none">
                {profile.introduction ? (
                  <div className="whitespace-pre-wrap">{profile.introduction}</div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    这个人很懒，什么都没写
                  </div>
                )}
              </div>
            )}

            {/* 成就勋章 */}
            {activeTab === 'achievements' && (
              <div>
                {/* 勋章展示 */}
                {profile.badges && profile.badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                    {profile.badges.map((badge, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 text-center"
                      >
                        <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                        <div className="font-medium text-sm">{badge.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(badge.awardedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 mb-8">
                    还没有获得任何勋章
                  </div>
                )}

                {/* 个人成就列表 */}
                {profile.achievements && profile.achievements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4">🎯 个人成就</h3>
                    <div className="space-y-3">
                      {profile.achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="font-medium">{achievement.title}</div>
                          {achievement.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {achievement.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
