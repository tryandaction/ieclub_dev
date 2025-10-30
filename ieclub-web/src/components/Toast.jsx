import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // 等待动画结束
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }

  return createPortal(
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div
        className={`${bgColors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 min-w-[300px]`}
      >
        <span className="text-2xl">{icons[type]}</span>
        <span className="font-medium">{message}</span>
      </div>
    </div>,
    document.body
  )
}

// Toast管理器
let toastId = 0
const toastCallbacks = new Map()

export const showToast = (message, type = 'info', duration = 3000) => {
  const id = ++toastId
  const event = new CustomEvent('show-toast', {
    detail: { id, message, type, duration }
  })
  window.dispatchEvent(event)
  
  return new Promise((resolve) => {
    toastCallbacks.set(id, resolve)
  })
}

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleShowToast = (e) => {
      setToasts((prev) => [...prev, e.detail])
    }

    window.addEventListener('show-toast', handleShowToast)
    return () => window.removeEventListener('show-toast', handleShowToast)
  }, [])

  const handleClose = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const callback = toastCallbacks.get(id)
    if (callback) {
      callback()
      toastCallbacks.delete(id)
    }
  }

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => handleClose(toast.id)}
        />
      ))}
    </>
  )
}

export default Toast

