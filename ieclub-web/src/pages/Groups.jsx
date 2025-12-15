import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request';
import { showToast } from '../components/Toast';

// 分类配置
const categories = [
  { value: 'all', label: '全部', icon: '🌐' },
  { value: 'study', label: '学习交流', icon: '📚' },
  { value: 'tech', label: '技术开发', icon: '💻' },
  { value: 'career', label: '职业发展', icon: '💼' },
  { value: 'interest', label: '兴趣爱好', icon: '🎨' },
  { value: 'life', label: '校园生活', icon: '🏠' },
  { value: 'sport', label: '运动健身', icon: '⚽' },
  { value: 'game', label: '游戏娱乐', icon: '🎮' },
  { value: 'general', label: '综合讨论', icon: '💬' }
];

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [hotGroups, setHotGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover'); // discover, my
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchGroups(true);
      fetchHotGroups();
    } else {
      fetchMyGroups();
    }
  }, [activeTab, category]);

  const fetchGroups = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }
      
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: 12,
        sortBy: 'membersCount'
      });
      
      if (category !== 'all') {
        params.append('category', category);
      }
      if (keyword) {
        params.append('keyword', keyword);
      }

      const res = await request(`/groups?${params}`);
      const data = res.data?.data || res.data;
      
      if (reset) {
        setGroups(data.list || []);
      } else {
        setGroups(prev => [...prev, ...(data.list || [])]);
      }
      
      setHasMore(data.pagination?.page < data.pagination?.totalPages);
      setPage(currentPage + 1);
    } catch (err) {
      console.error('获取小组列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const res = await request('/groups/me/list');
      setMyGroups(res.data?.data || res.data || []);
    } catch (err) {
      console.error('获取我的小组失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotGroups = async () => {
    try {
      const res = await request('/groups/hot?limit=5');
      setHotGroups(res.data?.data || res.data || []);
    } catch (err) {
      console.error('获取热门小组失败:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGroups(true);
  };

  const handleJoinGroup = async (groupId, needApproval) => {
    try {
      await request(`/groups/${groupId}/join`, { method: 'POST' });
      showToast(needApproval ? '申请已提交' : '加入成功');
      fetchGroups(true);
    } catch (err) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const getCategoryIcon = (cat) => {
    return categories.find(c => c.value === cat)?.icon || '💬';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 - 响应式 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h1 className="title-lg mb-1">小组圈子</h1>
              <p className="text-caption sm:text-body text-indigo-100">发现志同道合的伙伴</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn bg-white text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 w-full sm:w-auto justify-center"
            >
              <span className="icon-sm">➕</span> 创建小组
            </button>
          </div>

          {/* Tab切换 - 响应式 */}
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-resp text-caption sm:text-body font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🔍 发现
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-resp text-caption sm:text-body font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              👥 我的
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {activeTab === 'discover' ? (
          <div className="flex gap-4 sm:gap-6">
            {/* 主内容区 */}
            <div className="flex-1 min-w-0">
              {/* 搜索和筛选 - 响应式 */}
              <div className="bg-white rounded-resp-lg p-2 sm:p-4 mb-4 sm:mb-6 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <input
                    type="text"
                    placeholder="搜索小组..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-200 rounded-resp text-body focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    搜索
                  </button>
                </form>
                
                {/* 分类筛选 - 响应式横向滚动 */}
                <div className="flex flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`tag whitespace-nowrap transition-colors ${
                        category === cat.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 小组列表 - 响应式 */}
              {loading && groups.length === 0 ? (
                <div className="card-grid">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white rounded-resp-lg p-2 sm:p-4 animate-pulse">
                      <div className="flex gap-2 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-resp"></div>
                        <div className="flex-1">
                          <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <p className="icon-lg mb-3">🔍</p>
                  <p className="text-body">暂无小组，快来创建第一个吧！</p>
                </div>
              ) : (
                <>
                  <div className="card-grid">
                    {groups.map(group => (
                      <div
                        key={group.id}
                        className="bg-white rounded-resp-lg p-2 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/groups/${group.id}`)}
                      >
                        <div className="flex gap-2 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-resp bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg sm:text-2xl overflow-hidden flex-shrink-0">
                            {group.avatar ? (
                              <img src={group.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getCategoryIcon(group.category)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="title-sm text-gray-800 truncate">{group.name}</h3>
                            <p className="text-caption text-gray-500 line-clamp-2 mt-0.5 sm:mt-1">
                              {group.description || '暂无简介'}
                            </p>
                            <div className="stats-row mt-1 sm:mt-2">
                              <span>👥 {group.membersCount}</span>
                              <span>📝 {group.topicsCount}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 self-center">
                            {group.isJoined ? (
                              <span className="tag bg-green-50 text-green-600">
                                已加入
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinGroup(group.id, group.needApproval);
                                }}
                                className="tag text-indigo-600 border border-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                {group.needApproval ? '申请' : '加入'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 加载更多 */}
                  {hasMore && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => fetchGroups()}
                        disabled={loading}
                        className="px-6 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        {loading ? '加载中...' : '加载更多'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 侧边栏 */}
            <div className="w-72 hidden lg:block">
              {/* 热门小组 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">🔥 热门小组</h3>
                <div className="space-y-3">
                  {hotGroups.map((group, index) => (
                    <div
                      key={group.id}
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{group.name}</p>
                        <p className="text-xs text-gray-400">{group.membersCount} 成员</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 我的小组 */
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-20 bg-gray-200 rounded mb-3"></div>
                    <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-5xl mb-4">👥</p>
                <p className="mb-4">你还没有加入任何小组</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  去发现小组
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {/* 封面 */}
                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                      {group.cover && (
                        <img src={group.cover} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                        <div className="w-14 h-14 rounded-xl bg-white p-1 shadow">
                          <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
                            {group.avatar ? (
                              <img src={group.avatar} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              getCategoryIcon(group.category)
                            )}
                          </div>
                        </div>
                      </div>
                      {/* 角色标签 */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          group.myRole === 'owner' ? 'bg-yellow-500 text-white' :
                          group.myRole === 'admin' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {group.myRole === 'owner' ? '创建者' : group.myRole === 'admin' ? '管理员' : '成员'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 pt-10">
                      <h3 className="font-semibold text-gray-800">{group.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                        {group.description || '暂无简介'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>👥 {group.membersCount}</span>
                        <span>📝 {group.topicsCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 创建小组弹窗 */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchGroups(true);
            showToast('创建成功');
          }}
        />
      )}
    </div>
  );
}

// 创建小组弹窗组件
function CreateGroupModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'general',
    isPublic: true,
    needApproval: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('请输入小组名称', 'error');
      return;
    }

    try {
      setLoading(true);
      await request('/groups', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      onSuccess();
    } catch (err) {
      showToast(err.message || '创建失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">创建小组</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                小组名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="给小组起个名字"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">小组简介</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="介绍一下这个小组"
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">小组分类</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.filter(c => c.value !== 'all').map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      form.category === cat.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <p className="text-xs mt-1">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">公开小组（可被搜索和发现）</span>
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">加入需要审批</span>
                <input
                  type="checkbox"
                  checked={form.needApproval}
                  onChange={(e) => setForm({ ...form, needApproval: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建小组'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
