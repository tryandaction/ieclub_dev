/**
 * 社区页面
 * 包含：社区群体、智能匹配、排行榜
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import { Award, Users, Zap, TrendingUp, Medal, Trophy } from 'lucide-react';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('groups'); // 'groups' | 'match' | 'leaderboard'

  // 模拟社区群体数据
  const communityGroups = [
    {
      id: 1,
      name: '前端开发交流',
      avatar: '💻',
      members: 245,
      posts: 1203,
      description: '分享前端技术，讨论React/Vue/Angular',
      tags: ['前端', 'JavaScript', 'React'],
      isJoined: true,
    },
    {
      id: 2,
      name: '数学建模小组',
      avatar: '📊',
      members: 189,
      posts: 876,
      description: '数学建模竞赛、算法讨论',
      tags: ['数学', '建模', '竞赛'],
      isJoined: false,
    },
    {
      id: 3,
      name: '创业与投资',
      avatar: '🚀',
      members: 312,
      posts: 1542,
      description: '创业项目孵化、融资经验分享',
      tags: ['创业', '投资', '商业'],
      isJoined: true,
    },
    {
      id: 4,
      name: '物理实验室',
      avatar: '⚛️',
      members: 156,
      posts: 634,
      description: '物理学术讨论、实验技巧分享',
      tags: ['物理', '实验', '科研'],
      isJoined: false,
    },
  ];

  // 模拟排行榜数据
  const leaderboardData = [
    { rank: 1, name: '张明', avatar: '👨‍💻', score: 2845, trend: 'up', change: 12 },
    { rank: 2, name: '李思', avatar: '👩‍🔬', score: 2634, trend: 'up', change: 8 },
    { rank: 3, name: '王浩', avatar: '🧑‍💼', score: 2512, trend: 'down', change: -3 },
    { rank: 4, name: '陈晓', avatar: '👨‍🎨', score: 2389, trend: 'up', change: 15 },
    { rank: 5, name: '赵六', avatar: '👨‍💻', score: 2267, trend: 'same', change: 0 },
  ];

  const handleGroupClick = (group) => {
    console.log('进入社区:', group);
  };

  const handleJoinGroup = (groupId, e) => {
    e.stopPropagation();
    console.log('加入社区:', groupId);
  };

  const handleStartMatch = () => {
    navigate('/match');
  };

  const renderGroups = () => (
    <div className="space-y-4">
      {communityGroups.map((group) => (
        <div
          key={group.id}
          onClick={() => handleGroupClick(group)}
          className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start gap-4">
            {/* 群体头像 */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl flex-shrink-0">
              {group.avatar}
            </div>

            {/* 群体信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                <button
                  onClick={(e) => handleJoinGroup(group.id, e)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    group.isJoined
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                  }`}
                >
                  {group.isJoined ? '已加入' : '+ 加入'}
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {group.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{group.members} 成员</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon="comment" size="xs" />
                  <span>{group.posts} 帖子</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMatch = () => (
    <div className="space-y-6">
      {/* 匹配介绍卡片 */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="relative z-10">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="text-2xl font-bold mb-2">智能匹配</h2>
          <p className="text-sm opacity-90 mb-4">
            基于你的兴趣、技能和需求，为你推荐最合适的学习伙伴和项目团队
          </p>
          <button
            onClick={handleStartMatch}
            className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
          >
            开始匹配 →
          </button>
        </div>
      </div>

      {/* 匹配功能特点 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
            <Zap size={24} className="text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">快速匹配</h3>
          <p className="text-xs text-gray-600">AI智能算法，秒级匹配</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-3">
            <Users size={24} className="text-pink-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">精准推荐</h3>
          <p className="text-xs text-gray-600">多维度匹配度评估</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
            <Award size={24} className="text-orange-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">实名认证</h3>
          <p className="text-xs text-gray-600">南科大学生身份验证</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <TrendingUp size={24} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">持续优化</h3>
          <p className="text-xs text-gray-600">根据反馈不断改进</p>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-4">
      {/* 排行榜说明 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
        <div className="flex items-center gap-3">
          <Trophy size={24} className="text-yellow-600" />
          <div>
            <h3 className="font-bold text-gray-800">社区贡献榜</h3>
            <p className="text-xs text-gray-600">根据发帖、回复、点赞等活动计算</p>
          </div>
        </div>
      </div>

      {/* 排行榜列表 */}
      {leaderboardData.map((user, index) => (
        <div
          key={user.rank}
          className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
            index < 3 ? 'border-2 border-yellow-200' : ''
          }`}
          onClick={() => navigate(`/user/${user.name}`)}
        >
          <div className="flex items-center gap-4">
            {/* 排名 */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
              user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
              user.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
              'bg-gray-100 text-gray-600'
            }`}>
              {user.rank <= 3 ? (
                <Medal size={20} />
              ) : (
                user.rank
              )}
            </div>

            {/* 用户信息 */}
            <div className="flex-1 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl">
                {user.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-500">声望值: {user.score}</p>
              </div>
            </div>

            {/* 变化趋势 */}
            <div className={`flex items-center gap-1 text-sm font-medium ${
              user.trend === 'up' ? 'text-green-600' :
              user.trend === 'down' ? 'text-red-600' :
              'text-gray-400'
            }`}>
              {user.trend === 'up' && (
                <>
                  <TrendingUp size={16} />
                  <span>+{user.change}</span>
                </>
              )}
              {user.trend === 'down' && (
                <>
                  <TrendingUp size={16} className="rotate-180" />
                  <span>{user.change}</span>
                </>
              )}
              {user.trend === 'same' && (
                <span className="text-gray-400">--</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="community-page pb-20">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>👥</span>
            <span>社区</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">加入社群，结识志同道合的伙伴</p>
        </div>

        {/* Tab切换 */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveSection('groups')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeSection === 'groups' ? 'text-pink-600' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={18} />
              <span>社区群体</span>
            </div>
            {activeSection === 'groups' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-600 to-purple-600" />
            )}
          </button>
          
          <button
            onClick={() => setActiveSection('match')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeSection === 'match' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap size={18} />
              <span>智能匹配</span>
            </div>
            {activeSection === 'match' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            )}
          </button>

          <button
            onClick={() => setActiveSection('leaderboard')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeSection === 'leaderboard' ? 'text-orange-600' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Trophy size={18} />
              <span>排行榜</span>
            </div>
            {activeSection === 'leaderboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-500" />
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 py-4">
        {activeSection === 'groups' && renderGroups()}
        {activeSection === 'match' && renderMatch()}
        {activeSection === 'leaderboard' && renderLeaderboard()}
      </div>
    </div>
  );
};

export default CommunityPage;

