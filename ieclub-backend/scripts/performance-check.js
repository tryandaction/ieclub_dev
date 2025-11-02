#!/usr/bin/env node
/**
 * 性能检查和诊断工具
 * 检查数据库性能、慢查询、索引使用情况等
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const logger = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  section: (msg) => {
    console.log(`\n${colors.cyan}${'='.repeat(60)}`);
    console.log(`  ${msg}`);
    console.log(`${'='.repeat(60)}${colors.reset}\n`);
  }
};

// 1. 检查数据库连接
async function checkConnection() {
  logger.section('数据库连接检查');
  
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - startTime;
    
    logger.success(`数据库连接正常 (延迟: ${duration}ms)`);
    
    if (duration > 100) {
      logger.warn('数据库延迟较高，可能影响性能');
    }
    
    return true;
  } catch (error) {
    logger.error('数据库连接失败:', error.message);
    return false;
  }
}

// 2. 检查表大小和记录数
async function checkTableSizes() {
  logger.section('表大小和记录数统计');
  
  try {
    const tables = ['User', 'Topic', 'Comment', 'Activity', 'Like', 'Bookmark', 'Tag'];
    
    console.log(`${colors.bright}${'表名'.padEnd(20)} ${'记录数'.padEnd(15)} ${'大小估算'}${colors.reset}`);
    console.log('-'.repeat(60));
    
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        const sizeEstimate = (count * 500 / 1024).toFixed(2); // 粗略估算，每条记录约500字节
        
        console.log(
          `${table.padEnd(20)} ${count.toString().padEnd(15)} ~${sizeEstimate}KB`
        );
      } catch (error) {
        console.log(`${table.padEnd(20)} ${colors.red}错误: ${error.message}${colors.reset}`);
      }
    }
    
  } catch (error) {
    logger.error('获取表大小失败:', error.message);
  }
}

// 3. 检查索引使用情况
async function checkIndexes() {
  logger.section('索引使用情况检查');
  
  try {
    const indexes = await prisma.$queryRaw`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        NON_UNIQUE,
        CARDINALITY
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('User', 'Topic', 'Comment', 'Activity', 'Like', 'Bookmark', 'Tag')
      ORDER BY TABLE_NAME, INDEX_NAME
    `;
    
    if (indexes && indexes.length > 0) {
      let currentTable = '';
      indexes.forEach(index => {
        if (index.TABLE_NAME !== currentTable) {
          console.log(`\n${colors.bright}${index.TABLE_NAME}:${colors.reset}`);
          currentTable = index.TABLE_NAME;
        }
        
        const uniqueStatus = index.NON_UNIQUE ? '非唯一' : '唯一';
        const cardinality = index.CARDINALITY || 0;
        
        let status = colors.green;
        if (cardinality < 10) status = colors.red;
        else if (cardinality < 100) status = colors.yellow;
        
        console.log(
          `  - ${index.INDEX_NAME.padEnd(30)} ${uniqueStatus.padEnd(10)} 基数: ${status}${cardinality}${colors.reset}`
        );
      });
      
      logger.success(`共找到 ${indexes.length} 个索引`);
    } else {
      logger.warn('未找到索引信息');
    }
    
  } catch (error) {
    logger.error('获取索引信息失败:', error.message);
  }
}

// 4. 检查数据分布
async function checkDataDistribution() {
  logger.section('数据分布分析');
  
  try {
    // 话题状态分布
    const topicStatus = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM Topic
      GROUP BY status
    `;
    
    console.log(`${colors.bright}话题状态分布:${colors.reset}`);
    topicStatus.forEach(item => {
      console.log(`  ${item.status}: ${item.count}`);
    });
    
    // 话题分类分布
    const topicCategories = await prisma.$queryRaw`
      SELECT category, COUNT(*) as count
      FROM Topic
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log(`\n${colors.bright}话题分类分布 (Top 10):${colors.reset}`);
    topicCategories.forEach(item => {
      console.log(`  ${item.category}: ${item.count}`);
    });
    
    // 用户角色分布
    const userRoles = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count
      FROM User
      GROUP BY role
    `;
    
    console.log(`\n${colors.bright}用户角色分布:${colors.reset}`);
    userRoles.forEach(item => {
      console.log(`  ${item.role}: ${item.count}`);
    });
    
  } catch (error) {
    logger.error('获取数据分布失败:', error.message);
  }
}

// 5. 检查热门内容
async function checkHotContent() {
  logger.section('热门内容分析');
  
  try {
    // Top 10 热门话题
    const hotTopics = await prisma.topic.findMany({
      take: 10,
      orderBy: { hotScore: 'desc' },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        hotScore: true
      }
    });
    
    console.log(`${colors.bright}Top 10 热门话题:${colors.reset}`);
    console.log(`${'ID'.padEnd(8)} ${'标题'.padEnd(35)} ${'浏览'.padEnd(8)} ${'点赞'.padEnd(8)} ${'评论'.padEnd(8)} ${'热度'}`);
    console.log('-'.repeat(80));
    
    hotTopics.forEach(topic => {
      const shortTitle = topic.title.length > 30 
        ? topic.title.substring(0, 30) + '...' 
        : topic.title;
      
      console.log(
        `${topic.id.toString().padEnd(8)} ` +
        `${shortTitle.padEnd(35)} ` +
        `${topic.viewCount.toString().padEnd(8)} ` +
        `${topic.likeCount.toString().padEnd(8)} ` +
        `${topic.commentCount.toString().padEnd(8)} ` +
        `${(topic.hotScore || 0).toFixed(2)}`
      );
    });
    
    // Top 10 活跃用户
    const activeUsers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.username,
        COUNT(DISTINCT t.id) as topicCount,
        COUNT(DISTINCT c.id) as commentCount,
        u.credits
      FROM User u
      LEFT JOIN Topic t ON u.id = t.authorId
      LEFT JOIN Comment c ON u.id = c.authorId
      GROUP BY u.id
      ORDER BY (COUNT(DISTINCT t.id) + COUNT(DISTINCT c.id)) DESC
      LIMIT 10
    `;
    
    console.log(`\n${colors.bright}Top 10 活跃用户:${colors.reset}`);
    console.log(`${'ID'.padEnd(8)} ${'用户名'.padEnd(20)} ${'话题数'.padEnd(10)} ${'评论数'.padEnd(10)} ${'积分'}`);
    console.log('-'.repeat(70));
    
    activeUsers.forEach(user => {
      console.log(
        `${user.id.toString().padEnd(8)} ` +
        `${user.username.padEnd(20)} ` +
        `${user.topicCount.toString().padEnd(10)} ` +
        `${user.commentCount.toString().padEnd(10)} ` +
        `${user.credits || 0}`
      );
    });
    
  } catch (error) {
    logger.error('获取热门内容失败:', error.message);
  }
}

// 6. 性能建议
async function performanceRecommendations() {
  logger.section('性能优化建议');
  
  try {
    const topicCount = await prisma.topic.count();
    const userCount = await prisma.user.count();
    const commentCount = await prisma.comment.count();
    
    const recommendations = [];
    
    // 数据量检查
    if (topicCount > 10000) {
      recommendations.push('🔸 话题数量较多，建议定期归档旧话题');
    }
    
    if (commentCount > 50000) {
      recommendations.push('🔸 评论数量较多，建议实施分页和延迟加载');
    }
    
    // 检查是否有未发布的话题占比过高
    const draftTopics = await prisma.topic.count({ where: { status: 'draft' } });
    if (draftTopics > topicCount * 0.3) {
      recommendations.push('🔸 草稿话题占比过高，建议清理长期未发布的草稿');
    }
    
    // 检查是否有需要更新热度分数的话题
    const oldTopics = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM Topic
      WHERE status = 'published'
      AND (hotScore IS NULL OR hotScore = 0)
      AND createdAt < DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
    
    if (oldTopics[0].count > 0) {
      recommendations.push(`🔸 发现 ${oldTopics[0].count} 个话题的热度分数需要更新`);
      recommendations.push('   建议运行: npm run update-hot-scores');
    }
    
    // 通用建议
    recommendations.push('✅ 定期执行 ANALYZE TABLE 优化查询计划');
    recommendations.push('✅ 监控慢查询日志，优化耗时查询');
    recommendations.push('✅ 使用 Redis 缓存热门数据');
    recommendations.push('✅ 考虑使用 CDN 加速静态资源');
    
    if (recommendations.length === 0) {
      logger.success('暂无性能问题，系统运行良好！');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }
    
  } catch (error) {
    logger.error('生成建议失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log(`${colors.magenta}${colors.bright}`);
  console.log('========================================');
  console.log('  IEClub 性能检查工具');
  console.log('========================================');
  console.log(colors.reset);
  
  try {
    // 执行所有检查
    const connected = await checkConnection();
    
    if (!connected) {
      logger.error('数据库连接失败，无法继续检查');
      process.exit(1);
    }
    
    await checkTableSizes();
    await checkIndexes();
    await checkDataDistribution();
    await checkHotContent();
    await performanceRecommendations();
    
    console.log(`\n${colors.green}${colors.bright}检查完成！${colors.reset}\n`);
    
  } catch (error) {
    logger.error('检查过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = {
  checkConnection,
  checkTableSizes,
  checkIndexes,
  checkDataDistribution,
  checkHotContent,
  performanceRecommendations
};

