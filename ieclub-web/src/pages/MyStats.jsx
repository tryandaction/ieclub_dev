import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award, Activity, Target, BarChart3, Zap } from 'lucide-react';
import { request } from '../utils/request';
import { useAuth } from '../contexts/AuthContext';

export default function MyStats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载用户信息和统计数据
      const [profileRes, statsRes] = await Promise.all([
        request.get(`/profile/${user.id}`),
        request.get(`/profile/${user.id}/stats`)
      ]);

      setProfile(profileRes.data || profileRes);
      setStats(statsRes.data || statsRes);
    } catch (error) {
      console.error('加载数据失败:', error);
      alert(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化数字
  const formatNumber = (num) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };

  // 计算升级进度
  const calculateProgress = () => {
    const level = profile?.level || 1;
    const exp = profile?.exp || 0;
    const expToNext = level * 100;
    const currentLevelExp = exp % expToNext;
    return {
      current: currentLevelExp,
      total: expToNext,
      percentage: Math.round((currentLevelExp / expToNext) * 100)
    };
  };

  // 处理发布类型数据
  const getPostTypesData = () => {
    if (!stats?.postsByType) return [];
    
    const typeMap = {
      topic: { name: '话题讨论', icon: '💬', color: '#8b5cf6' },
      question: { name: '提问求助', icon: '❓', color: '#3b82f6' },
      share: { name: '经验分享', icon: '📚', color: '#10b981' },
      activity: { name: '活动发布', icon: '🎉', color: '#f59e0b' }
    };

    const types = [];
    let total = 0;

    for (const [key, count] of Object.entries(stats.postsByType)) {
      total += count;
    }

    for (const [key, count] of Object.entries(stats.postsByType)) {
      const typeInfo = typeMap[key] || { name: key, icon: '📄', color: '#6b7280' };
      types.push({
        ...typeInfo,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      });
    }

    return types.sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const progress = calculateProgress();
  const postTypes = getPostTypesData();

  const overviewCards = [
    { icon: '📝', label: '总发布', value: stats?.totalPosts || 0, color: 'purple' },
    { icon: '👁️', label: '总浏览', value: formatNumber(stats?.totalViews || 0), color: 'blue' },
    { icon: '👍', label: '总点赞', value: formatNumber(stats?.totalLikes || 0), color: 'pink' },
    { icon: '💬', label: '总评论', value: formatNumber(stats?.totalComments || 0), color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            我的数据统计
          </h1>
          <p className="text-gray-500 mt-2">全面了解你的成长轨迹和活跃表现</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 mb-6 text-white">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={profile?.avatar || '/default-avatar.png'}
              alt="头像"
              className="w-20 h-20 rounded-full border-4 border-white/30"
            />
            <div>
              <h2 className="text-2xl font-bold">{profile?.nickname || '用户'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  LV{profile?.level || 1}
                </span>
                {profile?.isCertified && (
                  <span className="px-3 py-1 bg-blue-500/80 rounded-full text-sm">
                    ✓ 已认证
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 经验进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>经验值</span>
              <span>{progress.current} / {progress.total} EXP</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* 积分 */}
          <div className="mt-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-300" />
            <span className="text-lg font-semibold">积分余额: {profile?.credits || 0}</span>
          </div>
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {overviewCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">{card.icon}</div>
                <div>
                  <div className={`text-3xl font-bold text-${card.color}-600`}>
                    {card.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{card.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 发布类型分布 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              发布类型分布
            </h3>
            {postTypes.length > 0 ? (
              <div className="space-y-4">
                {postTypes.map((type, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{type.icon}</span>
                        <span className="font-medium text-gray-700">{type.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{type.count}篇</span>
                        <span className="text-sm text-gray-500 ml-2">{type.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${type.percentage}%`,
                          backgroundColor: type.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                还没有发布任何内容
              </div>
            )}
          </div>

          {/* 活跃度数据 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              活跃度
            </h3>
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-1">最近活跃</div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.lastActiveAt ? new Date(stats.lastActiveAt).toLocaleDateString() : '暂无记录'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats?.totalPosts || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">本月发布</div>
                </div>
                <div className="bg-pink-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-pink-600">{stats?.totalLikes || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">本月获赞</div>
                </div>
              </div>
            </div>
          </div>

          {/* 成就展示 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-600" />
              我的成就
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="font-semibold text-yellow-900">活跃用户</div>
                <div className="text-xs text-yellow-700 mt-1">连续活跃7天</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 text-center opacity-60">
                <div className="text-4xl mb-2">🌟</div>
                <div className="font-semibold text-gray-700">内容达人</div>
                <div className="text-xs text-gray-600 mt-1">发布10篇内容</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 text-center opacity-60">
                <div className="text-4xl mb-2">💪</div>
                <div className="font-semibold text-gray-700">人气作者</div>
                <div className="text-xs text-gray-600 mt-1">获得100个点赞</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 text-center opacity-60">
                <div className="text-4xl mb-2">🏆</div>
                <div className="font-semibold text-gray-700">社区领袖</div>
                <div className="text-xs text-gray-600 mt-1">获得1000粉丝</div>
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <span className="font-semibold">成长小贴士：</span>
            持续发布优质内容，积极参与讨论互动，可以获得更多经验值和积分，解锁更多成就！
          </div>
        </div>
      </div>
    </div>
  );
}
