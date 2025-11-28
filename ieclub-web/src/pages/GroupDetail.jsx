import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { request } from '../utils/request';
import { showToast } from '../utils/toast';

const categoryConfig = {
  study: { label: '学习交流', icon: '📚' },
  tech: { label: '技术开发', icon: '💻' },
  career: { label: '职业发展', icon: '💼' },
  interest: { label: '兴趣爱好', icon: '🎨' },
  life: { label: '校园生活', icon: '🏠' },
  sport: { label: '运动健身', icon: '⚽' },
  game: { label: '游戏娱乐', icon: '🎮' },
  general: { label: '综合讨论', icon: '💬' }
};

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [topics, setTopics] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topics'); // topics, members
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    fetchGroupDetail();
    fetchTopics();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
  }, [activeTab]);

  const fetchGroupDetail = async () => {
    try {
      setLoading(true);
      const res = await request(`/groups/${id}`);
      setGroup(res.data?.data || res.data);
    } catch (err) {
      console.error('获取小组详情失败:', err);
      showToast('小组不存在', 'error');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await request(`/groups/${id}/topics`);
      const data = res.data?.data || res.data;
      setTopics(data.list || []);
    } catch (err) {
      console.error('获取话题失败:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await request(`/groups/${id}/members?pageSize=50`);
      const data = res.data?.data || res.data;
      setMembers(data.list || []);
    } catch (err) {
      console.error('获取成员失败:', err);
    }
  };

  const handleJoin = async () => {
    try {
      await request(`/groups/${id}/join`, { method: 'POST' });
      showToast(group.needApproval ? '申请已提交' : '加入成功');
      fetchGroupDetail();
    } catch (err) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const handleLeave = async () => {
    if (!confirm('确定要退出该小组吗？')) return;
    
    try {
      await request(`/groups/${id}/leave`, { method: 'POST' });
      showToast('已退出小组');
      fetchGroupDetail();
    } catch (err) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200"></div>
          <div className="max-w-4xl mx-auto px-4 -mt-12">
            <div className="bg-white rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const catConfig = categoryConfig[group.category] || categoryConfig.general;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 封面 */}
      <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
        {group.cover && (
          <img src={group.cover} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/groups')}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          ←
        </button>
      </div>

      {/* 小组信息卡片 */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-6">
            {/* 头像 */}
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl overflow-hidden shadow-md">
              {group.avatar ? (
                <img src={group.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                catConfig.icon
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                      {catConfig.icon} {catConfig.label}
                    </span>
                    {!group.isPublic && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        🔒 私密小组
                      </span>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  {group.isJoined ? (
                    <>
                      {group.myRole !== 'owner' && (
                        <button
                          onClick={handleLeave}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          退出小组
                        </button>
                      )}
                      {['owner', 'admin'].includes(group.myRole) && (
                        <button
                          onClick={() => navigate(`/groups/${id}/settings`)}
                          className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          ⚙️ 管理
                        </button>
                      )}
                    </>
                  ) : group.hasPendingRequest ? (
                    <span className="px-4 py-2 text-yellow-600 bg-yellow-50 rounded-lg">
                      申请审核中
                    </span>
                  ) : (
                    <button
                      onClick={handleJoin}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {group.needApproval ? '申请加入' : '加入小组'}
                    </button>
                  )}
                </div>
              </div>

              {/* 统计 */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">{group.membersCount}</p>
                  <p className="text-xs text-gray-500">成员</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">{group.topicsCount}</p>
                  <p className="text-xs text-gray-500">话题</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">{group.activitiesCount}</p>
                  <p className="text-xs text-gray-500">活动</p>
                </div>
              </div>
            </div>
          </div>

          {/* 简介 */}
          {group.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-gray-600">{group.description}</p>
            </div>
          )}

          {/* 标签 */}
          {group.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {group.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 创建者 */}
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <img
              src={group.creator?.avatar?.startsWith('http') ? group.creator.avatar : `https://ieclub.online${group.creator?.avatar || '/default-avatar.png'}`}
              alt=""
              className="w-6 h-6 rounded-full"
            />
            <span>{group.creator?.nickname} 创建于 {formatTime(group.createdAt)}</span>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('topics')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'topics'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 话题 ({group.topicsCount})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 成员 ({group.membersCount})
            </button>
          </div>

          {/* 内容区 */}
          <div className="p-4">
            {activeTab === 'topics' ? (
              <div>
                {/* 发布按钮 */}
                {group.isJoined && (
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="w-full py-3 mb-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  >
                    ✏️ 发布新话题
                  </button>
                )}

                {/* 话题列表 */}
                {topics.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-2">📝</p>
                    <p>还没有话题，快来发布第一个吧</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topics.map(topic => (
                      <div
                        key={topic.id}
                        className="p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={topic.author?.avatar?.startsWith('http') ? topic.author.avatar : `https://ieclub.online${topic.author?.avatar || '/default-avatar.png'}`}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{topic.author?.nickname}</span>
                              <span className="text-xs text-gray-400">{formatTime(topic.createdAt)}</span>
                              {topic.isPinned && (
                                <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-xs rounded">置顶</span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-800 mt-1">{topic.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{topic.content}</p>
                            
                            {/* 图片预览 */}
                            {topic.images?.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {topic.images.slice(0, 3).map((img, i) => (
                                  <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                ))}
                                {topic.images.length > 3 && (
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                    +{topic.images.length - 3}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 互动数据 */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                              <span>👁️ {topic.viewsCount}</span>
                              <span>❤️ {topic.likesCount}</span>
                              <span>💬 {topic.commentsCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* 成员列表 */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {members.map(member => (
                  <div
                    key={member.id}
                    onClick={() => navigate(`/profile/${member.user?.id}`)}
                    className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={member.user?.avatar?.startsWith('http') ? member.user.avatar : `https://ieclub.online${member.user?.avatar || '/default-avatar.png'}`}
                        alt=""
                        className="w-16 h-16 rounded-full"
                      />
                      {member.role !== 'member' && (
                        <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-xs rounded-full ${
                          member.role === 'owner' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {member.role === 'owner' ? '创建者' : '管理员'}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-medium text-gray-800 text-center truncate w-full">
                      {member.nickname || member.user?.nickname}
                    </p>
                    <p className="text-xs text-gray-400">Lv.{member.user?.level || 1}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 发布话题弹窗 */}
      {showPostModal && (
        <PostTopicModal
          groupId={id}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => {
            setShowPostModal(false);
            fetchTopics();
            fetchGroupDetail();
            showToast('发布成功');
          }}
        />
      )}
    </div>
  );
}

// 发布话题弹窗
function PostTopicModal({ groupId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'discussion'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showToast('请填写完整', 'error');
      return;
    }

    try {
      setLoading(true);
      await request(`/groups/${groupId}/topics`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      onSuccess();
    } catch (err) {
      showToast(err.message || '发布失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">发布话题</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                话题类型
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'discussion', label: '讨论', icon: '💬' },
                  { value: 'question', label: '提问', icon: '❓' },
                  { value: 'resource', label: '资源', icon: '📎' }
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`flex-1 py-2 rounded-lg transition-colors ${
                      form.type === t.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="话题标题"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="分享你的想法..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={2000}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? '发布中...' : '发布话题'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
