// tests/unit/activityCheckIn.test.js
// 活动签到功能单元测试

const activityService = require('../../src/services/activityService');
const { PrismaClient } = require('@prisma/client');
const redis = require('../../src/config/redis');
const AppError = require('../../src/utils/AppError');

// Mock Prisma 和 Redis
jest.mock('@prisma/client');
jest.mock('../../src/config/redis');

describe('Activity Check-In Service', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('generateCheckInQRCode', () => {
    it('应该成功生成签到二维码', async () => {
      const activityId = 'activity_123';
      const userId = 'user_456';

      prisma.activity.findUnique.mockResolvedValue({
        id: activityId,
        organizerId: userId,
        title: 'Python工作坊'
      });

      redis.setex.mockResolvedValue('OK');

      const result = await activityService.generateCheckInQRCode(activityId, userId);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('qrCodeDataURL');
      expect(result).toHaveProperty('expiresAt');
      expect(result.activityTitle).toBe('Python工作坊');
      expect(result.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('应该拒绝非组织者生成二维码', async () => {
      const activityId = 'activity_123';
      const userId = 'user_789'; // 不是组织者

      prisma.activity.findUnique.mockResolvedValue({
        id: activityId,
        organizerId: 'user_456', // 不同的用户
        title: 'Python工作坊'
      });

      await expect(
        activityService.generateCheckInQRCode(activityId, userId)
      ).rejects.toThrow(AppError);
      await expect(
        activityService.generateCheckInQRCode(activityId, userId)
      ).rejects.toThrow('只有活动组织者可以生成签到二维码');
    });

    it('应该拒绝不存在的活动', async () => {
      const activityId = 'nonexistent';
      const userId = 'user_456';

      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        activityService.generateCheckInQRCode(activityId, userId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('verifyCheckInToken', () => {
    it('应该验证有效的签到令牌', async () => {
      const activityId = 'activity_123';
      const token = 'valid_token_123';

      redis.get.mockResolvedValue(JSON.stringify({
        activityId,
        createdBy: 'user_456',
        createdAt: new Date().toISOString()
      }));

      const result = await activityService.verifyCheckInToken(activityId, token);

      expect(result.valid).toBe(true);
      expect(result.activityId).toBe(activityId);
      expect(redis.get).toHaveBeenCalledWith(`activity:checkin:${activityId}:${token}`);
    });

    it('应该拒绝过期的令牌', async () => {
      const activityId = 'activity_123';
      const token = 'expired_token';

      redis.get.mockResolvedValue(null);

      const result = await activityService.verifyCheckInToken(activityId, token);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('令牌无效或已过期');
    });

    it('应该拒绝活动ID不匹配的令牌', async () => {
      const activityId = 'activity_123';
      const token = 'token_456';

      redis.get.mockResolvedValue(JSON.stringify({
        activityId: 'activity_999', // 不同的活动ID
        createdBy: 'user_456',
        createdAt: new Date().toISOString()
      }));

      const result = await activityService.verifyCheckInToken(activityId, token);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('令牌与活动不匹配');
    });
  });

  describe('checkIn', () => {
    it('应该成功签到', async () => {
      const activityId = 'activity_123';
      const userId = 'user_789';
      const token = 'valid_token';

      // Mock 令牌验证
      redis.get.mockResolvedValue(JSON.stringify({
        activityId,
        createdBy: 'user_456',
        createdAt: new Date().toISOString()
      }));

      // Mock 参与记录
      prisma.activityParticipant.findUnique.mockResolvedValue({
        id: 'participation_123',
        userId,
        activityId,
        status: 'approved',
        checkedIn: false,
        checkedInAt: null
      });

      // Mock 活动时间
      const now = new Date();
      const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1小时前
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1小时后

      prisma.activity.findUnique.mockResolvedValue({
        id: activityId,
        startTime,
        endTime
      });

      // Mock 更新操作
      prisma.activityParticipant.update.mockResolvedValue({
        id: 'participation_123',
        checkedIn: true,
        checkedInAt: now
      });

      const result = await activityService.checkIn(activityId, userId, token);

      expect(result.message).toBe('签到成功');
      expect(result.checkedInAt).toBeDefined();
      expect(prisma.activityParticipant.update).toHaveBeenCalled();
    });

    it('应该拒绝未报名用户签到', async () => {
      const activityId = 'activity_123';
      const userId = 'user_789';
      const token = 'valid_token';

      redis.get.mockResolvedValue(JSON.stringify({
        activityId,
        createdBy: 'user_456',
        createdAt: new Date().toISOString()
      }));

      prisma.activityParticipant.findUnique.mockResolvedValue(null);

      await expect(
        activityService.checkIn(activityId, userId, token)
      ).rejects.toThrow('未报名该活动');
    });

    it('应该拒绝重复签到', async () => {
      const activityId = 'activity_123';
      const userId = 'user_789';
      const token = 'valid_token';

      redis.get.mockResolvedValue(JSON.stringify({
        activityId,
        createdBy: 'user_456',
        createdAt: new Date().toISOString()
      }));

      prisma.activityParticipant.findUnique.mockResolvedValue({
        id: 'participation_123',
        userId,
        activityId,
        status: 'approved',
        checkedIn: true, // 已经签到
        checkedInAt: new Date()
      });

      await expect(
        activityService.checkIn(activityId, userId, token)
      ).rejects.toThrow('已经签到过了');
    });

    it('应该拒绝活动开始前签到', async () => {
      const activityId = 'activity_123';
      const userId = 'user_789';
      const token = 'valid_token';

      redis.get.mockResolvedValue(JSON.stringify({
        activityId,
        createdBy: 'user_456',
        createdAt: new Date().toISOString()
      }));

      prisma.activityParticipant.findUnique.mockResolvedValue({
        id: 'participation_123',
        userId,
        activityId,
        status: 'approved',
        checkedIn: false
      });

      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1小时后
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2小时后

      prisma.activity.findUnique.mockResolvedValue({
        id: activityId,
        startTime,
        endTime
      });

      await expect(
        activityService.checkIn(activityId, userId, token)
      ).rejects.toThrow('活动尚未开始');
    });

    it('应该拒绝活动结束后签到', async () => {
      const activityId = 'activity_123';
      const userId = 'user_789';
      const token = 'valid_token';

      redis.get.mockResolvedValue(JSON.stringify({
        activityId,
        createdBy: 'user_456',
        createdAt: new Date().toISOString()
      }));

      prisma.activityParticipant.findUnique.mockResolvedValue({
        id: 'participation_123',
        userId,
        activityId,
        status: 'approved',
        checkedIn: false
      });

      const now = new Date();
      const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2小时前
      const endTime = new Date(now.getTime() - 60 * 60 * 1000); // 1小时前

      prisma.activity.findUnique.mockResolvedValue({
        id: activityId,
        startTime,
        endTime
      });

      await expect(
        activityService.checkIn(activityId, userId, token)
      ).rejects.toThrow('活动已结束');
    });
  });

  describe('getCheckInStats', () => {
    it('应该返回签到统计', async () => {
      const activityId = 'activity_123';
      const userId = 'user_456';

      prisma.activity.findUnique.mockResolvedValue({
        organizerId: userId,
        title: 'Python工作坊',
        startTime: new Date(),
        endTime: new Date()
      });

      prisma.activityParticipant.count
        .mockResolvedValueOnce(30) // 总参与人数
        .mockResolvedValueOnce(25); // 已签到人数

      prisma.activityParticipant.findMany.mockResolvedValue([
        {
          user: {
            id: 'user_1',
            nickname: '张三',
            avatar: 'avatar1.jpg',
            email: 'zhangsan@example.com'
          },
          createdAt: new Date(),
          checkedIn: true,
          checkedInAt: new Date(),
          status: 'approved'
        },
        {
          user: {
            id: 'user_2',
            nickname: '李四',
            avatar: 'avatar2.jpg',
            email: 'lisi@example.com'
          },
          createdAt: new Date(),
          checkedIn: false,
          checkedInAt: null,
          status: 'approved'
        }
      ]);

      const result = await activityService.getCheckInStats(activityId, userId);

      expect(result.totalParticipants).toBe(30);
      expect(result.checkedInCount).toBe(25);
      expect(result.notCheckedInCount).toBe(5);
      expect(result.checkInRate).toBe(83.3);
      expect(result.participants).toHaveLength(2);
    });

    it('应该拒绝非组织者查看统计', async () => {
      const activityId = 'activity_123';
      const userId = 'user_789'; // 不是组织者

      prisma.activity.findUnique.mockResolvedValue({
        organizerId: 'user_456', // 不同的用户
        title: 'Python工作坊',
        startTime: new Date(),
        endTime: new Date()
      });

      await expect(
        activityService.getCheckInStats(activityId, userId)
      ).rejects.toThrow('只有活动组织者可以查看签到统计');
    });
  });
});

