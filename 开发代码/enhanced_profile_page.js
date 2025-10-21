// frontend/src/pages/profile/index.jsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  ThumbsUp,
  Heart,
  UserPlus,
  UserCheck,
  Settings,
  Grid,
  FileText,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { DefaultAvatarIcon, DefaultCoverIcon } from '../../components/CustomIcons';
import './index.scss';

const ProfilePage = () => {
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isHearted, setIsHearted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [content, setContent] = useState({ topics: [], projects: [], comments: [] });
  const [loading, setLoading] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 设置当前 TabBar 选中项
  useEffect(() => {
    const tabbar = Taro.getTabBar();
    if (tabbar) {
      tabbar.setData({
        selected: 4
      });
    }
  }, []);

  const tabs = [
    { key: 'all', label: '全部', icon: Grid },
    { key: 'topics', label: '话题', icon: FileText },
    { key: 'projects', label: '项目', icon: Briefcase },
    { key: 'comments', label: '评论', icon: MessageSquare }
  ];

  const sortOptions = [
    { key: 'latest', label: '最新', icon: Clock },
    { key: 'likes', label: '点赞最多', icon: ThumbsUp },
    { key: 'hearts', label: '收藏最多', icon: Heart },
    { key: 'popular', label: '最热门', icon: TrendingUp }
  ];

  useEffect(() => {
    const params = Taro.getCurrentInstance().router.params;
    const id = params.userId;
    
    if (id) {
      setUserId(id);
      checkIfCurrentUser(id);
      fetchUserProfile(id);
    } else {
      const currentUser = Taro.getStorageSync('userInfo');
      if (currentUser) {
        setUserId(currentUser.id);
        setIsCurrentUser(true);
        fetchUserProfile(currentUser.id);
      } else {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          Taro.navigateTo({
            url: '/pages/login/index'
          });
        }, 1500);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [activeTab, sortBy]);

  const checkIfCurrentUser = (id) => {
    const currentUser = Taro.getStorageSync('userInfo');
    setIsCurrentUser(currentUser && currentUser.id === id);
  };

  const fetchUserProfile = async (id) => {
    setLoading(true);

    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${id}`,
        method: 'GET',
        data: {
          filterType: activeTab,
          sortBy
        },
        header: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      });

      if (res.data.code === 200) {
        setUserInfo(res.data.data.user);
        setIsFollowing(res.data.data.isFollowing);
        setContent(res.data.data.content);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${userId}/follow`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.code === 200) {
        setIsFollowing(res.data.data.isFollowing);
        Taro.showToast({
          title: res.data.message,
          icon: 'success'
        });
        fetchUserProfile(userId);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  };

  const handleLike = async () => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${userId}/like`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.code === 200) {
        setIsLiked(res.data.data.isLiked);
        Taro.showToast({
          title: res.data.message,
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  };

  const handleHeart = async () => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${userId}/heart`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.code === 200) {
        setIsHearted(res.data.data.isHearted);
        Taro.showToast({
          title: res.data.message,
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  const goToSettings = () => {
    Taro.navigateTo({
      url: '/pages/settings/index'
    });
  };

  const goToFollowers = () => {
    Taro.navigateTo({
      url: `/pages/follow-list/index?userId=${userId}&type=followers`
    });
  };

  const goToFollowing = () => {
    Taro.navigateTo({
      url: `/pages/follow-list/index?userId=${userId}&type=following`
    });
  };

  const goToTopicDetail = (topicId) => {
    Taro.navigateTo({
      url: `/pages/topic-detail/index?id=${topicId}`
    });
  };

  const goToProjectDetail = (projectId) => {
    Taro.navigateTo({
      url: `/pages/project-detail/index?id=${projectId}`
    });
  };

  const renderHeader = () => (
    <View className="profile-header">
      <View className="header-background">
        <View className="gradient-overlay"></View>
      </View>

      <View className="header-content">
        <View className="avatar-section">
          {userInfo?.avatar ? (
            <Image
              src={userInfo.avatar}
              className="avatar"
              mode="aspectFill"
            />
          ) : (
            <DefaultAvatarIcon size={100} />
          )}
          {userInfo?.verified && (
            <View className="verified-badge">
              <Star size={16} fill="white" />
            </View>
          )}
        </View>

        <View className="user-info">
          <View className="username">
            {userInfo?.nickname || userInfo?.username}
          </View>
          <View className="user-meta">
            {userInfo?.major && <View className="meta-item">📚 {userInfo.major}</View>}
            {userInfo?.grade && <View className="meta-item">🎓 {userInfo.grade}</View>}
          </View>
          {userInfo?.bio && <View className="bio">{userInfo.bio}</View>}
        </View>

        <View className="stats-row">
          <View className="stat-item" onClick={goToFollowers}>
            <View className="stat-value">{userInfo?.followerCount || 0}</View>
            <View className="stat-label">粉丝</View>
          </View>
          <View className="stat-item" onClick={goToFollowing}>
            <View className="stat-value">{userInfo?.followingCount || 0}</View>
            <View className="stat-label">关注</View>
          </View>
          <View className="stat-item">
            <View className="stat-value">{userInfo?.topicCount || 0}</View>
            <View className="stat-label">话题</View>
          </View>
          <View className="stat-item">
            <View className="stat-value">{userInfo?.projectCount || 0}</View>
            <View className="stat-label">项目</View>
          </View>
        </View>

        {userInfo?.skills && userInfo.skills.length > 0 && (
          <View className="tags-section">
            <View className="section-title">技能</View>
            <View className="tags">
              {userInfo.skills.map((skill, index) => (
                <View key={index} className="tag skill-tag">
                  {skill}
                </View>
              ))}
            </View>
          </View>
        )}

        {userInfo?.interests && userInfo.interests.length > 0 && (
          <View className="tags-section">
            <View className="section-title">兴趣</View>
            <View className="tags">
              {userInfo.interests.map((interest, index) => (
                <View key={index} className="tag interest-tag">
                  {interest}
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="action-buttons">
          {isCurrentUser ? (
            <View className="action-btn settings-btn" onClick={goToSettings}>
              <Settings size={18} />
              <View className="btn-text">编辑资料</View>
            </View>
          ) : (
            <>
              <View
                className={`action-btn follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={18} />
                    <View className="btn-text">已关注</View>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <View className="btn-text">关注</View>
                  </>
                )}
              </View>

              <View
                className={`action-btn icon-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLike}
              >
                <ThumbsUp size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </View>

              <View
                className={`action-btn icon-btn ${isHearted ? 'active-heart' : ''}`}
                onClick={handleHeart}
              >
                <Heart size={20} fill={isHearted ? 'currentColor' : 'none'} />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View className="content-tabs">
      <View className="tabs-wrapper">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <View
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={18} />
              <View className="tab-label">{tab.label}</View>
            </View>
          );
        })}
      </View>

      <View className="sort-dropdown">
        <View 
          className="dropdown-trigger" 
          onClick={() => setShowSortMenu(!showSortMenu)}
        >
          {sortOptions.find(opt => opt.key === sortBy)?.icon && 
            (() => {
              const Icon = sortOptions.find(opt => opt.key === sortBy).icon;
              return <Icon size={16} />;
            })()}
          <View className="sort-label">
            {sortOptions.find(opt => opt.key === sortBy)?.label}
          </View>
        </View>
        {showSortMenu && (
          <View className="dropdown-menu">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <View
                  key={option.key}
                  className={`dropdown-item ${sortBy === option.key ? 'active' : ''}`}
                  onClick={() => {
                    setSortBy(option.key);
                    setShowSortMenu(false);
                  }}
                >
                  <Icon size={16} />
                  <View className="option-label">{option.label}</View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );

  const renderTopicCard = (topic) => (
    <View
      key={topic.id}
      className="content-card topic-card"
      onClick={() => goToTopicDetail(topic.id)}
    >
      {topic.cover ? (
        <Image src={topic.cover} className="card-cover" mode="aspectFill" />
      ) : (
        <DefaultCoverIcon height="160px" />
      )}
      <View className="card-body">
        <View className="card-title">{topic.title}</View>
        <View className="card-stats">
          <View className="stat">
            <ThumbsUp size={14} />
            <View className="stat-text">{topic.likeCount}</View>
          </View>
          <View className="stat">
            <Heart size={14} />
            <View className="stat-text">{topic.heartCount}</View>
          </View>
          <View className="stat">
            <MessageSquare size={14} />
            <View className="stat-text">{topic.commentCount}</View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderProjectCard = (project) => (
    <View
      key={project.id}
      className="content-card project-card"
      onClick={() => goToProjectDetail(project.id)}
    >
      <View className="card-header">
        <View className="project-name">{project.name}</View>
        <View className={`project-status status-${project.status}`}>
          {project.status === 'recruiting' ? '招募中' : 
           project.status === 'active' ? '进行中' : '已完成'}
        </View>
      </View>
      <View className="project-desc">{project.description}</View>
      <View className="project-tags">
        {project.tags.slice(0, 3).map((tag, index) => (
          <View key={index} className="tag">{tag}</View>
        ))}
      </View>
      <View className="card-stats">
        <View className="stat">
          <View className="stat-text">👥 {project.memberCount} 成员</View>
        </View>
        <View className="stat">
          <ThumbsUp size={14} />
          <View className="stat-text">{project.likeCount}</View>
        </View>
      </View>
    </View>
  );

  const renderCommentCard = (comment) => (
    <View
      key={comment.id}
      className="content-card comment-card"
      onClick={() => goToTopicDetail(comment.topic.id)}
    >
      <View className="comment-header">
        {comment.topic.cover ? (
          <Image src={comment.topic.cover} className="topic-thumb" mode="aspectFill" />
        ) : (
          <View className="topic-thumb-placeholder">📝</View>
        )}
        <View className="topic-info">
          <View className="topic-title">{comment.topic.title}</View>
          <View className="comment-time">
            {new Date(comment.createdAt).toLocaleDateString()}
          </View>
        </View>
      </View>
      <View className="comment-content">{comment.content}</View>
      <View className="card-stats">
        <View className="stat">
          <ThumbsUp size={14} />
          <View className="stat-text">{comment.likeCount}</View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View className="loading-container">
          <View className="loading-spinner"></View>
          <View className="loading-text">加载中...</View>
        </View>
      );
    }

    const hasContent = 
      (activeTab === 'all' || activeTab === 'topics') && content.topics?.length > 0 ||
      (activeTab === 'all' || activeTab === 'projects') && content.projects?.length > 0 ||
      (activeTab === 'all' || activeTab === 'comments') && content.comments?.length > 0;

    if (!hasContent) {
      return (
        <View className="empty-state">
          <View className="empty-icon">📭</View>
          <View className="empty-text">暂无内容</View>
        </View>
      );
    }

    return (
      <View className="content-list">
        {(activeTab === 'all' || activeTab === 'topics') && 
          content.topics?.map(renderTopicCard)}
        
        {(activeTab === 'all' || activeTab === 'projects') && 
          content.projects?.map(renderProjectCard)}
        
        {(activeTab === 'all' || activeTab === 'comments') && 
          content.comments?.map(renderCommentCard)}
      </View>
    );
  };

  if (!userInfo) {
    return (
      <View className="profile-page loading">
        <View className="loading-spinner"></View>
      </View>
    );
  }

  return (
    <View className="profile-page">
      <ScrollView className="profile-scroll" scrollY>
        {renderHeader()}
        {renderTabs()}
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default ProfilePage;// frontend/src/pages/profile/index.jsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  ThumbsUp,
  Heart,
  UserPlus,
  UserCheck,
  Settings,
  Grid,
  FileText,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import './index.scss';

const ProfilePage = () => {
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isHearted, setIsHearted] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, topics, projects, comments
  const [sortBy, setSortBy] = useState('latest'); // latest, likes, hearts, popular
  const [content, setContent] = useState({ topics: [], projects: [], comments: [] });
  const [loading, setLoading] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const tabs = [
    { key: 'all', label: '全部', icon: Grid },
    { key: 'topics', label: '话题', icon: FileText },
    { key: 'projects', label: '项目', icon: Briefcase },
    { key: 'comments', label: '评论', icon: MessageSquare }
  ];

  const sortOptions = [
    { key: 'latest', label: '最新', icon: Clock },
    { key: 'likes', label: '点赞最多', icon: ThumbsUp },
    { key: 'hearts', label: '收藏最多', icon: Heart },
    { key: 'popular', label: '最热门', icon: TrendingUp }
  ];

  useEffect(() => {
    const params = Taro.getCurrentInstance().router.params;
    const id = params.userId;
    
    if (id) {
      setUserId(id);
      checkIfCurrentUser(id);
      fetchUserProfile(id);
    } else {
      // 如果没有传 userId，显示当前登录用户
      const currentUser = Taro.getStorageSync('userInfo');
      if (currentUser) {
        setUserId(currentUser.id);
        setIsCurrentUser(true);
        fetchUserProfile(currentUser.id);
      } else {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          Taro.navigateTo({
            url: '/pages/login/index'
          });
        }, 1500);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [activeTab, sortBy]);

  const checkIfCurrentUser = (id) => {
    const currentUser = Taro.getStorageSync('userInfo');
    setIsCurrentUser(currentUser && currentUser.id === id);
  };

  const fetchUserProfile = async (id) => {
    setLoading(true);

    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${id}`,
        method: 'GET',
        data: {
          filterType: activeTab,
          sortBy
        },
        header: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      });

      if (res.data.code === 200) {
        setUserInfo(res.data.data.user);
        setIsFollowing(res.data.data.isFollowing);
        setContent(res.data.data.content);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${userId}/follow`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.code === 200) {
        setIsFollowing(res.data.data.isFollowing);
        Taro.showToast({
          title: res.data.message,
          icon: 'success'
        });
        // 刷新用户信息以更新粉丝数
        fetchUserProfile(userId);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  };

  const handleLike = async () => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${userId}/like`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.code === 200) {
        setIsLiked(res.data.data.isLiked);
        Taro.showToast({
          title: res.data.message,
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  };

  const handleHeart = async () => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/users/${userId}/heart`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.code === 200) {
        setIsHearted(res.data.data.isHearted);
        Taro.showToast({
          title: res.data.message,
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  };

  const goToSettings = () => {
    Taro.navigateTo({
      url: '/pages/settings/index'
    });
  };

  const goToFollowers = () => {
    Taro.navigateTo({
      url: `/pages/follow-list/index?userId=${userId}&type=followers`
    });
  };

  const goToFollowing = () => {
    Taro.navigateTo({
      url: `/pages/follow-list/index?userId=${userId}&type=following`
    });
  };

  const goToTopicDetail = (topicId) => {
    Taro.navigateTo({
      url: `/pages/topic-detail/index?id=${topicId}`
    });
  };

  const goToProjectDetail = (projectId) => {
    Taro.navigateTo({
      url: `/pages/project-detail/index?id=${projectId}`
    });
  };

  const renderHeader = () => (
    <View className="profile-header">
      <View className="header-background">
        <View className="gradient-overlay"></View>
      </View>

      <View className="header-content">
        <View className="avatar-section">
          <Image
            src={userInfo?.avatar || '/default-avatar.png'}
            className="avatar"
            mode="aspectFill"
          />
          {userInfo?.verified && (
            <View className="verified-badge">
              <Star size={16} fill="white" />
            </View>
          )}
        </View>

        <View className="user-info">
          <View className="username">
            {userInfo?.nickname || userInfo?.username}
          </View>
          <View className="user-meta">
            {userInfo?.major && <View className="meta-item">📚 {userInfo.major}</View>}
            {userInfo?.grade && <View className="meta-item">🎓 {userInfo.grade}</View>}
          </View>
          {userInfo?.bio && <View className="bio">{userInfo.bio}</View>}
        </View>

        <View className="stats-row">
          <View className="stat-item" onClick={goToFollowers}>
            <View className="stat-value">{userInfo?.followerCount || 0}</View>
            <View className="stat-label">粉丝</View>
          </View>
          <View className="stat-item" onClick={goToFollowing}>
            <View className="stat-value">{userInfo?.followingCount || 0}</View>
            <View className="stat-label">关注</View>
          </View>
          <View className="stat-item">
            <View className="stat-value">{userInfo?.topicCount || 0}</View>
            <View className="stat-label">话题</View>
          </View>
          <View className="stat-item">
            <View className="stat-value">{userInfo?.projectCount || 0}</View>
            <View className="stat-label">项目</View>
          </View>
        </View>

        {/* 技能标签 */}
        {userInfo?.skills && userInfo.skills.length > 0 && (
          <View className="tags-section">
            <View className="section-title">技能</View>
            <View className="tags">
              {userInfo.skills.map((skill, index) => (
                <View key={index} className="tag skill-tag">
                  {skill}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 兴趣标签 */}
        {userInfo?.interests && userInfo.interests.length > 0 && (
          <View className="tags-section">
            <View className="section-title">兴趣</View>
            <View className="tags">
              {userInfo.interests.map((interest, index) => (
                <View key={index} className="tag interest-tag">
                  {interest}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 操作按钮 */}
        <View className="action-buttons">
          {isCurrentUser ? (
            <View className="action-btn settings-btn" onClick={goToSettings}>
              <Settings size={18} />
              <View className="btn-text">编辑资料</View>
            </View>
          ) : (
            <>
              <View
                className={`action-btn follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={18} />
                    <View className="btn-text">已关注</View>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <View className="btn-text">关注</View>
                  </>
                )}
              </View>

              <View
                className={`action-btn icon-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLike}
              >
                <ThumbsUp size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </View>

              <View
                className={`action-btn icon-btn ${isHearted ? 'active-heart' : ''}`}
                onClick={handleHeart}
              >
                <Heart size={20} fill={isHearted ? 'currentColor' : 'none'} />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View className="content-tabs">
      <View className="tabs-wrapper">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <View
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={18} />
              <View className="tab-label">{tab.label}</View>
            </View>
          );
        })}
      </View>

      <View className="sort-dropdown">
        <View className="dropdown-trigger">
          {sortOptions.find(opt => opt.key === sortBy)?.icon && 
            React.createElement(sortOptions.find(opt => opt.key === sortBy).icon, { size: 16 })}
          <View className="sort-label">
            {sortOptions.find(opt => opt.key === sortBy)?.label}
          </View>
        </View>
        <View className="dropdown-menu">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <View
                key={option.key}
                className={`dropdown-item ${sortBy === option.key ? 'active' : ''}`}
                onClick={() => setSortBy(option.key)}
              >
                <Icon size={16} />
                <View className="option-label">{option.label}</View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderTopicCard = (topic) => (
    <View
      key={topic.id}
      className="content-card topic-card"
      onClick={() => goToTopicDetail(topic.id)}
    >
      {topic.cover && (
        <Image src={topic.cover} className="card-cover" mode="aspectFill" />
      )}
      <View className="card-body">
        <View className="card-title">{topic.title}</View>
        <View className="card-stats">
          <View className="stat">
            <ThumbsUp size={14} />
            <View className="stat-text">{topic.likeCount}</View>
          </View>
          <View className="stat">
            <Heart size={14} />
            <View className="stat-text">{topic.heartCount}</View>
          </View>
          <View className="stat">
            <MessageSquare size={14} />
            <View className="stat-text">{topic.commentCount}</View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderProjectCard = (project) => (
    <View
      key={project.id}
      className="content-card project-card"
      onClick={() => goToProjectDetail(project.id)}
    >
      <View className="card-header">
        <View className="project-name">{project.name}</View>
        <View className={`project-status status-${project.status}`}>
          {project.status === 'recruiting' ? '招募中' : 
           project.status === 'active' ? '进行中' : '已完成'}
        </View>
      </View>
      <View className="project-desc">{project.description}</View>
      <View className="project-tags">
        {project.tags.slice(0, 3).map((tag, index) => (
          <View key={index} className="tag">{tag}</View>
        ))}
      </View>
      <View className="card-stats">
        <View className="stat">
          <View className="stat-text">👥 {project.memberCount} 成员</View>
        </View>
        <View className="stat">
          <ThumbsUp size={14} />
          <View className="stat-text">{project.likeCount}</View>
        </View>
      </View>
    </View>
  );

  const renderCommentCard = (comment) => (
    <View
      key={comment.id}
      className="content-card comment-card"
      onClick={() => goToTopicDetail(comment.topic.id)}
    >
      <View className="comment-header">
        <Image src={comment.topic.cover} className="topic-thumb" mode="aspectFill" />
        <View className="topic-info">
          <View className="topic-title">{comment.topic.title}</View>
          <View className="comment-time">
            {new Date(comment.createdAt).toLocaleDateString()}
          </View>
        </View>
      </View>
      <View className="comment-content">{comment.content}</View>
      <View className="card-stats">
        <View className="stat">
          <ThumbsUp size={14} />
          <View className="stat-text">{comment.likeCount}</View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View className="loading-container">
          <View className="loading-spinner"></View>
          <View className="loading-text">加载中...</View>
        </View>
      );
    }

    const hasContent = 
      (activeTab === 'all' || activeTab === 'topics') && content.topics?.length > 0 ||
      (activeTab === 'all' || activeTab === 'projects') && content.projects?.length > 0 ||
      (activeTab === 'all' || activeTab === 'comments') && content.comments?.length > 0;

    if (!hasContent) {
      return (
        <View className="empty-state">
          <View className="empty-icon">📭</View>
          <View className="empty-text">暂无内容</View>
        </View>
      );
    }

    return (
      <View className="content-list">
        {(activeTab === 'all' || activeTab === 'topics') && 
          content.topics?.map(renderTopicCard)}
        
        {(activeTab === 'all' || activeTab === 'projects') && 
          content.projects?.map(renderProjectCard)}
        
        {(activeTab === 'all' || activeTab === 'comments') && 
          content.comments?.map(renderCommentCard)}
      </View>
    );
  };

  if (!userInfo) {
    return (
      <View className="profile-page loading">
        <View className="loading-spinner"></View>
      </View>
    );
  }

  return (
    <View className="profile-page">
      <ScrollView className="profile-scroll" scrollY>
        {renderHeader()}
        {renderTabs()}
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default ProfilePage;