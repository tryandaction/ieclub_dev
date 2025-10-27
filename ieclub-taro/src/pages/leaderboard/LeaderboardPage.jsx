import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall'); // overall, sharing, popularity, topics, projects
  const [timeRange, setTimeRange] = useState('week'); // week, month, all
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myRanking, setMyRanking] = useState(null);

  // 标签页配置
  const tabs = [
    { key: 'overall', label: '综合榜', icon: '🏆' },
    { key: 'sharing', label: '分享榜', icon: '💡' },
    { key: 'popularity', label: '人气榜', icon: '🌟' },
    { key: 'topics', label: '话题榜', icon: '🔥' },
    { key: 'projects', label: '项目榜', icon: '🚀' }
  ];

  // 时间范围配置
  const timeRanges = [
    { key: 'week', label: '周榜' },
    { key: 'month', label: '月榜' },
    { key: 'all', label: '总榜' }
  ];

  // 加载排行榜数据
  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, timeRange]);

  // 加载我的排名
  useEffect(() => {
    loadMyRanking();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leaderboard/${activeTab}`, {
        params: { timeRange, limit: 50 }
      });
      
      if (response.data.success) {
        setLeaderboardData(response.data.data.leaderboard);
      }
    } catch (error) {
      console.error('加载排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRanking = async () => {
    try {
      const response = await api.get('/leaderboard/my-ranking');
      if (response.data.success) {
        setMyRanking(response.data.data);
      }
    } catch (error) {
      console.log('未登录或加载排名失败');
    }
  };

  // 渲染排名变化图标
  const renderRankChange = (change) => {
    if (change > 0) return <span className="rank-change up">↑{change}</span>;
    if (change < 0) return <span className="rank-change down">↓{Math.abs(change)}</span>;
    return <span className="rank-change stable">-</span>;
  };

  // 渲染排名奖牌
  const renderRankMedal = (rank) => {
    if (rank === 1) return <span className="medal gold">🥇</span>;
    if (rank === 2) return <span className="medal silver">🥈</span>;
    if (rank === 3) return <span className="medal bronze">🥉</span>;
    return <span className="rank-number">{rank}</span>;
  };

  // 渲染综合排行榜项
  const renderOverallItem = (item) => (
    <div 
      key={item.user.id} 
      className="leaderboard-item"
      onClick={() => navigate(`/profile/${item.user.id}`)}
    >
      <div className="item-rank">
        {renderRankMedal(item.rank)}
      </div>
      
      <div className="item-avatar">
        <img 
          src={item.user.avatar || '/default-avatar.png'} 
          alt={item.user.nickname}
        />
        <div className="item-level">LV{item.user.level}</div>
      </div>

      <div className="item-info">
        <div className="item-name">
          {item.user.nickname}
          {renderRankChange(item.change)}
        </div>
        <div className="item-meta">
          {item.user.department} · {item.user.grade}
        </div>
        <div className="item-stats">
          <span>📝 {item.stats.topicsCount}</span>
          <span>💬 {item.stats.commentsCount}</span>
          <span>👥 {item.stats.followersCount}</span>
        </div>
      </div>

      <div className="item-score">
        <div className="score-value">{item.score}</div>
        <div className="score-label">积分</div>
      </div>
    </div>
  );

  // 渲染分享排行榜项
  const renderSharingItem = (item) => (
    <div 
      key={item.user.id} 
      className="leaderboard-item"
      onClick={() => navigate(`/profile/${item.user.id}`)}
    >
      <div className="item-rank">
        {renderRankMedal(item.rank)}
      </div>
      
      <div className="item-avatar">
        <img 
          src={item.user.avatar || '/default-avatar.png'} 
          alt={item.user.nickname}
        />
      </div>

      <div className="item-info">
        <div className="item-name">
          {item.user.nickname}
          {renderRankChange(item.change)}
        </div>
        <div className="item-meta">
          {item.user.department} · {item.user.grade}
        </div>
        <div className="item-stats">
          <span className="highlight">✅ {item.completedCount}次成团</span>
          <span>👥 {item.totalInterested}人想听</span>
        </div>
      </div>

      <div className="item-score">
        <div className="score-value">{item.topicsCount}</div>
        <div className="score-label">话题数</div>
      </div>
    </div>
  );

  // 渲染人气排行榜项
  const renderPopularityItem = (item) => (
    <div 
      key={item.user.id} 
      className="leaderboard-item"
      onClick={() => navigate(`/profile/${item.user.id}`)}
    >
      <div className="item-rank">
        {renderRankMedal(item.rank)}
      </div>
      
      <div className="item-avatar">
        <img 
          src={item.user.avatar || '/default-avatar.png'} 
          alt={item.user.nickname}
        />
      </div>

      <div className="item-info">
        <div className="item-name">
          {item.user.nickname}
          {renderRankChange(item.change)}
        </div>
        <div className="item-meta">
          {item.user.bio || '这个人很懒，什么都没写'}
        </div>
        <div className="item-stats">
          <span>📝 {item.topicsCount}</span>
          <span>❤️ {item.likesCount}</span>
        </div>
      </div>

      <div className="item-score">
        <div className="score-value">{item.followersCount}</div>
        <div className="score-label">粉丝</div>
      </div>
    </div>
  );

  // 渲染话题排行榜项
  const renderTopicItem = (item) => (
    <div 
      key={item.topic.id} 
      className="leaderboard-item topic-item"
      onClick={() => navigate(`/topic/${item.topic.id}`)}
    >
      <div className="item-rank">
        {renderRankMedal(item.rank)}
      </div>

      {item.topic.cover && (
        <div className="item-cover">
          <img src={item.topic.cover} alt={item.topic.title} />
        </div>
      )}

      <div className="item-info">
        <div className="item-name">
          {item.topic.title}
          {renderRankChange(item.change)}
        </div>
        <div className="item-meta">
          by {item.topic.author.nickname}
        </div>
        <div className="item-stats">
          <span>👀 {item.stats.views}</span>
          <span>❤️ {item.stats.likes}</span>
          <span>💬 {item.stats.comments}</span>
                  </div>
                  </div>

      <div className="item-score">
        <div className="score-value">{item.score}</div>
        <div className="score-label">热度</div>
                  </div>
                </div>
  );

  // 渲染项目排行榜项
  const renderProjectItem = (item) => (
    <div 
      key={item.project.id} 
      className="leaderboard-item project-item"
      onClick={() => navigate(`/topic/${item.project.id}`)}
    >
      <div className="item-rank">
        {renderRankMedal(item.rank)}
      </div>

      {item.project.cover && (
        <div className="item-cover">
          <img src={item.project.cover} alt={item.project.title} />
            </div>
          )}

      <div className="item-info">
        <div className="item-name">
          {item.project.title}
          {renderRankChange(item.change)}
        </div>
        <div className="item-meta">
          {item.project.description?.substring(0, 50)}...
        </div>
        <div className="item-stats">
          <span>❤️ {item.likesCount}</span>
          <span>💬 {item.commentsCount}</span>
          <span>⭐ {item.bookmarksCount}</span>
        </div>
      </div>

      <div className="item-score">
        <div className="score-value">{item.interestedCount}</div>
        <div className="score-label">关注</div>
      </div>
    </div>
  );

  // 根据activeTab渲染对应的列表项
  const renderItem = (item) => {
    switch (activeTab) {
      case 'overall':
        return renderOverallItem(item);
      case 'sharing':
        return renderSharingItem(item);
      case 'popularity':
        return renderPopularityItem(item);
      case 'topics':
        return renderTopicItem(item);
      case 'projects':
        return renderProjectItem(item);
      default:
        return null;
    }
  };

  return (
    <div className="leaderboard-page">
      {/* 页面头部 */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>排行榜</h1>
        <div className="header-placeholder"></div>
                  </div>

      {/* 我的排名卡片 */}
      {myRanking && (
        <div className="my-ranking-card">
          <div className="card-title">我的排名</div>
          <div className="ranking-grid">
            <div className="ranking-item">
              <div className="ranking-label">综合排名</div>
              <div className="ranking-value">
                #{myRanking.rankings.overall.rank}
                <span className="ranking-beat">
                  击败{myRanking.rankings.overall.beatPercentage}%用户
                </span>
                  </div>
                </div>
            <div className="ranking-item">
              <div className="ranking-label">分享排名</div>
              <div className="ranking-value">
                #{myRanking.rankings.sharing.rank}
              </div>
            </div>
            <div className="ranking-item">
              <div className="ranking-label">人气排名</div>
              <div className="ranking-value">
                #{myRanking.rankings.popularity.rank}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 标签页切换 */}
      <div className="tabs-container">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 时间范围切换 */}
      <div className="time-range-switcher">
        {timeRanges.map(range => (
          <button
            key={range.key}
            className={`range-button ${timeRange === range.key ? 'active' : ''}`}
            onClick={() => setTimeRange(range.key)}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* 排行榜列表 */}
      <div className="leaderboard-list">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>暂无排行数据</p>
          </div>
        ) : (
          leaderboardData.map(item => renderItem(item))
        )}
      </div>

      {/* 规则说明 */}
      <div className="rules-section">
        <h3>📋 排行榜规则</h3>
        <div className="rules-content">
          <h4>🏆 综合榜</h4>
          <p>基于积分、等级、话题数、评论数、粉丝数等多维度综合评分</p>
          
          <h4>💡 分享榜</h4>
          <p>基于"我来讲"话题的成团次数和互动数据</p>
          
          <h4>🌟 人气榜</h4>
          <p>基于粉丝数量排名</p>
          
          <h4>🔥 话题榜</h4>
          <p>基于话题的浏览、点赞、评论、收藏等热度指标</p>
          
          <h4>🚀 项目榜</h4>
          <p>基于项目的关注人数和互动数据</p>
        </div>

        <div className="reward-info">
          <h4>🎁 排行榜奖励</h4>
          <ul>
            <li>周榜前3名：专属勋章 + 100积分</li>
            <li>月榜前10名：推荐位展示 + 200积分</li>
            <li>年榜前20名：IEClub荣誉证书 + 专属福利</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
