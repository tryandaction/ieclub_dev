import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, UserPlus, UserCheck, RefreshCw, Search } from 'lucide-react';
import { getUserFollowers, getUserFollowing } from '../api/profile';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

export default function MyFollowers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userId: paramUserId } = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // 确定要查看的用户ID（可以是自己或他人）
  const targetUserId = paramUserId || user?.id;
  const isMyProfile = targetUserId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadFollowers(true);
    }
  }, [targetUserId]);

  // 加载粉丝列表
  const loadFollowers = async (isRefresh = false) => {
    if (loading) return;
    if (!targetUserId) return;

    setLoading(true);

    try {
      const currentPage = isRefresh ? 1 : page;
      const res = await getUserFollowers(targetUserId, { 
        page: currentPage, 
        pageSize: limit 
      });

      // 后端返回格式: {success, data: {users, total, ...}}
      const data = res?.data?.data || res?.data || res;
      const followers = data?.users || [];
      const totalCount = data?.total || 0;

      // 如果是查看自己的粉丝，需要检查是否已回关
      if (isMyProfile && user?.id) {
        const followersWithStatus = await checkFollowStatus(followers);
        setUsers(isRefresh ? followersWithStatus : [...users, ...followersWithStatus]);
      } else {
        setUsers(isRefresh ? followers : [...users, ...followers]);
      }

      setTotal(totalCount);
      setPage(currentPage + 1);
      setHasMore(followers.length >= limit);
    } catch (error) {
      console.error('加载粉丝列表失败:', error);
      showToast('加载粉丝列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 检查关注状态
  const checkFollowStatus = async (followers) => {
    try {
      // 获取当前用户的关注列表
      const res = await getUserFollowing(user.id, { 
        page: 1, 
        pageSize: 1000 
      });

      // 后端返回格式: {success, data: {users, ...}}
      const data = res?.data?.data || res?.data || res;
      const followingIds = (data?.users || []).map(u => u.id);

      return followers.map(follower => ({
        ...follower,
        isFollowing: followingIds.includes(follower.id)
      }));
    } catch (error) {
      console.error('检查关注状态失败:', error);
      return followers.map(f => ({ ...f, isFollowing: false }));
    }
  };

  // 关注/取消关注
  const handleFollow = async (userId, isCurrentlyFollowing) => {
    try {
      await request.post(`/users/${userId}/follow`);
      
      // 更新列表中的关注状态
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
      ));
    } catch (error) {
      console.error('操作失败:', error);
      showToast(error.message || '操作失败', 'error');
    }
  };

  // 跳转到用户详情
  const goToUserDetail = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-gray-50">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-8 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Heart className="w-12 h-12" />
            <h1 className="text-4xl font-bold">{isMyProfile ? '我的粉丝' : 'TA的粉丝'}</h1>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{total}</div>
              <div className="text-lg opacity-80">粉丝数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* 加载中骨架屏 */}
        {loading && users.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 用户列表 */}
        {!loading || users.length > 0 ? (
          <div className="space-y-4">
            {users.map((follower, index) => (
              <div
                key={follower.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                onClick={() => goToUserDetail(follower.id)}
              >
                <div className="flex items-center gap-4">
                  {/* 用户头像 - 点击跳转个人主页 */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      goToUserDetail(follower.id);
                    }}
                    className="relative cursor-pointer shrink-0"
                  >
                    <img
                      src={follower.avatar || '/default-avatar.png'}
                      alt={follower.nickname}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-pink-500/20 hover:ring-pink-500/50 hover:scale-105 transition-all duration-200"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/10 transition-all" />
                  </div>
                  
                  {/* 用户信息 - 点击跳转个人主页 */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToUserDetail(follower.id);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-800 truncate hover:text-pink-600 transition-colors">
                        {follower.nickname || '未设置昵称'}
                      </h3>
                      {follower.verified && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {follower.bio || '这个人很懒，什么都没写~'}
                    </p>
                  </div>

                  {/* 关注按钮（只有查看自己时显示） */}
                  {isMyProfile && (
                    follower.isFollowing ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('确定要取消关注吗？')) {
                            handleFollow(follower.id, true);
                          }
                        }}
                        className="px-6 py-2 border-2 border-pink-500 text-pink-500 rounded-full font-semibold hover:bg-pink-500 hover:text-white transition-all flex items-center gap-2 shrink-0"
                      >
                        <UserCheck className="w-4 h-4" />
                        已关注
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(follower.id, false);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        关注
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 空状态 */}
        {!loading && users.length === 0 && (
          <div className="text-center py-24">
            <div className="text-8xl mb-6 opacity-60">👥</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {isMyProfile ? '还没有粉丝' : 'TA还没有粉丝'}
            </h3>
            <p className="text-gray-600 mb-8">
              {isMyProfile ? '多发布优质内容吸引粉丝吧' : ''}
            </p>
            {isMyProfile && (
              <button
                onClick={() => navigate('/plaza')}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                <Search className="w-5 h-5" />
                去广场逛逛
              </button>
            )}
          </div>
        )}

        {/* 加载更多 */}
        {users.length > 0 && (
          <div className="text-center mt-8">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>加载中...</span>
              </div>
            ) : hasMore ? (
              <button
                onClick={() => loadFollowers(false)}
                className="px-8 py-3 bg-white text-pink-500 rounded-full font-semibold hover:bg-pink-50 transition-all border-2 border-pink-500"
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
