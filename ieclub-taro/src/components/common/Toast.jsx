/**
 * Toast 通知组件
 * 用于显示全局消息提示
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast 类型
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    color: 'bg-green-500',
    textColor: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  error: {
    icon: XCircle,
    color: 'bg-red-500',
    textColor: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  warning: {
    icon: AlertCircle,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  info: {
    icon: Info,
    color: 'bg-blue-500',
    textColor: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
};

// Toast Context
const ToastContext = createContext();

/**
 * Toast Item 组件
 */
const ToastItem = ({ toast, onClose }) => {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const IconComponent = config.icon;

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${config.bgColor} ${config.borderColor}
        animate-slide-in-right
        max-w-md w-full
        backdrop-blur-sm bg-opacity-95
      `}
    >
      {/* 图标 */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${config.color} flex items-center justify-center`}>
        <IconComponent size={16} className="text-white" />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={`font-semibold mb-1 ${config.textColor}`}>
            {toast.title}
          </h4>
        )}
        <p className="text-sm text-gray-700">
          {toast.message}
        </p>
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={() => onClose(toast.id)}
        className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${config.textColor}`}
      >
        <X size={16} />
      </button>
    </div>
  );
};

/**
 * Toast Provider 组件
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type: options.type || 'info',
      title: options.title,
      duration: options.duration ?? 3000 // 默认3秒，设置为0则不自动关闭
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const closeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 便捷方法
  const success = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'error' });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  const value = {
    showToast,
    closeToast,
    closeAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast 容器 */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto space-y-2">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={closeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;

