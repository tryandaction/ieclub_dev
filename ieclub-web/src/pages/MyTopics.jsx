import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Heart, MessageCircle, Bookmark, Plus, RefreshCw, MoreVertical, Pin, Eye, EyeOff, Trash2, Edit, ArrowUp } from 'lucide-react';
import request from '../utils/request';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

export default function MyTopics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);
  const limit = 10;

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    totalLikes: 0,
    totalComments: 0,
    totalBookmarks: 0
  });

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadTopics(true);
    }
  }, [user]);

  // 加载话题列表
  const loadTopics = async (isRefresh = false) => {
    if (loading) return;
    if (!user?.id) return;

    setLoading(true);

    try {
      const currentPage = isRefresh ? 1 : page;
      const res = await request.get(`/users/${user.id}/topics`, {
        params: { page: currentPage, limit }
      });

      // 后端返回格式: {success, data: {topics, pagination}}
      const data = res?.data?.data || res?.data || res;
      const rawTopics = data?.topics || [];
      const pagination = data?.pagination || {};
      
      // 解析tags（后端返回的是JSON字符串）
      const newTopics = rawTopics.map(topic => ({
        ...topic,
        tags: typeof topic.tags === 'string' ? JSON.parse(topic.tags || '[]') : (topic.tags || [])
      }));

      // 计算统计数据
      const allTopics = isRefresh ? newTopics : [...topics, ...newTopics];
      const newStats = calculateStats(allTopics);

      setTopics(allTopics);
      setStats({ ...newStats, total: pagination.total || allTopics.length });
      setPage(currentPage + 1);
      setHasMore(newTopics.length >= limit);
    } catch (error) {
      console.error('加载话题失败:', error);
      showToast('加载话题失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const calculateStats = (topicList) => {
    return topicList.reduce((stats, topic) => ({
      total: stats.total + 1,
      totalLikes: stats.totalLikes + (topic._count?.likes || 0),
      totalComments: stats.totalComments + (topic._count?.comments || 0),
      totalBookmarks: stats.totalBookmarks + (topic._count?.bookmarks || 0)
    }), { total: 0, totalLikes: 0, totalComments: 0, totalBookmarks: 0 });
  };

  // 格式化时间
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    
    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < month) {
      return `${Math.floor(diff / day)}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  // 获取分类标签
  const getCategoryLabel = (category) => {
    const categoryMap = {
      demand: { label: '需求', icon: '🔍', color: 'blue' },
      supply: { label: '供给', icon: '💡', color: 'green' },
      general: { label: '普通', icon: '📢', color: 'gray' }
    };
    return categoryMap[category] || categoryMap.general;
  };

  // 跳转到话题详情
  const goToDetail = (id) => {
    navigate(`/topic/${id}`);
  };

  // 编辑话题
  const handleEdit = (e, topicId) => {
    e.stopPropagation();
    setActiveMenu(null);
    navigate(`/publish?edit=${topicId}`);
  };

  // 置顶话题（本地状态，仅用于排序展示）
  const handlePin = (e, topicId) => {
    e.stopPropagation();
    setActiveMenu(null);
    
    const topic = topics.find(t => t.id === topicId);
    const newPinned = !topic?.isPinned;
    
    // 更新本地状态
    setTopics(prev => {
      const updated = prev.map(t => 
        t.id === topicId ? { ...t, isPinned: newPinned } : t
      );
      // 置顶的排在前面
      return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    });
    
    showToast(newPinned ? '已置顶' : '已取消置顶', 'success');
  };

  // 撤回/发布话题
  const handleToggleStatus = async (e, topicId, currentStatus) => {
    e.stopPropagation();
    setActiveMenu(null);
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'draft' ? '撤回' : '发布';
    
    if (!window.confirm(`确定要${action}这个话题吗？`)) return;
    
    try {
      await request.put(`/topics/${topicId}`, { status: newStatus });
      setTopics(topics.map(t => 
        t.id === topicId ? { ...t, status: newStatus } : t
      ));
      showToast(`${action}成功`, 'success');
    } catch (error) {
      console.error(`${action}失败:`, error);
      showToast(`${action}失败`, 'error');
    }
  };

  // 删除话题
  const handleDelete = async (e, topicId) => {
    e.stopPropagation();
    setActiveMenu(null);
    
    if (!window.confirm('确定要删除这个话题吗？删除后无法恢复。')) return;
    
    try {
      await request.delete(`/topics/${topicId}`);
      setTopics(topics.filter(t => t.id !== topicId));
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      showToast('删除成功', 'success');
    } catch (error) {
      console.error('删除失败:', error);
      showToast('删除失败', 'error');
    }
  };

  // 切换菜单
  const toggleMenu = (e, topicId) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === topicId ? null : topicId);
  };

  // 骨架屏
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-20 bg-gray-200 rounded mb-4"></div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl font-bold">我的话题</h1>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-80 mt-1">话题</div>
            </div>
            <div className="text-center border-l border-r border-white/20">
              <div className="text-3xl font-bold">{stats.totalLikes}</div>
              <div className="text-sm opacity-80 mt-1">点赞</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalComments}</div>
              <div className="text-sm opacity-80 mt-1">评论</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 操作栏 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => loadTopics(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          
          <button
            onClick={() => navigate('/publish')}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            发布话题
          </button>
        </div>

        {/* 话题列表 */}
        {loading && topics.length === 0 ? (
          // 骨架屏
          <div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : topics.length > 0 ? (
          <div>
            {topics.map((topic) => {
              const category = getCategoryLabel(topic.category);
              return (
                <div
                  key={topic.id}
                  onClick={() => goToDetail(topic.id)}
                  className={`bg-white rounded-2xl p-6 shadow-sm mb-4 hover:shadow-md transition cursor-pointer border-l-4 ${topic.isPinned ? 'border-amber-500 bg-amber-50/30' : 'border-transparent'} hover:border-blue-500 relative`}
                >
                  {/* 置顶标记 */}
                  {topic.isPinned && (
                    <div className="absolute top-3 right-14 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                      <Pin className="w-3 h-3" />
                      置顶
                    </div>
                  )}

                  {/* 管理菜单按钮 */}
                  <div className="absolute top-4 right-4" ref={activeMenu === topic.id ? menuRef : null}>
                    <button
                      onClick={(e) => toggleMenu(e, topic.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    {/* 下拉菜单 */}
                    {activeMenu === topic.id && (
                      <div className="absolute right-0 top-10 w-36 bg-white rounded-xl shadow-lg border py-2 z-10">
                        <button
                          onClick={(e) => handleEdit(e, topic.id)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={(e) => handlePin(e, topic.id)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Pin className="w-4 h-4" />
                          {topic.isPinned ? '取消置顶' : '置顶'}
                        </button>
                        <button
                          onClick={(e) => handleToggleStatus(e, topic.id, topic.status)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          {topic.status === 'published' ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              撤回
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              发布
                            </>
                          )}
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={(e) => handleDelete(e, topic.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 话题头部 */}
                  <div className="flex justify-between items-start mb-4 pr-12">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-${category.color}-100 text-${category.color}-700`}>
                      <span>{category.icon}</span>
                      {category.label}
                    </span>
                    <span className="text-sm text-gray-500">{formatTime(topic.createdAt)}</span>
                  </div>

                  {/* 话题标题 */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {topic.title}
                  </h3>

                  {/* 话题内容 */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {topic.content}
                  </p>

                  {/* 标签 */}
                  {topic.tags && topic.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {topic.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 话题底部 */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">{topic._count?.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{topic._count?.comments || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Bookmark className="w-4 h-4" />
                        <span className="text-sm font-medium">{topic._count?.bookmarks || 0}</span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      topic.status === 'published' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {topic.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 加载更多 */}
            {hasMore && (
              <div className="text-center py-8">
                <button
                  onClick={() => loadTopics(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}

            {!hasMore && topics.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                没有更多了
              </div>
            )}
          </div>
        ) : (
          // 空状态
          <div className="text-center py-20">
            <div className="text-8xl mb-6 opacity-50">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">还没有发布话题</h3>
            <p className="text-gray-600 mb-6">快去发布你的第一个话题吧</p>
            <button
              onClick={() => navigate('/publish')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              发布话题
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
