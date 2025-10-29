import React, { useState } from 'react';
import { Heart, MessageCircle, Eye, Bookmark, Search, Filter, Bell, User, PlusCircle, Home, Users, Calendar, TrendingUp, Award, ChevronRight, Star, MapPin, Clock, Trophy, Medal, Flame, BookOpen, Wrench, Lightbulb, Send, X, Edit3, Settings, Share2, MoreHorizontal, Camera, ExternalLink } from 'lucide-react';

// 模拟数据
const mockTopics = [
  {
    id: 1,
    type: 'offer',
    title: 'Python爬虫实战',
    cover: '🐍',
    author: { id: 1, name: '张三', avatar: '👨‍💻', level: 12 },
    tags: ['Python', '爬虫'],
    stats: { views: 456, likes: 89, comments: 34 },
    height: 280
  },
  {
    id: 2,
    type: 'demand',
    title: '线性代数期末串讲',
    cover: '📐',
    author: { id: 2, name: '李四', avatar: '👩‍🎓', level: 8 },
    tags: ['数学', '期末'],
    stats: { views: 234, likes: 45, comments: 23 },
    height: 320
  },
  {
    id: 3,
    type: 'project',
    title: '智能选课助手',
    cover: '🚀',
    author: { id: 3, name: '王五', avatar: '🎯', level: 10 },
    tags: ['创业', 'AI'],
    stats: { views: 890, likes: 156, comments: 67 },
    height: 300
  },
  {
    id: 4,
    type: 'offer',
    title: 'React Hooks深度解析',
    cover: '⚛️',
    author: { id: 1, name: '张三', avatar: '👨‍💻', level: 12 },
    tags: ['React', '前端'],
    stats: { views: 678, likes: 123, comments: 45 },
    height: 260
  },
  {
    id: 5,
    type: 'demand',
    title: '求概率论辅导',
    cover: '🎲',
    author: { id: 4, name: '赵六', avatar: '👨‍🎓', level: 6 },
    tags: ['概率论', '求助'],
    stats: { views: 156, likes: 34, comments: 12 },
    height: 290
  },
  {
    id: 6,
    type: 'project',
    title: '校园二手交易平台',
    cover: '🛍️',
    author: { id: 5, name: '孙七', avatar: '💼', level: 9 },
    tags: ['创业', '小程序'],
    stats: { views: 445, likes: 89, comments: 56 },
    height: 310
  }
];

const mockUsers = [
  {
    id: 1,
    name: '张三',
    avatar: '👨‍💻',
    major: '计算机科学',
    grade: '大三',
    level: 12,
    score: 1420,
    skills: ['Python', 'React', '算法'],
    bio: '代码改变世界',
    stats: { topics: 23, followers: 89, following: 45 },
    isFollowing: false
  },
  {
    id: 2,
    name: '李四',
    avatar: '👩‍🎓',
    major: '数学系',
    grade: '研一',
    level: 9,
    score: 820,
    skills: ['数学建模', '统计'],
    bio: '数学让世界更美好',
    stats: { topics: 15, followers: 56, following: 32 },
    isFollowing: true
  },
  {
    id: 3,
    name: '王五',
    avatar: '🎯',
    major: '创业者',
    grade: '校友',
    level: 10,
    score: 980,
    skills: ['产品设计', '项目管理'],
    bio: '用科技改变生活',
    stats: { topics: 18, followers: 145, following: 67 },
    isFollowing: false
  },
  {
    id: 4,
    name: '赵六',
    avatar: '👨‍🎓',
    major: '物理系',
    grade: '大二',
    level: 6,
    score: 520,
    skills: ['量子计算', '实验'],
    bio: '探索宇宙奥秘',
    stats: { topics: 8, followers: 34, following: 28 },
    isFollowing: false
  }
];

