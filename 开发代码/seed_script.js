// ieclub-backend/scripts/seed.js
// 数据填充脚本 - 修复了你之前的语法错误

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 创建测试用户
 */
async function createTestUsers() {
  console.log('📝 Creating test users...');
  
  const users = [
    {
      openid: 'test_openid_001',
      nickname: '张三',
      avatar: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=ZS',
      bio: 'AI 爱好者，关注 GPT 和教育科技',
      skills: ['人工智能', 'Python', '教育'],
      interests: ['AI', '创业', '教育'],
      level: 3,
      credits: 1200,
      isCertified: true
    },
    {
      openid: 'test_openid_002',
      nickname: '李四',
      avatar: 'https://via.placeholder.com/150/3498DB/FFFFFF?text=LS',
      bio: '产品经理，喜欢研究用户体验',
      skills: ['产品设计', 'UX', '项目管理'],
      interests: ['产品', '设计', '互联网'],
      level: 2,
      credits: 800
    },
    {
      openid: 'test_openid_003',
      nickname: '王五',
      avatar: 'https://via.placeholder.com/150/2ECC71/FFFFFF?text=WW',
      bio: '全栈开发者',
      skills: ['React', 'Node.js', 'MySQL'],
      interests: ['编程', '开源', '技术'],
      level: 4,
      credits: 1500,
      isCertified: true
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { openid: userData.openid },
      update: userData,
      create: userData
    });
    createdUsers.push(user);
    console.log(`  ✓ Created user: ${user.nickname}`);
  }

  return createdUsers;
}

/**
 * 创建测试话题
 */
async function createTestTopics(users) {
  console.log('\n📝 Creating test topics...');
  
  const topics = [
    {
      authorId: users[0].id,
      title: 'GPT-4 与教育变革：AI如何重塑个性化学习',
      content: '最近在开发一个 AI 学习助手，发现大模型在教育领域有巨大潜力。想和大家探讨：\n\n1. AI 如何实现真正的个性化学习？\n2. 教师的角色会如何变化？\n3. 如何解决数据隐私和公平性问题？\n\n欢迎有相关经验的朋友分享！',
      category: 'tech',
      tags: ['人工智能', 'GPT-4', '教育科技', '个性化学习'],
      topicType: 'supply',
      demandType: 'speaker',
      targetAudience: '对AI教育应用感兴趣的同学',
      duration: '45分钟',
      threshold: 15,
      quickActions: [
        { type: 'interested', label: '想听', count: 0 },
        { type: 'can_help', label: '我来分享', count: 0 }
      ],
      images: [
        {
          url: 'https://via.placeholder.com/800x600/3498DB/FFFFFF?text=AI+Education',
          width: 800,
          height: 600
        }
      ]
    },
    {
      authorId: users[1].id,
      title: '寻找懂 React Native 的小伙伴，一起做个校园社交App',
      content: '有个想法想做个校园社交App，主要功能：\n- 活动发布与报名\n- 兴趣小组\n- 校园二手市场\n\n目前我负责产品和设计，需要：\n- 1-2名前端开发(React Native)\n- 1名后端开发(Node.js)\n\n感兴趣的同学联系我！',
      category: 'project',
      tags: ['React Native', '校园', '社交', '创业'],
      topicType: 'demand',
      demandType: 'helper',
      skillsNeeded: ['React Native', 'Node.js', 'UI设计'],
      threshold: 3,
      quickActions: [
        { type: 'interested', label: '感兴趣', count: 0 },
        { type: 'can_help', label: '我能帮忙', count: 0 }
      ]
    },
    {
      authorId: users[2].id,
      title: '分享一个前端性能优化的实战经验',
      content: '上周帮公司网站做性能优化，首屏加载时间从 5s 降到 1.2s，总结了几个关键点：\n\n1. 代码分割与懒加载\n2. 图片优化(WebP + CDN)\n3. 关键 CSS 内联\n4. Service Worker 缓存策略\n\n有需要的同学可以一起交流！',
      category: 'tech',
      tags: ['前端', '性能优化', 'React', 'Webpack'],
      topicType: 'discussion',
      quickActions: [
        { type: 'interested', label: '想了解', count: 0 }
      ],
      links: [
        {
          title: 'Web Vitals 指南',
          url: 'https://web.dev/vitals/',
          description: 'Google 的 Web 性能指标'
        }
      ]
    },
    {
      authorId: users[0].id,
      title: '如何平衡学习和项目实践？',
      content: '最近感觉时间不够用：\n- 课程作业要完成\n- 想学新技术（Next.js、TypeScript）\n- 还想做几个项目积累经验\n\n大家是怎么平衡的？有什么时间管理的建议吗？',
      category: 'life',
      tags: ['时间管理', '学习', '项目'],
      topicType: 'question'
    },
    {
      authorId: users[1].id,
      title: '【资源分享】100+ 个免费的设计素材网站',
      content: '整理了一份设计资源清单，包括：\n✅ 图标库(20+)\n✅ 插画素材(30+)\n✅ 配色方案(15+)\n✅ 字体资源(25+)\n✅ UI Kit(10+)\n\n需要的同学可以留言，我发给你！',
      category: 'resource',
      tags: ['设计', '素材', '免费资源'],
      topicType: 'supply'
    },
    {
      authorId: users[2].id,
      title: '想组队参加黑客松，寻找队友',
      content: '下个月有个 48 小时黑客松比赛，主题是"可持续发展"。\n\n我是全栈开发，想找：\n- 1名设计师\n- 1名有创意的产品/运营同学\n\n有兴趣的加我微信：dev_wangwu',
      category: 'event',
      tags: ['黑客松', '比赛', '组队'],
      topicType: 'demand',
      demandType: 'helper',
      threshold: 2
    }
  ];

  const createdTopics = [];
  for (const topicData of topics) {
    const topic = await prisma.topic.create({
      data: {
        ...topicData,
        publishedAt: new Date(),
        viewsCount: Math.floor(Math.random() * 500) + 50,
        likesCount: Math.floor(Math.random() * 50) + 5,
        commentsCount: Math.floor(Math.random() * 20) + 1,
        wantToHearCount: Math.floor(Math.random() * 30) + 3,
        canHelpCount: Math.floor(Math.random() * 10) + 1,
        hotScore: Math.random() * 100
      }
    });
    createdTopics.push(topic);
    console.log(`  ✓ Created topic: ${topic.title}`);
  }

  return createdTopics;
}

