// src/utils/logger.js
// 日志工具

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config');

// 创建日志目录
const fs = require('fs');
const path = require('path');
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// 创建日志传输器
const transports = [];

// 控制台输出（开发环境）
if (config.env === 'development') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// 文件输出
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'ieclub-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.log.maxSize,
    maxFiles: config.log.maxFiles,
    format: logFormat,
  })
);

// 错误日志单独输出
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: config.log.maxSize,
    maxFiles: config.log.maxFiles,
    format: logFormat,
  })
);

// 创建 logger 实例
const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason, promise);
});

module.exports = logger;