import { Rocket, BookOpen, Sparkles, BarChart3, Users2, Mail, Globe, Github, Heart } from 'lucide-react';

export default function About() {
  const appInfo = {
    name: 'IEClub',
    version: '1.7.0',
    slogan: '连接创新者，共建创业生态',
    description: 'IEClub是南方科技大学创新创业俱乐部的官方社区平台，致力于为创新创业者提供交流、协作、学习的空间。'
  };

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: '话题广场',
      desc: '分享创意，讨论项目，寻找合作伙伴'
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: '活动发布',
      desc: '组织活动，报名参与，扩展人脉'
    },
    {
      icon: <Users2 className="w-8 h-8" />,
      title: '社交网络',
      desc: '关注感兴趣的用户，建立自己的圈子'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: '项目协作',
      desc: '发布需求或供给，匹配合适的团队成员'
    }
  ];

  const team = [
    {
      role: '项目发起',
      name: '南方科技大学创新创业俱乐部',
      desc: '致力于培养学生的创新精神和创业能力'
    },
    {
      role: '技术支持',
      name: 'IEClub技术团队',
      desc: '全栈开发，持续迭代优化'
    }
  ];

  const contact = {
    email: 'ieclub@sustech.edu.cn',
    website: 'https://ieclub.online',
    github: 'https://github.com/tryandaction/ieclub_dev'
  };

  const stats = {
    users: '500+',
    topics: '1000+',
    activities: '100+'
  };

  // 复制文本
  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50">
      {/* Hero区域 */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-8xl mb-6 animate-bounce">🚀</div>
          <h1 className="text-5xl font-bold mb-3">{appInfo.name}</h1>
          <p className="text-lg opacity-90 mb-2">v{appInfo.version}</p>
          <p className="text-xl opacity-95">{appInfo.slogan}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* 关于平台 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-10 h-10 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">关于平台</h2>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-lg text-gray-700 leading-relaxed">{appInfo.description}</p>
          </div>
        </section>

        {/* 核心功能 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">核心功能</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all text-center"
              >
                <div className="text-green-600 mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 平台数据 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-10 h-10 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">平台数据</h2>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-10 shadow-lg">
            <div className="grid grid-cols-3 gap-8 text-center text-white">
              <div>
                <div className="text-5xl font-bold mb-2">{stats.users}</div>
                <div className="text-lg opacity-90">注册用户</div>
              </div>
              <div className="border-l border-r border-white/30">
                <div className="text-5xl font-bold mb-2">{stats.topics}</div>
                <div className="text-lg opacity-90">话题数</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">{stats.activities}</div>
                <div className="text-lg opacity-90">活动数</div>
              </div>
            </div>
          </div>
        </section>

        {/* 团队介绍 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users2 className="w-10 h-10 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">团队介绍</h2>
          </div>
          <div className="space-y-4">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm">
                <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                  {member.role}
                </span>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{member.name}</h3>
                <p className="text-gray-600 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 联系我们 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-10 h-10 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">联系我们</h2>
          </div>
          <div className="space-y-4">
            <div
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              onClick={() => copyText(contact.email)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">邮箱</div>
                  <div className="text-lg font-semibold text-gray-800">{contact.email}</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                复制
              </button>
            </div>

            <div
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              onClick={() => window.open(contact.website, '_blank')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">官网</div>
                  <div className="text-lg font-semibold text-gray-800">{contact.website}</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                访问
              </button>
            </div>

            <div
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              onClick={() => window.open(contact.github, '_blank')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Github className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">GitHub</div>
                  <div className="text-lg font-semibold text-gray-800">开源项目</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                查看
              </button>
            </div>
          </div>
        </section>

        {/* 页脚 */}
        <footer className="text-center py-12 space-y-3">
          <p className="text-gray-500 text-sm">© 2024 IEClub. All rights reserved.</p>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by IEClub Team
          </p>
        </footer>
      </div>
    </div>
  );
}
