// src/services/websocketService.js
// WebSocket 实时通知服务

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
    this.rooms = new Map(); // roomId -> Set of userIds
  }

  // 启动WebSocket服务
  start(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    logger.info('WebSocket服务已启动', { port: server.address().port });
  }

  // 验证客户端连接
  verifyClient(info) {
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return false;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      info.req.userId = decoded.userId;
      return true;
    } catch (error) {
      logger.warn('WebSocket认证失败:', error.message);
      return false;
    }
  }

  // 处理新连接
  handleConnection(ws, req) {
    const userId = req.userId;
    
    // 保存客户端连接
    this.clients.set(userId, ws);
    
    logger.info('用户连接WebSocket', { userId, totalClients: this.clients.size });

    // 发送连接成功消息
    this.sendToUser(userId, {
      type: 'connection',
      message: '连接成功',
      timestamp: new Date().toISOString()
    });

    // 处理消息
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(userId, message);
      } catch (error) {
        logger.error('解析WebSocket消息失败:', error);
      }
    });

    // 处理断开连接
    ws.on('close', () => {
      this.clients.delete(userId);
      this.removeUserFromAllRooms(userId);
      logger.info('用户断开WebSocket连接', { userId, totalClients: this.clients.size });
    });

    // 处理错误
    ws.on('error', (error) => {
      logger.error('WebSocket连接错误:', error);
      this.clients.delete(userId);
    });
  }

  // 处理客户端消息
  handleMessage(userId, message) {
    switch (message.type) {
      case 'join_room':
        this.joinRoom(userId, message.roomId);
        break;
      case 'leave_room':
        this.leaveRoom(userId, message.roomId);
        break;
      case 'ping':
        this.sendToUser(userId, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      default:
        logger.warn('未知的WebSocket消息类型:', message.type);
    }
  }

  // 加入房间
  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(userId);
    logger.info('用户加入房间', { userId, roomId });
  }

  // 离开房间
  leaveRoom(userId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    logger.info('用户离开房间', { userId, roomId });
  }

  // 从所有房间移除用户
  removeUserFromAllRooms(userId) {
    for (const [roomId, users] of this.rooms.entries()) {
      users.delete(userId);
      if (users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  // 发送消息给指定用户
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        logger.error('发送消息失败:', error);
        this.clients.delete(userId);
        return false;
      }
    }
    return false;
  }

  // 发送消息给房间内所有用户
  sendToRoom(roomId, message) {
    const users = this.rooms.get(roomId);
    if (!users) return;

    let successCount = 0;
    for (const userId of users) {
      if (this.sendToUser(userId, message)) {
        successCount++;
      }
    }
    
    logger.info('发送房间消息', { roomId, totalUsers: users.size, successCount });
  }

  // 广播消息给所有在线用户
  broadcast(message) {
    let successCount = 0;
    for (const [userId, ws] of this.clients.entries()) {
      if (this.sendToUser(userId, message)) {
        successCount++;
      }
    }
    
    logger.info('广播消息', { totalUsers: this.clients.size, successCount });
  }

  // 发送通知
  sendNotification(userId, notification) {
    return this.sendToUser(userId, {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  // 发送话题相关通知
  sendTopicNotification(topicId, type, data) {
    const message = {
      type: 'topic_notification',
      topicId,
      notificationType: type,
      data,
      timestamp: new Date().toISOString()
    };

    // 发送给话题作者
    if (data.authorId) {
      this.sendToUser(data.authorId, message);
    }

    // 发送给关注该话题的用户
    this.sendToRoom(`topic_${topicId}`, message);
  }

  // 获取在线用户数
  getOnlineUserCount() {
    return this.clients.size;
  }

  // 获取房间用户数
  getRoomUserCount(roomId) {
    const users = this.rooms.get(roomId);
    return users ? users.size : 0;
  }

  // 检查用户是否在线
  isUserOnline(userId) {
    return this.clients.has(userId);
  }
}

// 创建单例实例
const websocketService = new WebSocketService();

module.exports = websocketService;