const App = () => {
  const [activeTab, setActiveTab] = useState('square');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showPublish, setShowPublish] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [users, setUsers] = useState(mockUsers);

  const toggleFollow = (userId) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
    ));
  };

  const TabBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-7xl mx-auto">
        {[
          { id: 'square', icon: Home, label: '广场' },
          { id: 'community', icon: Users, label: '社区' },
          { id: 'publish', icon: PlusCircle, label: '发布', special: true },
          { id: 'activities', icon: Calendar, label: '活动' },
          { id: 'profile', icon: User, label: '我的' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'publish' ? setShowPublish(true) : setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 ${
              tab.special ? 'relative -mt-6' : ''
            }`}
          >
            {tab.special ? (
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <tab.icon className="w-7 h-7 text-white" />
              </div>
            ) : (
              <>
                <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-xs mt-1 ${activeTab === tab.id ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const TopicCard = ({ topic, style }) => {
    const typeConfig = {
      offer: { gradient: 'from-blue-400 to-blue-600', icon: '🎤', label: '我来讲' },
      demand: { gradient: 'from-pink-400 to-pink-600', icon: '👂', label: '想听' },
      project: { gradient: 'from-orange-400 to-orange-600', icon: '🚀', label: '项目' }
    };
    const config = typeConfig[topic.type];

    return (
      <div 
        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer mb-4"
        style={style}
        onClick={() => setSelectedTopic(topic)}
      >
        <div className={`bg-gradient-to-br ${config.gradient} h-40 flex items-center justify-center text-6xl relative`}>
          {topic.cover}
          <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium flex items-center gap-1">
            <span>{config.icon}</span>
            <span className="text-gray-700">{config.label}</span>
          </div>
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">{topic.title}</h3>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xl">{topic.author.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 truncate">{topic.author.name}</div>
            </div>
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-medium">
              LV{topic.author.level}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-500 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {topic.stats.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {topic.stats.comments}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {topic.stats.views}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const SquarePage = () => {
    const filteredTopics = mockTopics.filter(t => filterType === 'all' || t.type === filterType);
    
    // 计算瀑布流布局
    const getColumns = () => {
      if (typeof window === 'undefined') return 2;
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 768) return 3;
      return 2;
    };

    const [columns, setColumns] = useState(getColumns());

    React.useEffect(() => {
      const handleResize = () => setColumns(getColumns());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const distributeToColumns = () => {
      const cols = Array.from({ length: columns }, () => []);
      const heights = Array(columns).fill(0);

      filteredTopics.forEach(topic => {
        const minHeightIndex = heights.indexOf(Math.min(...heights));
        cols[minHeightIndex].push(topic);
        heights[minHeightIndex] += topic.height + 16;
      });

      return cols;
    };

    const columnData = distributeToColumns();

    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-gray-200">
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索感兴趣的内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'all', label: '推荐', icon: '✨' },
                { id: 'offer', label: '我来讲', icon: '🎤' },
                { id: 'demand', label: '想听', icon: '👂' },
                { id: 'project', label: '项目', icon: '🚀' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filterType === filter.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.icon} {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 max-w-7xl mx-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {columnData.map((column, colIndex) => (
              <div key={colIndex} className="space-y-4">
                {column.map(topic => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const CommunityPage = () => (
    <div className="pb-20 bg-gray-50">
      <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white z-40">
        <div className="p-4 pb-6 max-w-7xl mx-auto">
          <h2 className="text-xl font-bold mb-4">发现伙伴</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
            <input
              type="text"
              placeholder="搜索用户..."
              className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm placeholder-purple-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="p-4 -mt-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              本周排行榜
            </h3>
            <button className="text-sm text-purple-600 flex items-center gap-1 hover:gap-2 transition-all">
              查看更多 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {users.slice(0, 3).map((user, i) => (
              <div key={user.id} className="text-center">
                <div className="relative inline-block mb-2">
                  <div className="text-4xl">{user.avatar}</div>
                  <div className={`absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-gray-300 text-gray-700' :
                    'bg-orange-400 text-orange-900'
                  }`}>
                    {i + 1}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                <div className="text-xs text-gray-500">{user.score}分</div>
              </div>
            ))}
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-3 px-1">可能认识的人</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-2xl p-4 hover:shadow-lg transition-all">
              <div className="text-center mb-3">
                <div className="text-5xl mb-2">{user.avatar}</div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="font-medium text-gray-900 text-sm">{user.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">
                    LV{user.level}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-1">{user.major}</div>
                <div className="text-xs text-gray-400 mb-3 line-clamp-1">{user.bio}</div>
                
                <div className="flex justify-center gap-4 text-xs text-gray-500 mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{user.stats.topics}</div>
                    <div>话题</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.stats.followers}</div>
                    <div>粉丝</div>
                  </div>
                </div>

                <button 
                  onClick={() => toggleFollow(user.id)}
                  className={`w-full py-2 rounded-full text-sm font-medium transition-all ${
                    user.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                  }`}
                >
                  {user.isFollowing ? '已关注' : '+ 关注'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ActivitiesPage = () => (
    <div className="pb-20 bg-gray-50">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 pb-8">
        <h2 className="text-xl font-bold mb-2">精彩活动</h2>
        <p className="text-sm text-purple-100">发现更多学习与交流的机会</p>
      </div>

      <div className="p-4 -mt-4 max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-32 flex items-center justify-center text-6xl">
              {i === 1 ? '🐍' : i === 2 ? '💼' : '🎨'}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {i === 1 ? 'Python数据分析工作坊' : i === 2 ? '创业项目路演' : '设计思维工作坊'}
              </h3>
              <div className="space-y-1 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  明天 14:00-17:00
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  图书馆301
                </div>
              </div>
              <button className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                立即报名
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProfilePage = () => {
    const currentUser = {
      name: '张三',
      avatar: '👨‍💻',
      major: '计算机科学与技术',
      grade: '大三',
      level: 12,
      score: 1420,
      bio: '代码改变世界，学习永无止境 🚀',
      cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      skills: ['Python', 'React', '算法', '机器学习', 'UI设计'],
      stats: { topics: 23, comments: 156, followers: 890, following: 145 },
      badges: ['🌟', '📚', '🎓', '💡', '🏆', '🔥'],
      achievements: [
        { title: 'ACM区域赛银牌', year: '2023', icon: '🥈' },
        { title: '数学建模国赛二等奖', year: '2023', icon: '🏅' }
      ],
      projects: [
        { name: '智能排课系统', role: 'Team Leader', icon: '📅' },
        { name: 'AI学习助手', role: '前端开发', icon: '🤖' }
      ],
      socialLinks: [
        { type: 'github', url: 'github.com/zhangsan', icon: '💻' },
        { type: 'blog', url: 'blog.zhangsan.com', icon: '📝' }
      ]
    };

    return (
      <div className="pb-20 bg-gray-50">
        <div 
          className="h-40 relative"
          style={{ background: currentUser.cover }}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all">
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
            <button 
              onClick={() => setShowEditProfile(true)}
              className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="px-4 -mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                <div className="text-6xl">{currentUser.avatar}</div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                  <span className="px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium">
                    LV{currentUser.level}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{currentUser.major} · {currentUser.grade}</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-gray-900">{currentUser.score}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900">7天</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{currentUser.bio}</p>

            <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-100">
              {[
                { label: '话题', value: currentUser.stats.topics },
                { label: '评论', value: currentUser.stats.comments },
                { label: '粉丝', value: currentUser.stats.followers },
                { label: '关注', value: currentUser.stats.following }
              ].map((stat, i) => (
                <button key={i} className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </button>
              ))}
            </div>

            <div className="pt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">擅长技能</div>
                  <button className="text-xs text-purple-600 hover:text-purple-700">编辑</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                  <button className="px-3 py-1.5 border border-dashed border-purple-300 text-purple-600 rounded-full text-sm hover:bg-purple-50">
                    + 添加
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    我的成就
                  </div>
                  <button className="text-xs text-purple-600 hover:text-purple-700">查看全部</button>
                </div>
                <div className="flex gap-2">
                  {currentUser.badges.map((badge, i) => (
                    <div key={i} className="text-3xl hover:scale-110 transition-transform cursor-pointer">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">🏆 获奖经历</h3>
                <button className="text-xs text-purple-600">+ 添加</button>
              </div>
              <div className="space-y-2">
                {currentUser.achievements.map((ach, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="text-2xl">{ach.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{ach.title}</div>
                      <div className="text-xs text-gray-500">{ach.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">🚀 项目经历</h3>
                <button className="text-xs text-purple-600">+ 添加</button>
              </div>
              <div className="space-y-2">
                {currentUser.projects.map((proj, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="text-2xl">{proj.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{proj.name}</div>
                      <div className="text-xs text-gray-500">{proj.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">🔗 社交链接</h3>
              <button className="text-xs text-purple-600">+ 添加</button>
            </div>
            <div className="space-y-2">
              {currentUser.socialLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-2xl">{link.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm text-purple-600">{link.url}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {[
              { icon: BookOpen, label: '我的话题', badge: '23', color: 'text-blue-600' },
              { icon: Bookmark, label: '我的收藏', badge: '45', color: 'text-yellow-600' },
              { icon: Award, label: '成就中心', badge: '12', color: 'text-purple-600' },
              { icon: TrendingUp, label: '数据统计', color: 'text-green-600' }
            ].map((item, i) => (
              <button key={i} className="w-full bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-lg transition-all">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const PublishModal = () => {
    const [publishType, setPublishType] = useState('offer');
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowPublish(false)}>
        <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">发布内容</h3>
              <button onClick={() => setShowPublish(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'offer', label: '我来讲', icon: '🎤', gradient: 'from-blue-500 to-blue-600' },
                { id: 'demand', label: '想听', icon: '👂', gradient: 'from-pink-500 to-pink-600' },
                { id: 'project', label: '项目', icon: '🚀', gradient: 'from-orange-500 to-orange-600' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setPublishType(type.id)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    publishType === type.id
                      ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
              <input
                type="text"
                placeholder={publishType === 'offer' ? '例如：Python爬虫实战教学' : '例如：求线性代数期末串讲'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
              <textarea
                rows={6}
                placeholder="详细说明你的内容..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">添加标签</label>
              <div className="flex flex-wrap gap-2">
                {['Python', '爬虫', '实战', '数据分析', '机器学习'].map(tag => (
                  <button key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-purple-100 hover:text-purple-600 transition-colors">
                    #{tag}
                  </button>
                ))}
                <button className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-purple-400 hover:text-purple-600">
                  + 自定义
                </button>
              </div>
            </div>

            <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">
              发布
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditProfileModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={() => setShowEditProfile(false)}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">编辑个人资料</h3>
              <button onClick={() => setShowEditProfile(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">头像</label>
              <div className="flex items-center gap-4">
                <div className="text-6xl">👨‍💻</div>
                <button className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200">
                  更换头像
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
              <input
                type="text"
                defaultValue="张三"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
              <textarea
                rows={3}
                defaultValue="代码改变世界，学习永无止境 🚀"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">专业</label>
              <input
                type="text"
                defaultValue="计算机科学与技术"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>大一</option>
                <option>大二</option>
                <option selected>大三</option>
                <option>大四</option>
                <option>研一</option>
                <option>研二</option>
                <option>研三</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowEditProfile(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={() => setShowEditProfile(false)}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TopicDetail = () => {
    if (!selectedTopic) return null;

    const typeConfig = {
      offer: { gradient: 'from-blue-400 to-blue-600', icon: '🎤', label: '我来讲', btnColor: 'bg-blue-500 hover:bg-blue-600' },
      demand: { gradient: 'from-pink-400 to-pink-600', icon: '👂', label: '想听', btnColor: 'bg-pink-500 hover:bg-pink-600' },
      project: { gradient: 'from-orange-400 to-orange-600', icon: '🚀', label: '项目', btnColor: 'bg-orange-500 hover:bg-orange-600' }
    };
    const config = typeConfig[selectedTopic.type];

    return (
      <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={() => setSelectedTopic(null)}>
        <div className="min-h-screen flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className={`bg-gradient-to-br ${config.gradient} h-48 flex items-center justify-center text-8xl relative`}>
              {selectedTopic.cover}
              <button 
                onClick={() => setSelectedTopic(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">{selectedTopic.author.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{selectedTopic.author.name}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                      LV{selectedTopic.author.level}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">2小时前</div>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:shadow-lg">
                  + 关注
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium">
                  {config.icon} {config.label}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedTopic.title}</h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedTopic.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                这是一个完整的{selectedTopic.title}课程，我会从基础概念开始讲解，通过实际案例帮助大家理解核心知识点。
                课程内容包括理论讲解、代码演示、实战练习三个部分，适合有一定基础的同学进阶学习。
              </p>

              <div className="flex items-center gap-6 py-6 border-y border-gray-100">
                <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                  <Heart className="w-6 h-6" />
                  <span className="font-medium">{selectedTopic.stats.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">{selectedTopic.stats.comments}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors">
                  <Bookmark className="w-6 h-6" />
                  <span className="font-medium">收藏</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition-colors ml-auto">
                  <Share2 className="w-6 h-6" />
                  <span className="font-medium">分享</span>
                </button>
              </div>

              {selectedTopic.type === 'demand' && (
                <div className="my-6 p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-2xl border border-pink-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-pink-800">想听人数</span>
                    <span className="text-2xl font-bold text-pink-600">12/15</span>
                  </div>
                  <div className="w-full h-3 bg-pink-200 rounded-full mb-4">
                    <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: '80%' }} />
                  </div>
                  <button className="w-full py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors">
                    我也想听 👂
                  </button>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900 text-lg">评论 {selectedTopic.stats.comments}</h4>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="text-3xl">
                      {i === 1 ? '👤' : i === 2 ? '👨‍🎓' : '👩‍💼'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">用户{i}</span>
                        <span className="text-xs text-gray-500">2小时前</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {i === 1 ? '这个话题很有意思，期待能够学到更多知识！' :
                         i === 2 ? '讲得太好了，终于理解了这个知识点' :
                         '什么时候开始？我想报名参加'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button className="hover:text-red-500 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {i * 3}
                        </button>
                        <button className="hover:text-blue-500">回复</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 -mx-6 px-6 -mb-6 pb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="写下你的评论..."
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {activeTab === 'square' && <SquarePage />}
        {activeTab === 'community' && <CommunityPage />}
        {activeTab === 'activities' && <ActivitiesPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </div>
      
      <TabBar />
      
      {showPublish && <PublishModal />}
      {showEditProfile && <EditProfileModal />}
      {selectedTopic && <TopicDetail />}
    </div>
  );
};

export default App;