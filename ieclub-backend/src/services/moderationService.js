// ieclub-backend/src/services/moderationService.js
// 内容审核服务

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// 敏感词库（可以从文件或数据库加载）
const SENSITIVE_WORDS = [
  // 政治敏感词
  '习近平', '毛泽东', '邓小平', '江泽民', '胡锦涛', '温家宝',
  '中南海', '政治局', '国务院', '人大', '政协',
  
  // 暴力色情
  '杀人', '自杀', '色情', '黄色', '赌博', '毒品', '枪支',
  
  // 欺诈诈骗
  '诈骗', '传销', '洗钱', '高利贷', '套路贷',
  
  // 辱骂词汇
  '傻逼', '操你妈', '去死', '智障', '脑残',
  
  // 可以扩展...
];

// 敏感词正则（构建高效的正则表达式）
const SENSITIVE_REGEX = new RegExp(
  SENSITIVE_WORDS.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'gi'
);

// 垃圾内容特征
const SPAM_PATTERNS = [
  /加(微信|QQ|v信)/gi,
  /联系方式[:：]\s*\d{5,}/gi,
  /\d{11}/g, // 手机号
  /http[s]?:\/\/[^\s]+/gi, // 可疑链接
  /(免费|赚钱|兼职|代理).{0,10}(联系|加我)/gi
];

