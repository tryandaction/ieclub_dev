#!/usr/bin/env node
/**
 * 更新话题热度分数脚本
 * 使用 Hacker News 算法计算热度
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m[WARNING]\x1b[0m ${msg}`)
};

/**
 * 计算热度分数
 * 使用 Hacker News 算法: Score = (P-1) / (T+2)^G
 * P = 热度点数 (views * 1 + likes * 2 + comments * 3 + bookmarks * 2)
 * T = 发布时间距现在的小时数
 * G = 重力系数 (默认 1.8)
 */
function calculateHotScore(topic) {
  const {
    viewCount = 0,
    likeCount = 0,
    commentCount = 0,
    bookmarkCount = 0,
    createdAt
  } = topic;
  
  // 配置权重
  const VIEW_WEIGHT = 1;
  const LIKE_WEIGHT = 2;
  const COMMENT_WEIGHT = 3;
  const BOOKMARK_WEIGHT = 2;
  const GRAVITY = 1.8;
  
  // 计算热度点数
  const points = 
    viewCount * VIEW_WEIGHT +
    likeCount * LIKE_WEIGHT +
    commentCount * COMMENT_WEIGHT +
    bookmarkCount * BOOKMARK_WEIGHT;
  
  // 计算时间差（小时）
  const now = new Date();
  const created = new Date(createdAt);
  const hoursOld = (now - created) / (1000 * 60 * 60);
  
  // 计算热度分数
  const score = (points - 1) / Math.pow(hoursOld + 2, GRAVITY);
  
  return parseFloat(score.toFixed(4));
}

/**
 * 更新单个话题的热度
 */
async function updateTopicHotScore(topicId) {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        bookmarkCount: true,
        createdAt: true
      }
    });
    
    if (!topic) {
      logger.warn(`话题 ${topicId} 不存在`);
      return null;
    }
    
    const hotScore = calculateHotScore(topic);
    
    await prisma.topic.update({
      where: { id: topicId },
      data: { hotScore }
    });
    
    return hotScore;
  } catch (error) {
    logger.error(`更新话题 ${topicId} 失败:`, error.message);
    return null;
  }
}

/**
 * 批量更新所有已发布话题的热度
 */
async function updateAllHotScores(options = {}) {
  const {
    limit = null,
    minAge = 0, // 最小发布时间（小时）
    batchSize = 100
  } = options;
  
  try {
    // 构建查询条件
    const where = {
      status: 'published'
    };
    
    if (minAge > 0) {
      const minDate = new Date(Date.now() - minAge * 60 * 60 * 1000);
      where.createdAt = { gte: minDate };
    }
    
    // 获取需要更新的话题
    const topics = await prisma.topic.findMany({
      where,
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        bookmarkCount: true,
        createdAt: true,
        hotScore: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    if (topics.length === 0) {
      logger.warn('没有需要更新的话题');
      return { updated: 0, failed: 0 };
    }
    
    logger.info(`找到 ${topics.length} 个话题需要更新热度`);
    
    let updated = 0;
    let failed = 0;
    let unchanged = 0;
    
    // 分批处理
    for (let i = 0; i < topics.length; i += batchSize) {
      const batch = topics.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(topics.length / batchSize);
      
      logger.info(`处理批次 ${batchNum}/${totalBatches} (${batch.length} 个话题)...`);
      
      const promises = batch.map(async (topic) => {
        try {
          const newScore = calculateHotScore(topic);
          const oldScore = topic.hotScore || 0;
          
          // 只有分数变化显著时才更新（避免无意义的更新）
          if (Math.abs(newScore - oldScore) > 0.0001) {
            await prisma.topic.update({
              where: { id: topic.id },
              data: { hotScore: newScore }
            });
            
            return { success: true, changed: true, topic };
          } else {
            return { success: true, changed: false };
          }
        } catch (error) {
          logger.error(`更新话题 ${topic.id} 失败:`, error.message);
          return { success: false };
        }
      });
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        if (result.success) {
          if (result.changed) {
            updated++;
            if (result.topic && updated <= 5) {
              // 显示前5个更新的话题
              const shortTitle = result.topic.title.length > 40 
                ? result.topic.title.substring(0, 40) + '...' 
                : result.topic.title;
              logger.info(`  ✓ [${result.topic.id}] ${shortTitle}`);
            }
          } else {
            unchanged++;
          }
        } else {
          failed++;
        }
      });
      
      // 避免过快的数据库操作
      if (i + batchSize < topics.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    logger.success(`\n更新完成: ${updated} 个已更新, ${unchanged} 个未变化, ${failed} 个失败`);
    
    return { updated, unchanged, failed };
    
  } catch (error) {
    logger.error('批量更新失败:', error.message);
    throw error;
  }
}

/**
 * 显示热度排行榜
 */
async function showTopHotTopics(limit = 20) {
  try {
    const topics = await prisma.topic.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        hotScore: true,
        createdAt: true
      },
      orderBy: { hotScore: 'desc' },
      take: limit
    });
    
    console.log('\n========================================');
    console.log(`  热度排行榜 Top ${limit}`);
    console.log('========================================\n');
    
    console.log(`${'排名'.padEnd(6)} ${'ID'.padEnd(8)} ${'标题'.padEnd(40)} ${'浏览'.padEnd(8)} ${'点赞'.padEnd(8)} ${'评论'.padEnd(8)} ${'热度'}`);
    console.log('-'.repeat(100));
    
    topics.forEach((topic, index) => {
      const shortTitle = topic.title.length > 35 
        ? topic.title.substring(0, 35) + '...' 
        : topic.title;
      
      console.log(
        `${(index + 1).toString().padEnd(6)} ` +
        `${topic.id.toString().padEnd(8)} ` +
        `${shortTitle.padEnd(40)} ` +
        `${topic.viewCount.toString().padEnd(8)} ` +
        `${topic.likeCount.toString().padEnd(8)} ` +
        `${topic.commentCount.toString().padEnd(8)} ` +
        `${(topic.hotScore || 0).toFixed(4)}`
      );
    });
    
    console.log('');
    
  } catch (error) {
    logger.error('获取热度排行榜失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('  IEClub 热度分数更新工具');
  console.log('========================================\n');
  
  try {
    // 检查连接
    await prisma.$connect();
    logger.success('数据库连接成功');
    
    // 解析命令行参数
    const args = process.argv.slice(2);
    const command = args[0] || 'all';
    
    switch (command) {
      case 'all':
        // 更新所有话题
        logger.info('更新所有已发布话题的热度分数...\n');
        await updateAllHotScores();
        await showTopHotTopics(10);
        break;
        
      case 'recent':
        // 只更新最近的话题
        const hours = parseInt(args[1]) || 168; // 默认7天
        logger.info(`更新最近 ${hours} 小时内发布的话题...\n`);
        await updateAllHotScores({ minAge: hours });
        await showTopHotTopics(10);
        break;
        
      case 'top':
        // 只显示排行榜
        const limit = parseInt(args[1]) || 20;
        await showTopHotTopics(limit);
        break;
        
      case 'single':
        // 更新单个话题
        const topicId = parseInt(args[1]);
        if (!topicId) {
          logger.error('请提供话题 ID');
          process.exit(1);
        }
        logger.info(`更新话题 ${topicId} 的热度分数...`);
        const score = await updateTopicHotScore(topicId);
        if (score !== null) {
          logger.success(`新的热度分数: ${score}`);
        }
        break;
        
      default:
        console.log('使用方法:');
        console.log('  node update-hot-scores.js all         - 更新所有话题');
        console.log('  node update-hot-scores.js recent [小时] - 更新最近的话题（默认168小时）');
        console.log('  node update-hot-scores.js top [数量]   - 显示热度排行榜（默认20个）');
        console.log('  node update-hot-scores.js single <ID>  - 更新单个话题');
        break;
    }
    
    console.log('\n✅ 操作完成');
    
  } catch (error) {
    logger.error('执行失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = {
  calculateHotScore,
  updateTopicHotScore,
  updateAllHotScores,
  showTopHotTopics
};

