/**
 * 话题详情页
 * 支持三种类型：我来讲、想听、项目
 * 包含：详情展示、评论系统、互动功能、报名/申请功能
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { Button } from '../components/common/Button.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Loading from '../components/common/Loading.jsx';
import CommentSection from '../components/topic/CommentSection.jsx';
import { useTopicStore, TopicType } from '../store/topicStore';
import { useAuthStore } from '../store/authStore';
import api from '../services/api.js';

/**
 * 话题详情页组件
 */
const TopicDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { topics, likeTopic, favoriteTopic, updateTopic } = useTopicStore();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [applying, setApplying] = useState(false);

  // 获取话题详情
  useEffect(() => {
    const fetchTopicDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // 先从本地store查找
        const localTopic = topics.find(t => t.id === parseInt(id));
        if (localTopic) {
          setTopic(localTopic);
          setIsLiked(localTopic.isLiked || false);
          setIsFavorited(localTopic.isFavorited || false);
        }

        // 从API获取最新数据
        const response = await api.get(`/topics/${id}`);
        setTopic(response.data);
        setIsLiked(response.data.isLiked || false);
        setIsFavorited(response.data.isFavorited || false);
      } catch (err) {
        console.error('获取话题详情失败:', err);
        setError(err.message || '加载失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTopicDetail();
    }
  }, [id, topics]);

  // 处理点赞
  const handleLike = async () => {
    if (!currentUser) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setTopic(prev => ({
        ...prev,
        likes: newLikedState ? prev.likes + 1 : prev.likes - 1
      }));

      await api.post(`/topics/${id}/like`);
      likeTopic(parseInt(id));
    } catch (err) {
      console.error('点赞失败:', err);
      // 回滚状态
      setIsLiked(!isLiked);
      setTopic(prev => ({
        ...prev,
        likes: isLiked ? prev.likes + 1 : prev.likes - 1
      }));
    }
  };

  // 处理收藏
  const handleFavorite = async () => {
    if (!currentUser) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    try {
      const newFavoritedState = !isFavorited;
      setIsFavorited(newFavoritedState);
      setTopic(prev => ({
        ...prev,
        favorites: newFavoritedState ? prev.favorites + 1 : prev.favorites - 1
      }));

      await api.post(`/topics/${id}/favorite`);
      favoriteTopic(parseInt(id));
    } catch (err) {
      console.error('收藏失败:', err);
      // 回滚状态
      setIsFavorited(!isFavorited);
      setTopic(prev => ({
        ...prev,
        favorites: isFavorited ? prev.favorites + 1 : prev.favorites - 1
      }));
    }
  };

  // 处理分享
  const handleShare = (platform) => {
    const url = window.location.href;
    const title = topic?.title || '';
    
    const shareUrls = {
      wechat: `weixin://`, // 微信分享需要SDK
      weibo: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      link: url
    };

    if (platform === 'link') {
      navigator.clipboard.writeText(url);
      alert('链接已复制到剪贴板');
    } else if (platform === 'wechat') {
      alert('请使用浏览器的分享功能分享到微信');
    } else {
      window.open(shareUrls[platform], '_blank');
    }

    setShowShareMenu(false);
  };

  // 处理报名（想听类型）
  const handleSignup = async (formData) => {
    if (!currentUser) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    try {
      setApplying(true);
      await api.post(`/topics/${id}/signup`, formData);
      
      // 更新本地状态
      setTopic(prev => ({
        ...prev,
        signups: (prev.signups || 0) + 1,
        hasSignedUp: true
      }));

      alert('报名成功！发布者会尽快与您联系');
      setShowSignupModal(false);
    } catch (err) {
      console.error('报名失败:', err);
      alert(err.message || '报名失败，请重试');
    } finally {
      setApplying(false);
    }
  };

  // 处理申请（项目类型）
  const handleApply = async (formData) => {
    if (!currentUser) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    try {
      setApplying(true);
      await api.post(`/topics/${id}/apply`, formData);
      
      // 更新本地状态
      setTopic(prev => ({
        ...prev,
        applications: (prev.applications || 0) + 1,
        hasApplied: true
      }));

      alert('申请成功！项目负责人会尽快与您联系');
      setShowApplyModal(false);
    } catch (err) {
      console.error('申请失败:', err);
      alert(err.message || '申请失败，请重试');
    } finally {
      setApplying(false);
    }
  };

  // 获取类型配置
  const getTypeConfig = (type) => {
    const configs = {
      [TopicType.OFFER]: {
        label: '我来讲',
        icon: 'topicOffer',
        color: '#5B7FFF',
        bgGradient: 'from-blue-50 to-indigo-50',
        badgeClass: 'bg-blue-100 text-blue-700',
        actionLabel: '我想听',
        actionIcon: 'user-plus'
      },
      [TopicType.DEMAND]: {
        label: '想听',
        icon: 'topicDemand',
        color: '#FF6B9D',
        bgGradient: 'from-pink-50 to-rose-50',
        badgeClass: 'bg-pink-100 text-pink-700',
        actionLabel: '我来讲',
        actionIcon: 'hand-raised'
      },
      [TopicType.PROJECT]: {
        label: '项目',
        icon: 'project',
        color: '#FFA500',
        bgGradient: 'from-orange-50 to-amber-50',
        badgeClass: 'bg-orange-100 text-orange-700',
        actionLabel: '申请加入',
        actionIcon: 'user-group'
      }
    };
    return configs[type] || configs[TopicType.OFFER];
  };

  // Loading状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  // Error状态
  if (error || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <Icon icon="exclamation-circle" size="3xl" color="#EF4444" />
          <p className="mt-4 text-lg text-gray-700">{error || '话题不存在'}</p>
          <Button
            variant="primary"
            onClick={() => navigate(-1)}
            className="mt-6"
          >
            返回上一页
          </Button>
        </div>
      </div>
    );
  }

  const typeConfig = getTypeConfig(topic.type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
          >
            <Icon icon="chevron-left" size="lg" />
            <span className="font-medium">返回</span>
          </button>

          <div className="flex items-center gap-3">
            {/* 分享按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Icon icon="share" size="md" color="#6B7280" />
              </button>

              {/* 分享菜单 */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleShare('wechat')}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <Icon icon="wechat" size="md" color="#07C160" />
                    <span className="text-sm">微信</span>
                  </button>
                  <button
                    onClick={() => handleShare('weibo')}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <Icon icon="weibo" size="md" color="#E6162D" />
                    <span className="text-sm">微博</span>
                  </button>
                  <button
                    onClick={() => handleShare('qq')}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <Icon icon="qq" size="md" color="#12B7F5" />
                    <span className="text-sm">QQ</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => handleShare('link')}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <Icon icon="link" size="md" color="#6B7280" />
                    <span className="text-sm">复制链接</span>
                  </button>
                </div>
              )}
            </div>

            {/* 更多操作 */}
            {currentUser?.id === topic.author?.id && (
              <button
                onClick={() => navigate(`/topics/${id}/edit`)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Icon icon="edit" size="md" color="#6B7280" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 话题头部 */}
        <div className={`bg-gradient-to-br ${typeConfig.bgGradient} rounded-3xl p-6 shadow-lg mb-6`}>
          {/* 类型标签 */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${typeConfig.badgeClass} text-sm font-bold`}>
              <Icon icon={typeConfig.icon} size="sm" color={typeConfig.color} />
              {typeConfig.label}
            </span>
            {topic.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 text-gray-700 text-sm font-medium">
                <Icon icon="category" size="xs" />
                {topic.category}
              </span>
            )}
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
            {topic.title}
          </h1>

          {/* 作者信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={topic.author?.avatar}
                name={topic.author?.name}
                size="md"
                className="ring-2 ring-white"
              />
              <div>
                <div className="font-medium text-gray-900">{topic.author?.name}</div>
                <div className="text-sm text-gray-600">
                  {new Date(topic.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>

            {/* 互动数据 */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Icon icon="eye" size="sm" />
                <span>{topic.views || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon icon="heart" size="sm" />
                <span>{topic.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon icon="comment" size="sm" />
                <span>{topic.comments || 0}</span>
              </div>
            </div>
          </div>

          {/* 标签 */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topic.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-white/60 text-gray-700 text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 详细内容 */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="document-text" size="md" color="#667eea" />
            详细介绍
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {topic.description}
          </div>
        </div>

        {/* 类型特定信息 */}
        {renderTypeSpecificInfo(topic, typeConfig)}

        {/* 互动按钮区域 */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4">
            {/* 点赞按钮 */}
            <button
              onClick={handleLike}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                isLiked
                  ? 'bg-red-50 text-red-600 border-2 border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon icon={isLiked ? 'heart-solid' : 'heart'} size="md" color={isLiked ? '#EF4444' : 'currentColor'} />
              <span>{isLiked ? '已赞' : '点赞'}</span>
              <span className="text-sm">({topic.likes || 0})</span>
            </button>

            {/* 收藏按钮 */}
            <button
              onClick={handleFavorite}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                isFavorited
                  ? 'bg-yellow-50 text-yellow-600 border-2 border-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon icon={isFavorited ? 'star-solid' : 'star'} size="md" color={isFavorited ? '#F59E0B' : 'currentColor'} />
              <span>{isFavorited ? '已收藏' : '收藏'}</span>
            </button>

            {/* 主要操作按钮 */}
            {renderMainActionButton(topic, typeConfig)}
          </div>
        </div>

        {/* 评论区域 */}
        <CommentSection topicId={id} />
      </div>

      {/* 报名/申请模态框 */}
      {showSignupModal && renderSignupModal(topic, handleSignup, applying, () => setShowSignupModal(false))}
      {showApplyModal && renderApplyModal(topic, handleApply, applying, () => setShowApplyModal(false))}
    </div>
  );

  // 渲染类型特定信息
  function renderTypeSpecificInfo(topic, typeConfig) {
    if (topic.type === TopicType.OFFER) {
      return (
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="information-circle" size="md" color="#667eea" />
            分享信息
          </h2>
          <div className="space-y-3">
            {topic.duration && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="clock" size="md" color="#6B7280" />
                <span className="font-medium">预计时长：</span>
                <span>{topic.duration}小时</span>
              </div>
            )}
            {topic.format && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="location" size="md" color="#6B7280" />
                <span className="font-medium">形式：</span>
                <span>{topic.format === 'offline' ? '线下' : topic.format === 'online' ? '线上' : '线上线下均可'}</span>
              </div>
            )}
            {topic.location && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="map-pin" size="md" color="#6B7280" />
                <span className="font-medium">地点：</span>
                <span>{topic.location}</span>
              </div>
            )}
            {topic.maxParticipants && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="user-group" size="md" color="#6B7280" />
                <span className="font-medium">人数限制：</span>
                <span>{topic.maxParticipants}人</span>
              </div>
            )}
            {topic.targetAudience && topic.targetAudience.length > 0 && (
              <div className="flex items-start gap-3 text-gray-700">
                <Icon icon="user" size="md" color="#6B7280" className="mt-0.5" />
                <div>
                  <span className="font-medium">目标听众：</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {topic.targetAudience.map((audience, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm"
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (topic.type === TopicType.DEMAND) {
      return (
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="information-circle" size="md" color="#667eea" />
            需求信息
          </h2>
          <div className="space-y-3">
            {topic.urgency && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="fire" size="md" color="#6B7280" />
                <span className="font-medium">紧急程度：</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  topic.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                  topic.urgency === 'thisWeek' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {topic.urgency === 'urgent' ? '非常急' : topic.urgency === 'thisWeek' ? '本周' : '不急'}
                </span>
              </div>
            )}
            {topic.learningFormat && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="users" size="md" color="#6B7280" />
                <span className="font-medium">期望形式：</span>
                <span>{topic.learningFormat === 'oneOnOne' ? '一对一' : topic.learningFormat === 'group' ? '小组' : '大型讲座'}</span>
              </div>
            )}
            {(topic.preferOnline || topic.preferOffline) && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="location" size="md" color="#6B7280" />
                <span className="font-medium">地点偏好：</span>
                <div className="flex gap-2">
                  {topic.preferOnline && <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">线上</span>}
                  {topic.preferOffline && <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">线下</span>}
                </div>
              </div>
            )}
            {topic.budget && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="currency-dollar" size="md" color="#6B7280" />
                <span className="font-medium">预算：</span>
                <span>{topic.budget === 'free' ? '免费' : topic.budget === 'negotiable' ? '面议' : `${topic.budgetAmount}元`}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (topic.type === TopicType.PROJECT) {
      return (
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="information-circle" size="md" color="#667eea" />
            项目信息
          </h2>
          <div className="space-y-3">
            {topic.projectType && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="briefcase" size="md" color="#6B7280" />
                <span className="font-medium">项目类型：</span>
                <span>{topic.projectType}</span>
              </div>
            )}
            {topic.projectStage && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="chart-bar" size="md" color="#6B7280" />
                <span className="font-medium">项目阶段：</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  topic.projectStage === 'idea' ? 'bg-purple-100 text-purple-700' :
                  topic.projectStage === 'development' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {topic.projectStage === 'idea' ? '想法阶段' : topic.projectStage === 'development' ? '开发中' : '已上线'}
                </span>
              </div>
            )}
            {topic.teamSize && (
              <div className="flex items-center gap-3 text-gray-700">
                <Icon icon="user-group" size="md" color="#6B7280" />
                <span className="font-medium">团队规模：</span>
                <span>{topic.teamSize}人</span>
              </div>
            )}
            {topic.positions && topic.positions.length > 0 && (
              <div className="flex items-start gap-3 text-gray-700">
                <Icon icon="users" size="md" color="#6B7280" className="mt-0.5" />
                <div className="flex-1">
                  <span className="font-medium">招募职位：</span>
                  <div className="space-y-2 mt-2">
                    {topic.positions.map((position, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-200"
                      >
                        <div>
                          <div className="font-bold text-orange-700">{position.name}</div>
                          {position.requirement && (
                            <div className="text-sm text-gray-600 mt-1">{position.requirement}</div>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold">
                          {position.count}人
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {topic.resourceNeeds && (
              <div className="flex items-start gap-3 text-gray-700">
                <Icon icon="light-bulb" size="md" color="#6B7280" className="mt-0.5" />
                <div>
                  <span className="font-medium">资源需求：</span>
                  <p className="mt-1 text-gray-600">{topic.resourceNeeds}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  }

  // 渲染主要操作按钮
  function renderMainActionButton(topic, typeConfig) {
    if (!currentUser) {
      return (
        <button
          onClick={() => navigate('/login')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-primary text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Icon icon="login" size="md" color="#ffffff" />
          <span>登录后参与</span>
        </button>
      );
    }

    if (currentUser.id === topic.author?.id) {
      return (
        <button
          onClick={() => navigate(`/topics/${id}/manage`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-primary text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Icon icon="cog" size="md" color="#ffffff" />
          <span>管理</span>
        </button>
      );
    }

    if (topic.type === TopicType.OFFER) {
      return (
        <button
          onClick={() => setShowSignupModal(true)}
          disabled={topic.hasSignedUp}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all ${
            topic.hasSignedUp
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-primary text-white'
          }`}
        >
          <Icon icon={typeConfig.actionIcon} size="md" color="#ffffff" />
          <span>{topic.hasSignedUp ? '已报名' : typeConfig.actionLabel}</span>
        </button>
      );
    }

    if (topic.type === TopicType.DEMAND) {
      return (
        <button
          onClick={() => navigate(`/publish?replyTo=${id}`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-primary text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Icon icon={typeConfig.actionIcon} size="md" color="#ffffff" />
          <span>{typeConfig.actionLabel}</span>
        </button>
      );
    }

    if (topic.type === TopicType.PROJECT) {
      return (
        <button
          onClick={() => setShowApplyModal(true)}
          disabled={topic.hasApplied || !topic.recruiting}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all ${
            topic.hasApplied || !topic.recruiting
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-primary text-white'
          }`}
        >
          <Icon icon={typeConfig.actionIcon} size="md" color="#ffffff" />
          <span>
            {topic.hasApplied ? '已申请' : !topic.recruiting ? '未招募' : typeConfig.actionLabel}
          </span>
        </button>
      );
    }

    return null;
  }

  // 渲染报名模态框
  function renderSignupModal(topic, onSignup, applying, onClose) {
    const [signupData, setSignupData] = useState({
      reason: '',
      background: '',
      contact: ''
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">报名参加</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Icon icon="x-mark" size="md" color="#6B7280" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                为什么想听这个话题？*
              </label>
              <textarea
                value={signupData.reason}
                onChange={(e) => setSignupData({ ...signupData, reason: e.target.value })}
                placeholder="简单介绍一下您的兴趣和期望..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                相关背景（选填）
              </label>
              <textarea
                value={signupData.background}
                onChange={(e) => setSignupData({ ...signupData, background: e.target.value })}
                placeholder="您在这个领域的背景或经验..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                联系方式*
              </label>
              <input
                type="text"
                value={signupData.contact}
                onChange={(e) => setSignupData({ ...signupData, contact: e.target.value })}
                placeholder="微信号、QQ、邮箱等"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onSignup(signupData)}
              disabled={!signupData.reason || !signupData.contact || applying}
              className="flex-1 py-3 rounded-xl font-bold bg-gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {applying ? '提交中...' : '确认报名'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染申请模态框
  function renderApplyModal(topic, onApply, applying, onClose) {
    const [applyData, setApplyData] = useState({
      position: topic.positions?.[0]?.name || '',
      introduction: '',
      experience: '',
      contribution: '',
      contact: ''
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">申请加入项目</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Icon icon="x-mark" size="md" color="#6B7280" />
            </button>
          </div>

          <div className="space-y-4">
            {topic.positions && topic.positions.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  申请职位*
                </label>
                <select
                  value={applyData.position}
                  onChange={(e) => setApplyData({ ...applyData, position: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                >
                  {topic.positions.map((pos, index) => (
                    <option key={index} value={pos.name}>
                      {pos.name} ({pos.count}人)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                自我介绍*
              </label>
              <textarea
                value={applyData.introduction}
                onChange={(e) => setApplyData({ ...applyData, introduction: e.target.value })}
                placeholder="简单介绍一下您自己..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                相关经验*
              </label>
              <textarea
                value={applyData.experience}
                onChange={(e) => setApplyData({ ...applyData, experience: e.target.value })}
                placeholder="您在该领域的经验或技能..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                能为项目带来什么？*
              </label>
              <textarea
                value={applyData.contribution}
                onChange={(e) => setApplyData({ ...applyData, contribution: e.target.value })}
                placeholder="您能为项目做出的贡献..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                联系方式*
              </label>
              <input
                type="text"
                value={applyData.contact}
                onChange={(e) => setApplyData({ ...applyData, contact: e.target.value })}
                placeholder="微信号、QQ、邮箱等"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onApply(applyData)}
              disabled={
                !applyData.position ||
                !applyData.introduction ||
                !applyData.experience ||
                !applyData.contribution ||
                !applyData.contact ||
                applying
              }
              className="flex-1 py-3 rounded-xl font-bold bg-gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {applying ? '提交中...' : '确认申请'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default TopicDetailPage;