/**
 * 创建测试评论
 */
async function createTestComments(users, topics) {
  console.log('\n📝 Creating test comments...');
  
  const comments = [
    {
      topicId: topics[0].id,
      authorId: users[1].id,
      content: '这个话题很有意思！我之前用过一些 AI 学习工具，确实能提高效率。'
    },
    {
      topicId: topics[0].id,
      authorId: users[2].id,
      content: '期待你的分享！我最近也在关注 GPT 在教育领域的应用。'
    },
    {
      topicId: topics[1].id,
      authorId: users[2].id,
      content: '我会 React Native 和 Node.js，可以一起讨论下！'
    },
    {
      topicId: topics[2].id,
      authorId: users[0].id,
      content: '感谢分享！正好最近在做性能优化，学到了👍'
    }
  ];

  for (const commentData of comments) {
    await prisma.comment.create({
      data: commentData
    });
    console.log(`  ✓ Created comment on topic: ${commentData.topicId.slice(0, 8)}...`);
  }
}

/**
 * 创建测试点赞和快速操作
 */
async function createTestInteractions(users, topics) {
  console.log('\n📝 Creating test interactions...');
  
  // 点赞
  await prisma.like.create({
    data: {
      userId: users[1].id,
      targetType: 'topic',
      targetId: topics[0].id
    }
  });
  
  await prisma.like.create({
    data: {
      userId: users[2].id,
      targetType: 'topic',
      targetId: topics[0].id
    }
  });

  console.log('  ✓ Created likes');

  // 快速操作
  await prisma.topicQuickAction.create({
    data: {
      topicId: topics[0].id,
      userId: users[1].id,
      actionType: 'interested'
    }
  });

  await prisma.topicQuickAction.create({
    data: {
      topicId: topics[0].id,
      userId: users[2].id,
      actionType: 'can_help'
    }
  });

  console.log('  ✓ Created quick actions');
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Starting database seed...\n');

  try {
    // 1. 创建用户
    const users = await createTestUsers();

    // 2. 创建话题
    const topics = await createTestTopics(users);

    // 3. 创建评论
    await createTestComments(users, topics);

    // 4. 创建互动
    await createTestInteractions(users, topics);

    console.log('\n✅ Seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Topics: ${topics.length}`);
    console.log(`   Ready to test!\n`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });