// tests/integration/activityCheckIn.integration.test.js
// 活动签到功能集成测试

const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const redis = require('../../src/config/redis');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

describe('Activity Check-In Integration Tests', () => {
  let organizerToken;
  let participantToken;
  let activityId;
  let organizerId;
  let participantId;

  beforeAll(async () => {
    // 创建测试用户
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: 'hashedPassword',
        nickname: '组织者'
      }
    });
    organizerId = organizer.id;

    const participant = await prisma.user.create({
      data: {
        email: 'participant@test.com',
        password: 'hashedPassword',
        nickname: '参与者'
      }
    });
    participantId = participant.id;

    // 生成 JWT token
    organizerToken = jwt.sign(
      { id: organizerId, email: organizer.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    participantToken = jwt.sign(
      { id: participantId, email: participant.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // 创建测试活动
    const now = new Date();
    const activity = await prisma.activity.create({
      data: {
        title: '测试活动',
        description: '这是一个测试活动',
        location: '测试地点',
        startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30分钟前开始
        endTime: new Date(now.getTime() + 90 * 60 * 1000), // 90分钟后结束
        maxParticipants: 50,
        category: 'workshop',
        organizerId: organizerId,
        status: 'published'
      }
    });
    activityId = activity.id;

    // 创建参与记录
    await prisma.activityParticipant.create({
      data: {
        userId: participantId,
        activityId: activityId,
        status: 'approved'
      }
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.activityParticipant.deleteMany({
      where: { activityId }
    });
    await prisma.activity.delete({
      where: { id: activityId }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['organizer@test.com', 'participant@test.com']
        }
      }
    });

    // 清理 Redis
    const keys = await redis.keys(`activity:checkin:${activityId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await prisma.$disconnect();
  });

  describe('POST /api/activities/:id/qrcode', () => {
    it('组织者应该能生成签到二维码', async () => {
      const response = await request(app)
        .post(`/api/activities/${activityId}/qrcode`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('qrCodeDataURL');
      expect(response.body.data).toHaveProperty('expiresAt');
      expect(response.body.data.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
    });

    it('非组织者不能生成签到二维码', async () => {
      const response = await request(app)
        .post(`/api/activities/${activityId}/qrcode`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('组织者');
    });

    it('未登录用户不能生成签到二维码', async () => {
      await request(app)
        .post(`/api/activities/${activityId}/qrcode`)
        .expect(401);
    });
  });

  describe('POST /api/activities/:id/checkin', () => {
    let checkInToken;

    beforeEach(async () => {
      // 生成签到二维码
      const response = await request(app)
        .post(`/api/activities/${activityId}/qrcode`)
        .set('Authorization', `Bearer ${organizerToken}`);
      
      checkInToken = response.body.data.token;
    });

    it('参与者应该能使用有效令牌签到', async () => {
      const response = await request(app)
        .post(`/api/activities/${activityId}/checkin`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ token: checkInToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('签到成功');
      expect(response.body.data.checkedInAt).toBeDefined();
    });

    it('不能重复签到', async () => {
      // 第一次签到
      await request(app)
        .post(`/api/activities/${activityId}/checkin`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ token: checkInToken });

      // 第二次签到应该失败
      const response = await request(app)
        .post(`/api/activities/${activityId}/checkin`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ token: checkInToken })
        .expect(400);

      expect(response.body.message).toContain('已经签到');
    });

    it('未报名用户不能签到', async () => {
      // 创建一个新用户
      const newUser = await prisma.user.create({
        data: {
          email: 'newuser@test.com',
          password: 'hashedPassword',
          nickname: '新用户'
        }
      });

      const newUserToken = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post(`/api/activities/${activityId}/checkin`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ token: checkInToken })
        .expect(400);

      expect(response.body.message).toContain('未报名');

      // 清理
      await prisma.user.delete({ where: { id: newUser.id } });
    });

    it('使用无效令牌不能签到', async () => {
      const response = await request(app)
        .post(`/api/activities/${activityId}/checkin`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ token: 'invalid_token_123' })
        .expect(400);

      expect(response.body.message).toContain('令牌无效');
    });
  });

  describe('GET /api/activities/:id/checkin-stats', () => {
    it('组织者应该能查看签到统计', async () => {
      const response = await request(app)
        .get(`/api/activities/${activityId}/checkin-stats`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalParticipants');
      expect(response.body.data).toHaveProperty('checkedInCount');
      expect(response.body.data).toHaveProperty('notCheckedInCount');
      expect(response.body.data).toHaveProperty('checkInRate');
      expect(response.body.data).toHaveProperty('participants');
      expect(Array.isArray(response.body.data.participants)).toBe(true);
    });

    it('非组织者不能查看签到统计', async () => {
      const response = await request(app)
        .get(`/api/activities/${activityId}/checkin-stats`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);

      expect(response.body.message).toContain('组织者');
    });
  });

  describe('POST /api/activities/:id/verify-token', () => {
    let validToken;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/activities/${activityId}/qrcode`)
        .set('Authorization', `Bearer ${organizerToken}`);
      
      validToken = response.body.data.token;
    });

    it('应该验证有效的令牌', async () => {
      const response = await request(app)
        .post(`/api/activities/${activityId}/verify-token`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ token: validToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('应该拒绝无效的令牌', async () => {
      const response = await request(app)
        .post(`/api/activities/${activityId}/verify-token`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ token: 'invalid_token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
    });
  });
});

