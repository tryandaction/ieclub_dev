// src/services/websocket.ts
// WebSocket 实时通信服务

// @ts-ignore
import Taro from '@tarojs/taro'

// 🔥 获取WebSocket基础URL（必须使用完整绝对路径）
function getWebSocketBaseUrl(): string {
  const env = Taro.getEnv()
  
  // 检测是否为localhost
  const isLocalhost = typeof window !== 'undefined' && 
                     window.location && 
                     window.location.hostname === 'localhost'
  
  switch (env) {
    case Taro.ENV_TYPE.WEAPP:
      // 小程序环境：使用完整wss地址
      return 'wss://ieclub.online'
    case Taro.ENV_TYPE.WEB:
      // 🔥 H5环境：生产用wss，开发用ws
      if (typeof window !== 'undefined' && window.location) {
        if (isLocalhost) {
          console.log('🔧 WebSocket: 开发环境 ws://localhost:3000');
          return 'ws://localhost:3000';
        } else {
          console.log('🔧 WebSocket: 生产环境 wss://ieclub.online');
          return 'wss://ieclub.online';
        }
      }
      return 'ws://localhost:3000'
    case Taro.ENV_TYPE.RN:
      return 'wss://ieclub.online'
    default:
      return isLocalhost ? 'ws://localhost:3000' : 'wss://ieclub.online'
  }
}

export interface WebSocketMessage {
  type: string
  data?: any
  timestamp?: string
  roomId?: string
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private messageHandlers: Map<string, Function[]> = new Map()

  // 连接WebSocket
  connect(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = `${getWebSocketBaseUrl()}/ws?token=${token}`
    
    try {
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('WebSocket连接已建立')
        this.reconnectAttempts = 0
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket连接已关闭', event.code, event.reason)
        this.stopHeartbeat()
        
        // 自动重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          setTimeout(() => {
            this.connect(token)
          }, this.reconnectInterval)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error)
      }

    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.stopHeartbeat()
  }

  // 发送消息
  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
      return true
    }
    return false
  }

  // 加入房间
  joinRoom(roomId: string) {
    this.send({
      type: 'join_room',
      roomId
    })
  }

  // 离开房间
  leaveRoom(roomId: string) {
    this.send({
      type: 'leave_room',
      roomId
    })
  }

  // 发送心跳
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // 30秒发送一次心跳
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 处理接收到的消息
  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type) || []
    handlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        console.error('处理WebSocket消息失败:', error)
      }
    })
  }

  // 注册消息处理器
  on(messageType: string, handler: Function) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType)!.push(handler)
  }

  // 移除消息处理器
  off(messageType: string, handler: Function) {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// 创建单例实例
const websocketService = new WebSocketService()

export default websocketService
