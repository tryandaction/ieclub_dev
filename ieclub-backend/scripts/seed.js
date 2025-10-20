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
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        username: 'testuser',
        nickname: '测试用户',
        password: hashedPassword,
        avatar: 'https://via.placeholder.com/100',
        bio: '这是测试用户账号',
        major: '计算机科学',
        year: '大三'
      }
    });

    logger.info(`创建测试用户: ${testUser.nickname} (ID: ${testUser.id})`);

    // 创建测试话题
    const testTopics = [
      {
        title: '欢迎来到 IEClub 话题广场！',
        content: '这是我们的第一个测试话题。IEClub 是一个专注于技术交流和项目合作的平台，在这里你可以分享你的想法、寻找合作伙伴、参与有趣的项目。',
        category: 'tech',
        tags: ['欢迎', '社区', '介绍'],
        authorId: testUser.id,
        images: []
      },
      {
        title: '分享一个前端性能优化的经验',
        content: '最近在优化一个 React 应用，从 5s 加载时间优化到 1.2s。主要采用了代码分割、图片懒加载、CDN 加速等技术。有什么经验想要分享吗？',
        category: 'tech',
        tags: ['前端', '性能优化', 'React'],
        authorId: testUser.id,
        images: []
      },
      {
        title: '寻找 AI 项目合作伙伴',
        content: '有一个基于 GPT 的教育助手项目想法，需要前端、后端和 UI 设计师。有兴趣的一起交流吧！',
        category: 'project',
        tags: ['AI', '教育', '创业'],
        authorId: testUser.id,
        images: []
      }
    ];

    for (const topicData of testTopics) {
      const topic = await prisma.topic.create({
        data: topicData
      });
      logger.info(`创建测试话题: ${topic.title} (ID: ${topic.id})`);
    }

    // 创建测试评论
    const firstTopic = await prisma.topic.findFirst();
    if (firstTopic) {
      await prisma.comment.create({
        data: {
          content: '欢迎！看起来是个很棒的平台！',
          authorId: testUser.id,
          topicId: firstTopic.id
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