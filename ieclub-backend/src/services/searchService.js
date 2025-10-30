// ===== services/searchService.js - 搜索服务（智能联想和纠错） =====
const prisma = require('../config/database');
const logger = require('../utils/logger');

class SearchService {
  /**
   * 搜索建议 - 智能联想
   */
  async getSearchSuggestions(keyword, limit = 10) {
    try {
      if (!keyword || keyword.length < 2) {
        return this.getPopularSearches(limit);
      }

      // 1. 从热门话题中匹配
      const topicMatches = await prisma.topic.findMany({
        where: {
          status: 'published',
          OR: [
            { title: { contains: keyword } },
            { tags: { hasSome: [keyword] } }
          ]
        },
        select: {
          title: true,
          tags: true
        },
        take: 5,
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' }
        ]
      });

      // 2. 从标签中匹配
      const allTopics = await prisma.topic.findMany({
        where: {
          status: 'published',
          tags: { isEmpty: false }
        },
        select: { tags: true },
        take: 1000
      });

      // 统计标签频率
      const tagCounts = {};
      allTopics.forEach(topic => {
        if (topic.tags && Array.isArray(topic.tags)) {
          topic.tags.forEach(tag => {
            if (tag.toLowerCase().includes(keyword.toLowerCase())) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      });

      const tagSuggestions = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      // 3. 从用户名中匹配
      const userMatches = await prisma.user.findMany({
        where: {
          status: 'active',
          OR: [
            { nickname: { contains: keyword } },
            { bio: { contains: keyword } }
          ]
        },
        select: {
          nickname: true
        },
        take: 3,
        orderBy: {
          level: 'desc'
        }
      });

      // 组合建议
      const suggestions = [
        ...new Set([
          ...topicMatches.map(t => t.title),
          ...tagSuggestions,
          ...userMatches.map(u => u.nickname)
        ])
      ].slice(0, limit);

      return suggestions;
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      return [];
    }
  }

  /**
   * 获取热门搜索
   */
  async getPopularSearches(limit = 10) {
    try {
      // 从搜索历史中统计热门关键词
      const searches = await prisma.searchHistory.groupBy({
        by: ['keyword'],
        _count: {
          keyword: true
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
          }
        },
        orderBy: {
          _count: {
            keyword: 'desc'
          }
        },
        take: limit
      });

      return searches.map(s => s.keyword);
    } catch (error) {
      logger.error('获取热门搜索失败:', error);
      // 返回默认热门搜索
      return [
        'Python', '机器学习', '前端开发', 'React',
        '算法', '数据结构', '项目实践', '竞赛经验'
      ].slice(0, limit);
    }
  }

  /**
   * 智能纠错 - 拼写纠正
   */
  correctSpelling(keyword) {
    // 常见拼写错误映射
    const corrections = {
      'paython': 'python',
      'javascrpt': 'javascript',
      'recat': 'react',
      '机其学习': '机器学习',
      '线代': '线性代数',
      '概率论': '概率论与数理统计',
      '数据库': '数据库原理',
      '计网': '计算机网络',
      '操作系统': '操作系统原理'
    };

    const lowerKeyword = keyword.toLowerCase();
    
    // 完全匹配
    if (corrections[lowerKeyword]) {
      return {
        corrected: true,
        original: keyword,
        suggestion: corrections[lowerKeyword]
      };
    }

    // 模糊匹配（编辑距离）
    let minDistance = Infinity;
    let bestMatch = null;

    for (const [wrong, right] of Object.entries(corrections)) {
      const distance = this.levenshteinDistance(lowerKeyword, wrong);
      if (distance < minDistance && distance <= 2) {
        minDistance = distance;
        bestMatch = right;
      }
    }

    if (bestMatch) {
      return {
        corrected: true,
        original: keyword,
        suggestion: bestMatch
      };
    }

    return {
      corrected: false,
      original: keyword,
      suggestion: keyword
    };
  }

  /**
   * 计算编辑距离（Levenshtein Distance）
   */
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // 删除
            dp[i][j - 1] + 1,     // 插入
            dp[i - 1][j - 1] + 1  // 替换
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * 保存搜索历史
   */
  async saveSearchHistory(userId, keyword, resultType = 'all') {
    try {
      await prisma.searchHistory.create({
        data: {
          userId,
          keyword,
          resultType,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('保存搜索历史失败:', error);
    }
  }

  /**
   * 获取用户搜索历史
   */
  async getUserSearchHistory(userId, limit = 10) {
    try {
      const history = await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        distinct: ['keyword']
      });

      return history.map(h => h.keyword);
    } catch (error) {
      logger.error('获取搜索历史失败:', error);
      return [];
    }
  }

  /**
   * 清除用户搜索历史
   */
  async clearUserSearchHistory(userId) {
    try {
      await prisma.searchHistory.deleteMany({
        where: { userId }
      });
      return true;
    } catch (error) {
      logger.error('清除搜索历史失败:', error);
      return false;
    }
  }

  /**
   * 相关搜索推荐
   */
  async getRelatedSearches(keyword, limit = 5) {
    try {
      // 查找包含相同标签的话题
      const topics = await prisma.topic.findMany({
        where: {
          status: 'published',
          OR: [
            { title: { contains: keyword } },
            { tags: { hasSome: [keyword] } }
          ]
        },
        select: {
          tags: true
        },
        take: 20
      });

      // 统计相关标签
      const tagCounts = {};
      topics.forEach(topic => {
        if (topic.tags && Array.isArray(topic.tags)) {
          topic.tags.forEach(tag => {
            if (tag !== keyword) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      });

      // 返回最相关的标签
      const related = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);

      return related;
    } catch (error) {
      logger.error('获取相关搜索失败:', error);
      return [];
    }
  }

  /**
   * 搜索补全
   */
  async getAutoComplete(prefix, limit = 8) {
    try {
      if (!prefix || prefix.length < 1) {
        return [];
      }

      // 从话题标题中查找
      const topics = await prisma.topic.findMany({
        where: {
          status: 'published',
          title: {
            startsWith: prefix
          }
        },
        select: {
          title: true
        },
        take: limit,
        orderBy: {
          views: 'desc'
        }
      });

      return [...new Set(topics.map(t => t.title))];
    } catch (error) {
      logger.error('搜索补全失败:', error);
      return [];
    }
  }
}

module.exports = new SearchService();

