// ieclub-web/src/utils/websocket.js
// WebSocket 客户端管理器 - 用于实时通知推送

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map(); // 事件监听器
    this.isManualClose = false; // 是否手动关闭
  }

  /**
   * 连接 WebSocket
   * @param {string} token - JWT Token
   */
  connect(token) {
    if (!token) {
      console.warn('[WebSocket] 无法连接：Token 为空');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('[WebSocket] 已有连接存在');
      return;
    }

    try {
      // 构建 WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '')
        : window.location.host;
      
      const wsUrl = `${protocol}//${host}/ws?token=${token}`;
      
      console.log('[WebSocket] 正在连接:', wsUrl);
      this.isManualClose = false;
      this.ws = new WebSocket(wsUrl);

      // 连接成功
      this.ws.onopen = () => {
        console.log('[WebSocket] 连接成功');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
      };

      // 接收消息
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] 收到消息:', message);
          
          // 触发对应类型的监听器
          this.emit(message.type, message);
          
          // 特殊处理通知消息
          if (message.type === 'notification') {
            this.handleNotification(message.data);
          }
        } catch (error) {
          console.error('[WebSocket] 解析消息失败:', error);
        }
      };

      // 连接关闭
      this.ws.onclose = (event) => {
        console.log('[WebSocket] 连接关闭', event.code, event.reason);
        this.stopHeartbeat();
        this.emit('disconnected');

        // 如果不是手动关闭，尝试重连
        if (!this.isManualClose) {
          this.reconnect(token);
        }
      };

      // 连接错误
      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('[WebSocket] 创建连接失败:', error);
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.stopReconnect();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    console.log('[WebSocket] 已断开连接');
  }

  /**
   * 重新连接
   * @param {string} token - JWT Token
   */
  reconnect(token) {
    if (this.isManualClose) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 重连次数超过限制，停止重连');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] ${this.reconnectDelay / 1000}秒后尝试第 ${this.reconnectAttempts} 次重连...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(token);
    }, this.reconnectDelay);

    // 递增延迟时间，最大30秒
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
  }

  /**
   * 停止重连
   */
  stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectDelay = 3000;
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 30秒心跳
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 发送消息
   * @param {Object} data - 要发送的数据
   */
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] 无法发送消息：未连接');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[WebSocket] 发送消息失败:', error);
      return false;
    }
  }

  /**
   * 加入房间
   * @param {string} roomId - 房间ID
   */
  joinRoom(roomId) {
    return this.send({
      type: 'join_room',
      roomId,
    });
  }

  /**
   * 离开房间
   * @param {string} roomId - 房间ID
   */
  leaveRoom(roomId) {
    return this.send({
      type: 'leave_room',
      roomId,
    });
  }

  /**
   * 注册事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 处理函数
   */
  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(handler);
  }

  /**
   * 移除事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 处理函数
   */
  off(eventType, handler) {
    if (!this.listeners.has(eventType)) return;

    const handlers = this.listeners.get(eventType);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * 触发事件
   * @param {string} eventType - 事件类型
   * @param {any} data - 事件数据
   */
  emit(eventType, data) {
    if (!this.listeners.has(eventType)) return;

    const handlers = this.listeners.get(eventType);
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WebSocket] 事件处理器错误 (${eventType}):`, error);
      }
    });
  }

  /**
   * 处理通知消息
   * @param {Object} notification - 通知数据
   */
  handleNotification(notification) {
    // 可以在这里添加浏览器通知、音效等
    console.log('[WebSocket] 收到通知:', notification);

    // 浏览器通知（需要用户授权）
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.content,
        icon: '/logo.png',
        tag: notification.id,
      });
    }

    // 触发自定义通知事件
    window.dispatchEvent(new CustomEvent('new-notification', {
      detail: notification,
    }));
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态
   */
  getReadyState() {
    if (!this.ws) return WebSocket.CLOSED;
    return this.ws.readyState;
  }
}

// 创建单例
const websocketManager = new WebSocketManager();

export default websocketManager;

