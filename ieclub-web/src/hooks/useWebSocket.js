// ieclub-web/src/hooks/useWebSocket.js
// WebSocket Hook - 简化 WebSocket 在 React 中的使用

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import websocketManager from '../utils/websocket';

/**
 * WebSocket Hook
 * 自动管理 WebSocket 连接和生命周期
 */
export function useWebSocket() {
  const { isAuthenticated, token } = useAuth();
  const listenersRef = useRef([]);

  // 连接 WebSocket
  useEffect(() => {
    if (isAuthenticated && token) {
      // 连接 WebSocket
      websocketManager.connect(token);

      // 清理函数
      return () => {
        // 移除所有监听器
        listenersRef.current.forEach(({ eventType, handler }) => {
          websocketManager.off(eventType, handler);
        });
        listenersRef.current = [];
      };
    } else {
      // 断开连接
      websocketManager.disconnect();
    }
  }, [isAuthenticated, token]);

  // 注册事件监听器
  const on = useCallback((eventType, handler) => {
    websocketManager.on(eventType, handler);
    listenersRef.current.push({ eventType, handler });
  }, []);

  // 移除事件监听器
  const off = useCallback((eventType, handler) => {
    websocketManager.off(eventType, handler);
    listenersRef.current = listenersRef.current.filter(
      (listener) => !(listener.eventType === eventType && listener.handler === handler)
    );
  }, []);

  // 发送消息
  const send = useCallback((data) => {
    return websocketManager.send(data);
  }, []);

  // 加入房间
  const joinRoom = useCallback((roomId) => {
    return websocketManager.joinRoom(roomId);
  }, []);

  // 离开房间
  const leaveRoom = useCallback((roomId) => {
    return websocketManager.leaveRoom(roomId);
  }, []);

  // 检查连接状态
  const isConnected = useCallback(() => {
    return websocketManager.isConnected();
  }, []);

  return {
    on,
    off,
    send,
    joinRoom,
    leaveRoom,
    isConnected,
  };
}

/**
 * 通知监听 Hook
 * 专门用于监听实时通知
 */
export function useNotifications(onNotification) {
  const { on, off } = useWebSocket();

  useEffect(() => {
    if (!onNotification) return;

    // 监听通知事件
    const handleNotification = (message) => {
      onNotification(message.data);
    };

    on('notification', handleNotification);

    // 监听自定义通知事件（来自 websocketManager.handleNotification）
    const handleCustomNotification = (event) => {
      onNotification(event.detail);
    };

    window.addEventListener('new-notification', handleCustomNotification);

    return () => {
      off('notification', handleNotification);
      window.removeEventListener('new-notification', handleCustomNotification);
    };
  }, [onNotification, on, off]);
}

export default useWebSocket;

