// scripts/seed.js - 数据库种子数据脚本

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');

const prisma = new PrismaClient();

async function main() {
  logger.info('开始填充种子数据...');

  try {
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('123456', 10);

    const testUser = await prisma.user.upsert({
      where: { openid: 'test_openid_123' },
      update: {},
      create: {
        openid: 'test_openid_123',
        nickname: '测试用户',
        avatar: 'https://via.placeholder.com/100',
        email: 'test@example.com',
        bio: '这是测试用户账号',
        gender: 0,
        credits: 100,
        level: 1,
        exp: 0,
        topicsCount: 0,
        commentsCount: 0,
        likesCount: 0,
        fansCount: 0,
        followsCount: 0,
        status: 'active',
        isCertified: false,
        isVip: false
      }
    });

    logger.info(`创建测试用户: ${testUser.nickname} (ID: ${testUser.id})`);

    // 创建测试话题（只使用数据库中最基本的字段）
    const testTopics = [
      {
        title: '欢迎来到 IEClub 话题广场！',
        content: '这是我们的第一个测试话题。IEClub 是一个专注于技术交流和项目合作的平台，在这里你可以分享你的想法、寻找合作伙伴、参与有趣的项目。',
        contentType: 'topic_offer',
        category: 'tech',
        topicType: 'discussion',
        authorId: testUser.id,
        images: JSON.stringify([]),
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      },
      {
        title: '分享一个前端性能优化的经验',
        content: '最近在优化一个 React 应用，从 5s 加载时间优化到 1.2s。主要采用了代码分割、图片懒加载、CDN 加速等技术。有什么经验想要分享吗？',
        contentType: 'topic_offer',
        category: 'tech',
        topicType: 'discussion',
        authorId: testUser.id,
        images: JSON.stringify([]),
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      },
      {
        title: '寻找 AI 项目合作伙伴',
        content: '有一个基于 GPT 的教育助手项目想法，需要前端、后端和 UI 设计师。有兴趣的一起交流吧！',
        contentType: 'project',
        category: 'project',
        topicType: 'collaboration',
        authorId: testUser.id,
        images: JSON.stringify([]),
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      }
    ];

    for (const topicData of testTopics) {
      const topic = await prisma.topic.create({
        data: topicData
      });
      logger.info(`创建测试话题: ${topic.title} (ID: ${topic.id})`);
    }

    // 创建测试评论（只使用数据库存在的字段）
    const firstTopic = await prisma.topic.findFirst();
    if (firstTopic) {
      await prisma.comment.create({
        data: {
          content: '欢迎！看起来是个很棒的平台！',
          images: JSON.stringify([]),
          parentId: null,
          rootId: null,
          repliesCount: 0,
          likesCount: 0,
          status: 'published',
          authorId: testUser.id,
          topicId: firstTopic.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      logger.info('创建测试评论');
    }

    logger.info('种子数据填充完成！');

  } catch (error) {
    logger.error('种子数据填充失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error('种子数据脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });