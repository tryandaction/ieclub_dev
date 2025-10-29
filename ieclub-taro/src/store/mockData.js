// 模拟数据
export const mockTopics = [
  {
    id: 1,
    type: 'offer',
    title: 'Python爬虫实战',
    cover: '🐍',
    author: { id: 1, name: '张三', avatar: '👨‍💻', level: 12 },
    tags: ['Python', '爬虫'],
    stats: { views: 456, likes: 89, comments: 34 },
    height: 280,
    createdAt: '2小时前'
  },
  {
    id: 2,
    type: 'demand',
    title: '线性代数期末串讲',
    cover: '📐',
    author: { id: 2, name: '李四', avatar: '👩‍🎓', level: 8 },
    tags: ['数学', '期末'],
    stats: { views: 234, likes: 45, comments: 23, wantCount: 12 },
    height: 320,
    createdAt: '5小时前'
  },
  {
    id: 3,
    type: 'project',
    title: '智能选课助手',
    cover: '🚀',
    author: { id: 3, name: '王五', avatar: '🎯', level: 10 },
    tags: ['创业', 'AI'],
    stats: { views: 890, likes: 156, comments: 67 },
    height: 300,
    createdAt: '1天前'
  },
  {
    id: 4,
    type: 'offer',
    title: 'React Hooks深度解析',
    cover: '⚛️',
    author: { id: 1, name: '张三', avatar: '👨‍💻', level: 12 },
    tags: ['React', '前端'],
    stats: { views: 678, likes: 123, comments: 45 },
    height: 260,
    createdAt: '3小时前'
  },
  {
    id: 5,
    type: 'demand',
    title: '求概率论辅导',
    cover: '🎲',
    author: { id: 4, name: '赵六', avatar: '👨‍🎓', level: 6 },
    tags: ['概率论', '求助'],
    stats: { views: 156, likes: 34, comments: 12, wantCount: 8 },
    height: 290,
    createdAt: '2天前'
  },
  {
    id: 6,
    type: 'project',
    title: '校园二手交易平台',
    cover: '🛍️',
    author: { id: 5, name: '孙七', avatar: '💼', level: 9 },
    tags: ['创业', '小程序'],
    stats: { views: 445, likes: 89, comments: 56 },
    height: 310,
    createdAt: '1周前'
  }
]

export const mockUsers = [
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
]

export const mockActivities = [
  {
    id: 1,
    title: 'Python数据分析工作坊',
    cover: '🐍',
    time: '明天 14:00-17:00',
    location: '图书馆301',
    participants: { current: 23, max: 30 },
    tags: ['Python', '数据分析']
  },
  {
    id: 2,
    title: '创业项目路演',
    cover: '💼',
    time: '本周五 19:00-21:00',
    location: '慧园报告厅',
    participants: { current: 45, max: 100 },
    tags: ['创业', '路演']
  },
  {
    id: 3,
    title: '设计思维工作坊',
    cover: '🎨',
    time: '下周一 15:00-18:00',
    location: '设计学院',
    participants: { current: 15, max: 20 },
    tags: ['设计', '创新']
  }
]

export const mockPosts = [
  {
    id: 1,
    author: { name: '张明', avatar: '👨‍💻' },
    content: '寻找对AI+教育感兴趣的小伙伴，一起做项目！有想法的同学可以联系我。',
    time: '2小时前',
    likes: 23,
    comments: 8
  },
  {
    id: 2,
    author: { name: '李思', avatar: '👩‍🔬' },
    content: '分享一个Python学习路径，适合零基础的同学，从入门到实战全覆盖。',
    time: '5小时前',
    likes: 45,
    comments: 15
  },
  {
    id: 3,
    author: { name: '王浩', avatar: '🧑‍🎨' },
    content: '【资源分享】超全UI设计工具合集，包含Figma、Sketch等教程和资源。',
    time: '1天前',
    likes: 67,
    comments: 22
  },
  {
    id: 4,
    author: { name: '刘强', avatar: '👨‍💼' },
    content: '求推荐好用的数据可视化库，最好是Python的，有用过的同学吗？',
    time: '3小时前',
    likes: 12,
    comments: 5
  }
]

export const currentUser = {
  name: '张三',
  avatar: '👨‍💻',
  major: '计算机科学与技术',
  grade: '大三',
  level: 12,
  score: 1420,
  bio: '代码改变世界，学习永无止境 🚀',
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
}

