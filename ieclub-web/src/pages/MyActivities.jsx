import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { request } from '../utils/request';
import { useAuth } from '../contexts/AuthContext';

export default function MyActivities() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentTab, setCurrentTab] = useState(0); // 0: 我参加的, 1: 我组织的
  const pageSize = 10;

  const tabs = ['我参加的', '我组织的'];

  useEffect(() => {
    if (user?.id) {
      loadActivities(true);
    }
  }, [user, currentTab]);

  // 加载活动列表
  const loadActivities = async (isRefresh = false) => {
    if (loading) return;
    if (!user?.id) return;

    setLoading(true);

    try {
      const currentPage = isRefresh ? 1 : page;
      const type = currentTab === 0 ? 'joined' : 'organized';
      
      const res = await request.get('/activities/me/activities', {
        params: { type, page: currentPage, pageSize }
      });

      const { activities: newActivities = [], total: newTotal = 0, hasMore: more = false } = res.data || res;

      // 格式化活动数据
      const formattedActivities = newActivities.map(formatActivity);

      setActivities(isRefresh ? formattedActivities : [...activities, ...formattedActivities]);
      setTotal(newTotal);
      setPage(currentPage + 1);
      setHasMore(more);
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化活动数据
  const formatActivity = (activity) => {
    const now = new Date();
    const startTime = new Date(activity.startTime);
    const endTime = new Date(activity.endTime);

    let status = 'upcoming';
    let statusText = '即将开始';
    let statusColor = 'bg-blue-500';

    if (now > endTime) {
      status = 'ended';
      statusText = '已结束';
      statusColor = 'bg-gray-500';
    } else if (now >= startTime && now <= endTime) {
      status = 'ongoing';
      statusText = '进行中';
      statusColor = 'bg-green-500';
    }

    return {
      ...activity,
      status,
      statusText,
      statusColor,
      timeText: formatTime(activity.startTime, activity.endTime),
      participantText: `${activity._count?.participants || 0}/${activity.maxParticipants || 0}`,
      categoryName: activity.category?.name || '其他'
    };
  };

  // 格式化时间
  const formatTime = (startTime, endTime) => {
    if (!startTime) return '';

    const start = new Date(startTime);
    const month = start.getMonth() + 1;
    const date = start.getDate();
    const hours = start.getHours();
    const minutes = String(start.getMinutes()).padStart(2, '0');

    let timeStr = `${month}/${date} ${hours}:${minutes}`;

    if (endTime) {
      const end = new Date(endTime);
      const endHours = end.getHours();
      const endMinutes = String(end.getMinutes()).padStart(2, '0');
      timeStr += ` - ${endHours}:${endMinutes}`;
    }

    return timeStr;
  };

  // 切换Tab
  const handleTabChange = (index) => {
    if (index === currentTab) return;
    setCurrentTab(index);
    setPage(1);
    setActivities([]);
  };

  // 跳转到活动详情
  const goToActivityDetail = (id) => {
    navigate(`/activities/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-gray-50">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-8 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Calendar className="w-12 h-12" />
            <h1 className="text-4xl font-bold">我的活动</h1>
          </div>

          {/* Tab切换 */}
          <div className="flex gap-8">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(index)}
                className={`pb-3 text-lg font-semibold transition-all relative ${
                  currentTab === index
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {tab}
                {currentTab === index && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 活动列表 */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* 加载中骨架屏 */}
        {loading && activities.length === 0 && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 活动列表 */}
        {!loading || activities.length > 0 ? (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => goToActivityDetail(activity.id)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                {/* 活动封面 */}
                <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                  {activity.cover ? (
                    <img
                      src={activity.cover}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl opacity-40">
                      🎊
                    </div>
                  )}

                  {/* 状态标签 */}
                  <div className={`absolute top-4 right-4 px-4 py-1.5 ${activity.statusColor} text-white rounded-full text-sm font-semibold backdrop-blur-md`}>
                    {activity.statusText}
                  </div>
                </div>

                {/* 活动信息 */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {activity.title}
                  </h3>

                  {/* 时间地点 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{activity.timeText}</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{activity.location}</span>
                      </div>
                    )}
                  </div>

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                      {activity.categoryName}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-semibold">{activity.participantText}</span>
                    </div>
                  </div>

                  {/* 参与状态（仅"我参加的"显示） */}
                  {currentTab === 0 && activity.participationStatus && (
                    <div className="mt-3 flex gap-2">
                      {activity.checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          已签到
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          <Clock className="w-4 h-4" />
                          {activity.participationStatus === 'confirmed' ? '已报名' : '待确认'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 空状态 */}
        {!loading && activities.length === 0 && (
          <div className="text-center py-24">
            <div className="text-8xl mb-6 opacity-60">{currentTab === 0 ? '🎪' : '🎭'}</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {currentTab === 0 ? '还没有参加任何活动' : '还没有组织活动'}
            </h3>
            <p className="text-gray-600 mb-8">
              {currentTab === 0 ? '快去发现感兴趣的活动吧' : '创建活动，召集志同道合的伙伴'}
            </p>
            <button
              onClick={() => navigate('/activities')}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
            >
              发现活动
            </button>
          </div>
        )}

        {/* 加载更多 */}
        {activities.length > 0 && (
          <div className="text-center mt-8">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>加载中...</span>
              </div>
            ) : hasMore ? (
              <button
                onClick={() => loadActivities(false)}
                className="px-8 py-3 bg-white text-amber-500 rounded-full font-semibold hover:bg-amber-50 transition-all border-2 border-amber-500"
              >
                加载更多
              </button>
            ) : (
              <div className="flex items-center justify-center gap-4 text-gray-400">
                <span className="flex-1 h-px bg-gray-300"></span>
                <span>没有更多了</span>
                <span className="flex-1 h-px bg-gray-300"></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
