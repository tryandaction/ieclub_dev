/**
 * 数据分析看板组件
 * 功能：个人数据统计和可视化展示
 */
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Users, MessageSquare, Award, Eye, Heart } from 'lucide-react';

/**
 * 数据看板主组件
 */
export const DataDashboard = ({ userId }) => {
  const [timeRange, setTimeRange] = useState('30days'); // '7days' | '30days' | '90days' | '1year'
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [userId, timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取数据
      await new Promise(resolve => setTimeout(resolve, 500));
      setDashboardData(getMockDashboardData(timeRange));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 时间范围选择器 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">数据分析</h2>
        <div className="flex gap-2">
          {[
            { value: '7days', label: '近7天' },
            { value: '30days', label: '近30天' },
            { value: '90days', label: '近3个月' },
            { value: '1year', label: '近1年' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="总浏览量"
          value={dashboardData.overview.totalViews}
          change={dashboardData.overview.viewsChange}
          icon={<Eye className="text-blue-600" />}
          color="blue"
        />
        <MetricCard
          title="获赞数"
          value={dashboardData.overview.totalLikes}
          change={dashboardData.overview.likesChange}
          icon={<Heart className="text-pink-600" />}
          color="pink"
        />
        <MetricCard
          title="评论数"
          value={dashboardData.overview.totalComments}
          change={dashboardData.overview.commentsChange}
          icon={<MessageSquare className="text-green-600" />}
          color="green"
        />
        <MetricCard
          title="新增粉丝"
          value={dashboardData.overview.newFollowers}
          change={dashboardData.overview.followersChange}
          icon={<Users className="text-purple-600" />}
          color="purple"
        />
      </div>

      {/* 活跃度趋势图 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-600" />
          活跃度趋势
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboardData.activityTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" style={{ fontSize: 12 }} />
            <YAxis stroke="#666" style={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} name="浏览量" />
            <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} name="点赞数" />
            <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} name="评论数" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 内容表现分析 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 话题类型分布 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">话题类型分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dashboardData.topicTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.topicTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 热门话题Top5 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">热门话题 Top 5</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.topTopics} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" style={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="title" width={100} stroke="#666" style={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="views" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 技能雷达图 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">技能分析</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={dashboardData.skillsRadar}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="skill" stroke="#666" style={{ fontSize: 12 }} />
            <PolarRadiusAxis stroke="#666" />
            <Radar name="技能水平" dataKey="level" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 互动来源分析 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">粉丝来源分析</h3>
        <div className="space-y-3">
          {dashboardData.followersSources.map((source, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">{source.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${source.percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                  {source.count} ({source.percentage}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 热门标签云 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">常用标签</h3>
        <div className="flex flex-wrap gap-2">
          {dashboardData.popularTags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium hover:shadow-md transition-all cursor-pointer"
              style={{ fontSize: `${12 + tag.count / 5}px` }}
            >
              #{tag.name} <span className="text-xs text-purple-500">({tag.count})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 指标卡片组件
 */
const MetricCard = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-1">{value.toLocaleString()}</h3>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
};

// 图表颜色配置
const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f97316'];

// 模拟数据生成函数
function getMockDashboardData(timeRange) {
  const daysCount = {
    '7days': 7,
    '30days': 30,
    '90days': 90,
    '1year': 365
  }[timeRange] || 30;

  // 生成活跃度趋势数据
  const activityTrend = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    activityTrend.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      views: Math.floor(Math.random() * 200) + 50,
      likes: Math.floor(Math.random() * 50) + 10,
      comments: Math.floor(Math.random() * 30) + 5,
    });
  }

  return {
    overview: {
      totalViews: 12456,
      viewsChange: 23.5,
      totalLikes: 2345,
      likesChange: 15.2,
      totalComments: 567,
      commentsChange: -5.3,
      newFollowers: 89,
      followersChange: 31.8,
    },
    activityTrend,
    topicTypeDistribution: [
      { name: '我来讲', value: 45 },
      { name: '想听', value: 30 },
      { name: '项目', value: 25 },
    ],
    topTopics: [
      { title: 'AI教育变革', views: 1234 },
      { title: 'Python入门', views: 987 },
      { title: '机器学习', views: 756 },
      { title: '创业经验', views: 543 },
      { title: '数据分析', views: 432 },
    ],
    skillsRadar: [
      { skill: 'Python', level: 85 },
      { skill: 'React', level: 78 },
      { skill: 'AI/ML', level: 72 },
      { skill: '数据分析', level: 80 },
      { skill: '项目管理', level: 65 },
      { skill: '沟通表达', level: 90 },
    ],
    followersSources: [
      { name: '通过话题', count: 156, percentage: 45 },
      { name: '通过项目', count: 104, percentage: 30 },
      { name: '通过活动', count: 52, percentage: 15 },
      { name: '其他', count: 35, percentage: 10 },
    ],
    popularTags: [
      { name: 'Python', count: 45 },
      { name: 'AI', count: 38 },
      { name: '机器学习', count: 32 },
      { name: 'React', count: 28 },
      { name: '数据分析', count: 25 },
      { name: '创业', count: 22 },
      { name: '前端', count: 20 },
      { name: '算法', count: 18 },
      { name: '深度学习', count: 15 },
      { name: '教育', count: 12 },
    ],
  };
}

export default DataDashboard;