class ModerationService {
  /**
   * 检查文本内容
   * @param {string} content - 待检查的内容
   * @returns {Object} 检查结果
   */
  checkText(content) {
    if (!content) {
      return { pass: true, score: 0, reasons: [] };
    }

    const reasons = [];
    let score = 0; // 违规分数，越高越可疑

    // 1. 敏感词检查
    const sensitiveMatches = content.match(SENSITIVE_REGEX);
    if (sensitiveMatches && sensitiveMatches.length > 0) {
      score += sensitiveMatches.length * 50;
      reasons.push({
        type: 'sensitive_word',
        detail: `包含敏感词: ${[...new Set(sensitiveMatches)].join(', ')}`,
        severity: 'high'
      });
    }

    // 2. 垃圾内容检查
    for (const pattern of SPAM_PATTERNS) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        score += matches.length * 20;
        reasons.push({
          type: 'spam',
          detail: `疑似垃圾内容: ${matches[0]}`,
          severity: 'medium'
        });
      }
    }

    // 3. 重复字符检查（如：哈哈哈哈哈哈哈哈哈哈...）
    const repeatPattern = /(.)\1{9,}/g;
    if (repeatPattern.test(content)) {
      score += 10;
      reasons.push({
        type: 'repeat',
        detail: '包含过多重复字符',
        severity: 'low'
      });
    }

    // 4. 全大写字母检查（可能是吼叫）
    const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (content.length > 20 && uppercaseRatio > 0.7) {
      score += 10;
      reasons.push({
        type: 'uppercase',
        detail: '全大写文字',
        severity: 'low'
      });
    }

    // 5. 特殊符号过多
    const symbolRatio = (content.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length / content.length;
    if (symbolRatio > 0.3) {
      score += 15;
      reasons.push({
        type: 'symbols',
        detail: '特殊符号过多',
        severity: 'low'
      });
    }

    // 判定结果
    const pass = score < 50; // 分数小于50通过
    const action = score >= 100 ? 'block' : (score >= 50 ? 'review' : 'pass');

    return {
      pass,
      score,
      action, // pass: 通过, review: 需人工审核, block: 直接拦截
      reasons,
      processed: true
    };
  }

  /**
   * 审核帖子
   */
  async moderatePost(postId) {
    try {
      const post = await prisma.community_posts.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: { id: true, nickname: true, email: true }
          }
        }
      });

      if (!post) {
        throw new Error('帖子不存在');
      }

      // 检查标题和内容
      const titleCheck = this.checkText(post.title);
      const contentCheck = this.checkText(post.content);

      const combinedScore = titleCheck.score + contentCheck.score;
      const allReasons = [...titleCheck.reasons, ...contentCheck.reasons];

      let status = 'published';
      let action = 'pass';

      if (combinedScore >= 100) {
        status = 'hidden';
        action = 'block';
      } else if (combinedScore >= 50) {
        status = 'pending';
        action = 'review';
      }

      // 更新帖子状态
      await prisma.community_posts.update({
        where: { id: postId },
        data: { status }
      });

      // 记录审核日志
      await this.logModeration({
        targetType: 'post',
        targetId: postId,
        userId: post.userId,
        score: combinedScore,
        action,
        reasons: allReasons
      });

      // 如果被拦截，通知作者
      if (action === 'block') {
        await this.notifyAuthor(post.userId, {
          type: 'content_blocked',
          targetType: 'post',
          targetId: postId,
          reasons: allReasons
        });
      }

      logger.info(`帖子审核完成: ${postId}`, {
        score: combinedScore,
        action,
        status
      });

      return {
        postId,
        originalStatus: post.status,
        newStatus: status,
        score: combinedScore,
        action,
        reasons: allReasons
      };
    } catch (error) {
      logger.error('审核帖子失败:', error);
      throw error;
    }
  }

  /**
   * 审核评论
   */
  async moderateComment(commentId) {
    try {
      const comment = await prisma.comments.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: { id: true, nickname: true }
          }
        }
      });

      if (!comment) {
        throw new Error('评论不存在');
      }

      // 检查内容
      const check = this.checkText(comment.content);

      let status = 'published';
      let action = 'pass';

      if (check.score >= 100) {
        status = 'hidden';
        action = 'block';
      } else if (check.score >= 50) {
        status = 'pending';
        action = 'review';
      }

      // 更新评论状态
      await prisma.comments.update({
        where: { id: commentId },
        data: { status }
      });

      // 记录审核日志
      await this.logModeration({
        targetType: 'comment',
        targetId: commentId,
        userId: comment.userId,
        score: check.score,
        action,
        reasons: check.reasons
      });

      // 如果被拦截，通知作者
      if (action === 'block') {
        await this.notifyAuthor(comment.userId, {
          type: 'content_blocked',
          targetType: 'comment',
          targetId: commentId,
          reasons: check.reasons
        });
      }

      logger.info(`评论审核完成: ${commentId}`, {
        score: check.score,
        action,
        status
      });

      return {
        commentId,
        originalStatus: comment.status,
        newStatus: status,
        score: check.score,
        action,
        reasons: check.reasons
      };
    } catch (error) {
      logger.error('审核评论失败:', error);
      throw error;
    }
  }

  /**
   * 批量审核
   */
  async batchModerate(type, ids) {
    const results = [];

    for (const id of ids) {
      try {
        let result;
        if (type === 'post') {
          result = await this.moderatePost(id);
        } else if (type === 'comment') {
          result = await this.moderateComment(id);
        }
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 获取待审核内容列表
   */
  async getPendingContents({ type = 'post', page = 1, pageSize = 20 }) {
    try {
      const skip = (page - 1) * pageSize;

      if (type === 'post') {
        const [posts, total] = await Promise.all([
          prisma.community_posts.findMany({
            where: { status: 'pending' },
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: { id: true, nickname: true, avatar: true }
              }
            }
          }),
          prisma.community_posts.count({ where: { status: 'pending' } })
        ]);

        return {
          items: posts,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        };
      } else {
        const [comments, total] = await Promise.all([
          prisma.comments.findMany({
            where: { status: 'pending' },
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { id: true, nickname: true, avatar: true }
              }
            }
          }),
          prisma.comments.count({ where: { status: 'pending' } })
        ]);

        return {
          items: comments,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        };
      }
    } catch (error) {
      logger.error('获取待审核内容失败:', error);
      throw error;
    }
  }

  /**
   * 人工审核
   */
  async manualReview(type, contentId, action, reviewNote, reviewerId) {
    try {
      const status = action === 'approve' ? 'published' : 'hidden';
      const model = type === 'post' ? prisma.community_posts : prisma.comments;

      const content = await model.update({
        where: { id: contentId },
        data: { status }
      });

      // 记录审核日志
      await this.logModeration({
        targetType: type,
        targetId: contentId,
        userId: content.userId,
        action,
        reviewerId,
        reviewNote,
        manual: true
      });

      logger.info(`人工审核完成: ${type} ${contentId}`, {
        action,
        reviewerId
      });

      return content;
    } catch (error) {
      logger.error('人工审核失败:', error);
      throw error;
    }
  }

  /**
   * 记录审核日志
   */
  async logModeration(data) {
    try {
      await prisma.moderation_logs.create({
        data: {
          targetType: data.targetType,
          targetId: data.targetId,
          userId: data.userId,
          score: data.score,
          action: data.action,
          reasons: JSON.stringify(data.reasons || []),
          reviewerId: data.reviewerId,
          reviewNote: data.reviewNote,
          isManual: data.manual || false
        }
      }).catch(() => {
        // 如果表不存在，只记录日志
        logger.warn('审核日志表不存在，跳过记录');
      });
    } catch (error) {
      logger.error('记录审核日志失败:', error);
    }
  }

  /**
   * 通知作者
   */
  async notifyAuthor(userId, data) {
    try {
      await prisma.notifications.create({
        data: {
          userId,
          type: 'system',
          title: '内容审核通知',
          content: `您的${data.targetType === 'post' ? '帖子' : '评论'}因违反社区规范已被系统拦截`,
          relatedType: data.targetType,
          relatedId: data.targetId
        }
      });
    } catch (error) {
      logger.error('发送审核通知失败:', error);
    }
  }

  /**
   * 获取用户违规历史
   */
  async getUserViolations(userId) {
    try {
      const violations = await prisma.moderation_logs.findMany({
        where: {
          userId,
          action: { in: ['block', 'review'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }).catch(() => []);

      const stats = {
        total: violations.length,
        blocked: violations.filter(v => v.action === 'block').length,
        reviewed: violations.filter(v => v.action === 'review').length
      };

      return { violations, stats };
    } catch (error) {
      logger.error('获取用户违规历史失败:', error);
      return { violations: [], stats: { total: 0, blocked: 0, reviewed: 0 } };
    }
  }
}

module.exports = new ModerationService();

