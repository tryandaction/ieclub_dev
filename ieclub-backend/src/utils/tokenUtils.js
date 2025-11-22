// src/utils/tokenUtils.js
// JWT Token 工具函数

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('./logger');

/**
 * 生成 Access Token（短期，2小时）
 * @param {string} userId - 用户ID  
 * @param {number} tokenVersion - Token版本号
 * @returns {string} JWT Access Token
 */
function generateAccessToken(userId, tokenVersion = 0) {
  try {
    const payload = {
      userId,
      tokenVersion,
      type: 'access'
    };
    
    const token = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    return token;
  } catch (error) {
    logger.error('生成 Access Token 失败:', error);
    throw new Error('生成 Access Token 失败');
  }
}

/**
 * 生成 Refresh Token（长期，30天）
 * @param {string} userId - 用户ID
 * @param {number} tokenVersion - Token版本号
 * @returns {string} JWT Refresh Token
 */
function generateRefreshToken(userId, tokenVersion = 0) {
  try {
    const payload = {
      userId,
      tokenVersion,
      type: 'refresh'
    };
    
    const token = jwt.sign(
      payload,
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    return token;
  } catch (error) {
    logger.error('生成 Refresh Token 失败:', error);
    throw new Error('生成 Refresh Token 失败');
  }
}

/**
 * 同时生成 Access Token 和 Refresh Token
 * @param {object} user - 用户对象（必须包含 id 和 tokenVersion）
 * @returns {{accessToken: string, refreshToken: string}}
 */
function generateTokenPair(user) {
  if (!user || !user.id) {
    throw new Error('用户信息无效');
  }
  
  const tokenVersion = user.tokenVersion || 0;
  
  const accessToken = generateAccessToken(user.id, tokenVersion);
  const refreshToken = generateRefreshToken(user.id, tokenVersion);
  
  return {
    accessToken,
    refreshToken
  };
}

/**
 * 验证 Access Token
 * @param {string} token - JWT Token
 * @returns {{userId: string, tokenVersion: number}} 解码后的payload
 * @throws {Error} Token无效或过期
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 检查 token 类型
    if (decoded.type !== 'access') {
      throw new Error('Token 类型错误');
    }
    
    return {
      userId: decoded.userId,
      tokenVersion: decoded.tokenVersion || 0
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Access Token 已过期');
      err.name = 'TokenExpiredError';
      err.code = 'AUTH_TOKEN_EXPIRED';
      throw err;
    }
    
    if (error.name === 'JsonWebTokenError') {
      const err = new Error('Access Token 无效');
      err.name = 'JsonWebTokenError';
      err.code = 'AUTH_TOKEN_INVALID';
      throw err;
    }
    
    throw error;
  }
}

/**
 * 验证 Refresh Token
 * @param {string} token - JWT Refresh Token
 * @returns {{userId: string, tokenVersion: number}} 解码后的payload
 * @throws {Error} Token无效或过期
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    
    // 检查 token 类型
    if (decoded.type !== 'refresh') {
      throw new Error('Token 类型错误');
    }
    
    return {
      userId: decoded.userId,
      tokenVersion: decoded.tokenVersion || 0
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Refresh Token 已过期');
      err.name = 'TokenExpiredError';
      err.code = 'REFRESH_TOKEN_EXPIRED';
      throw err;
    }
    
    if (error.name === 'JsonWebTokenError') {
      const err = new Error('Refresh Token 无效');
      err.name = 'JsonWebTokenError';
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }
    
    throw error;
  }
}

/**
 * 解码 Token（不验证签名，用于查看内容）
 * @param {string} token - JWT Token
 * @returns {object} 解码后的payload
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('解码 Token 失败:', error);
    return null;
  }
}

/**
 * 检查 Token 是否即将过期（1小时内）
 * @param {string} token - JWT Token
 * @returns {boolean} 是否即将过期
 */
function isTokenExpiringSoon(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }
    
    const expiryTime = decoded.exp * 1000; // 转换为毫秒
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return (expiryTime - now) < oneHour;
  } catch (error) {
    return false;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpiringSoon
};
