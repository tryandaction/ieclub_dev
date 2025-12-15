import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, UserCheck, RefreshCw, Search } from 'lucide-react';
import { getUserFollowing } from '../api/profile';
import { unfollowUser } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

export default function MyFollowing() {
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
      loadFollowing(true);
    }
  }, [targetUserId]);

  // 加载关注列表
  const loadFollowing = async (isRefresh = false) => {
    if (loading) return;
    if (!targetUserId) return;

    setLoading(true);

    try {
      const currentPage = isRefresh ? 1 : page;
      const res = await getUserFollowing(targetUserId, { 
        page: currentPage, 
        pageSize: limit 
      });

      // 后端返回格式: {success, data: {users, total, ...}}
      const data = res?.data?.data || res?.data || res;
      const following = data?.users || [];
      const totalCount = data?.total || 0;

      setUsers(isRefresh ? following : [...users, ...following]);
      setTotal(totalCount);
      setPage(currentPage + 1);
      setHasMore(following.length >= limit);
    } catch (error) {
      console.error('加载关注列表失败:', error);
      showToast('加载关注列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 取消关注
  const handleUnfollow = async (userId) => {
    try {
      await unfollowUser(userId);
      // 从列表中移除
      setUsers(users.filter(u => u.id !== userId));
      setTotal(prev => Math.max(0, prev - 1));
      showToast('已取消关注', 'success');
    } catch (error) {
      console.error('取消关注失败:', error);
      const errorMsg = error.response?.data?.message || error.message || '';
      if (errorMsg.includes('未关注')) {
        // 状态不同步，从列表移除
        setUsers(users.filter(u => u.id !== userId));
        setTotal(prev => Math.max(0, prev - 1));
      } else {
        showToast(errorMsg || '操作失败', 'error');
      }
    }
  };

  // 跳转到用户详情
  const goToUserDetail = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-8 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Users className="w-12 h-12" />
            <h1 className="text-4xl font-bold">{isMyProfile ? '我的关注' : 'TA的关注'}</h1>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{total}</div>
              <div className="text-lg opacity-80">关注数</div>
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
            {users.map((followingUser, index) => (
              <div
                key={followingUser.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                onClick={() => goToUserDetail(followingUser.id)}
              >
                <div className="flex items-center gap-4">
                  {/* 用户头像 - 点击跳转个人主页 */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      goToUserDetail(followingUser.id);
                    }}
                    className="relative cursor-pointer shrink-0"
                  >
                    <img
                      src={followingUser.avatar || '/default-avatar.png'}
                      alt={followingUser.nickname}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-cyan-500/20 hover:ring-cyan-500/50 hover:scale-105 transition-all duration-200"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/10 transition-all" />
                  </div>
                  
                  {/* 用户信息 - 点击跳转个人主页 */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToUserDetail(followingUser.id);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-800 truncate hover:text-cyan-600 transition-colors">
                        {followingUser.nickname || '未设置昵称'}
                      </h3>
                      {followingUser.verified && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {followingUser.bio || '这个人很懒，什么都没写~'}
                    </p>
                  </div>

                  {/* 取消关注按钮（只有查看自己时显示） */}
                  {isMyProfile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('确定要取消关注吗？')) {
                          handleUnfollow(followingUser.id);
                        }
                      }}
                      className="px-6 py-2 border-2 border-cyan-500 text-cyan-500 rounded-full font-semibold hover:bg-cyan-500 hover:text-white transition-all flex items-center gap-2 shrink-0"
                    >
                      <UserCheck className="w-4 h-4" />
                      已关注
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 空状态 */}
        {!loading && users.length === 0 && (
          <div className="text-center py-24">
            <div className="text-8xl mb-6 opacity-60">👤</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {isMyProfile ? '还没有关注任何人' : 'TA还没有关注任何人'}
            </h3>
            <p className="text-gray-600 mb-8">
              {isMyProfile ? '快去发现感兴趣的用户吧' : ''}
            </p>
            {isMyProfile && (
              <button
                onClick={() => navigate('/users')}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                <Search className="w-5 h-5" />
                发现用户
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
                onClick={() => loadFollowing(false)}
                className="px-8 py-3 bg-white text-cyan-500 rounded-full font-semibold hover:bg-cyan-50 transition-all border-2 border-cyan-500"
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
