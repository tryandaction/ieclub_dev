// src/routes/health.js
// 健康检查和系统状态路由

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const redis = require('../utils/redis');
const os = require('os');

const prisma = new PrismaClient();

/**
 * 基础健康检查
 * GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    res.json({
      status: 'ok',
      timestamp,
      uptime: Math.floor(uptime),
      service: 'IEClub Backend',
      version: process.env.npm_package_version || '2.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * 详细健康检查
 * GET /api/health/detailed
 */
router.get('/detailed', async (req, res) => {
  const checks = {
    api: { status: 'ok', message: 'API is running' },
    database: { status: 'unknown', message: '' },
    redis: { status: 'unknown', message: '' },
    memory: { status: 'unknown', message: '' },
    disk: { status: 'unknown', message: '' }
  };

  // 检查数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', message: 'Database connected' };
  } catch (error) {
    checks.database = { 
      status: 'error', 
      message: `Database error: ${error.message}` 
    };
  }

  // 检查 Redis 连接
  try {
    await redis.ping();
    checks.redis = { status: 'ok', message: 'Redis connected' };
  } catch (error) {
    checks.redis = { 
      status: 'error', 
      message: `Redis error: ${error.message}` 
    };
  }

  // 检查内存使用
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = (usedMem / totalMem * 100).toFixed(2);

  checks.memory = {
    status: memPercent > 90 ? 'warning' : 'ok',
    message: `Memory usage: ${memPercent}%`,
    details: {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      systemUsed: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      systemTotal: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`
    }
  };

  // 系统信息
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    cpus: os.cpus().length,
    uptime: Math.floor(process.uptime()),
    loadAverage: os.loadavg()
  };

  // 判断整体状态
  const hasError = Object.values(checks).some(check => check.status === 'error');
  const hasWarning = Object.values(checks).some(check => check.status === 'warning');
  
  const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    system: systemInfo
  });
});

/**
 * 就绪检查（Kubernetes readiness probe）
 * GET /api/health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    // 检查数据库
    await prisma.$queryRaw`SELECT 1`;
    
    // 检查 Redis
    await redis.ping();

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 存活检查（Kubernetes liveness probe）
 * GET /api/health/alive
 */
router.get('/alive', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

/**
 * 数据库状态检查
 * GET /api/health/database
 */
router.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // 获取数据库统计信息
    const userCount = await prisma.user.count();
    const topicCount = await prisma.topic.count();
    const commentCount = await prisma.comment.count();

    res.json({
      status: 'ok',
      responseTime: `${responseTime}ms`,
      stats: {
        users: userCount,
        topics: topicCount,
        comments: commentCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Redis 状态检查
 * GET /api/health/redis
 */
router.get('/redis', async (req, res) => {
  try {
    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;

    // 获取 Redis 信息
    const info = await redis.info('server');
    const dbSize = await redis.dbsize();

    res.json({
      status: 'ok',
      responseTime: `${responseTime}ms`,
      dbSize,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

