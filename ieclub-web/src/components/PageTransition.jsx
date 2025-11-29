import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 页面过渡动画组件
 * 为路由切换提供流畅的动画效果
 */
export default function PageTransition({ 
  children, 
  type = 'fade', // fade | slide | scale | slideUp
  duration = 300,
  className = '',
}) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('enter')
  const prevLocation = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname !== prevLocation.current) {
      setTransitionStage('exit')
      
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setTransitionStage('enter')
        prevLocation.current = location.pathname
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setDisplayChildren(children)
    }
  }, [children, location, duration])

  const getTransitionClasses = () => {
    switch (type) {
      case 'fade':
        return {
          enter: 'opacity-100',
          exit: 'opacity-0',
          base: 'transition-opacity',
        }
      case 'slide':
        return {
          enter: 'translate-x-0 opacity-100',
          exit: 'translate-x-8 opacity-0',
          base: 'transition-all transform',
        }
      case 'slideUp':
        return {
          enter: 'translate-y-0 opacity-100',
          exit: 'translate-y-4 opacity-0',
          base: 'transition-all transform',
        }
      case 'scale':
        return {
          enter: 'scale-100 opacity-100',
          exit: 'scale-95 opacity-0',
          base: 'transition-all transform',
        }
      default:
        return {
          enter: 'opacity-100',
          exit: 'opacity-0',
          base: 'transition-opacity',
        }
    }
  }

  const classes = getTransitionClasses()

  return (
    <div
      className={`${classes.base} ${classes[transitionStage]} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {displayChildren}
    </div>
  )
}

/**
 * 列表项动画组件
 * 为列表项提供渐进式入场动画
 */
export function AnimatedList({ 
  children, 
  stagger = 50, // 每项延迟时间
  initialDelay = 0,
  animation = 'fadeUp', // fadeUp | fadeIn | slideIn | scaleIn
  className = '',
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getAnimationClass = (index) => {
    const delay = initialDelay + index * stagger
    const baseClasses = 'transition-all duration-500'
    
    const animations = {
      fadeUp: {
        initial: 'opacity-0 translate-y-4',
        animate: 'opacity-100 translate-y-0',
      },
      fadeIn: {
        initial: 'opacity-0',
        animate: 'opacity-100',
      },
      slideIn: {
        initial: 'opacity-0 -translate-x-4',
        animate: 'opacity-100 translate-x-0',
      },
      scaleIn: {
        initial: 'opacity-0 scale-95',
        animate: 'opacity-100 scale-100',
      },
    }

    const anim = animations[animation] || animations.fadeUp

    return {
      className: `${baseClasses} ${mounted ? anim.animate : anim.initial}`,
      style: { transitionDelay: `${delay}ms` },
    }
  }

  return (
    <div className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <div key={child?.key || index} {...getAnimationClass(index)}>
              {child}
            </div>
          ))
        : children
      }
    </div>
  )
}

/**
 * 淡入淡出动画组件
 * 用于模态框、弹窗等场景
 */
export function FadeTransition({
  show,
  children,
  duration = 200,
  unmountOnExit = true,
  className = '',
}) {
  const [shouldRender, setShouldRender] = useState(show)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      // 下一帧开始动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
    } else {
      setIsVisible(false)
      if (unmountOnExit) {
        const timer = setTimeout(() => {
          setShouldRender(false)
        }, duration)
        return () => clearTimeout(timer)
      }
    }
  }, [show, duration, unmountOnExit])

  if (!shouldRender) return null

  return (
    <div
      className={`transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * 滑动过渡组件
 * 用于侧边栏、抽屉等场景
 */
export function SlideTransition({
  show,
  children,
  direction = 'right', // left | right | top | bottom
  duration = 300,
  className = '',
}) {
  const [shouldRender, setShouldRender] = useState(show)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!shouldRender) return null

  const getTranslateClass = () => {
    const translations = {
      left: isVisible ? 'translate-x-0' : '-translate-x-full',
      right: isVisible ? 'translate-x-0' : 'translate-x-full',
      top: isVisible ? 'translate-y-0' : '-translate-y-full',
      bottom: isVisible ? 'translate-y-0' : 'translate-y-full',
    }
    return translations[direction] || translations.right
  }

  return (
    <div
      className={`transition-transform ${getTranslateClass()} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * 折叠动画组件
 * 用于展开/收起内容
 */
export function CollapseTransition({
  show,
  children,
  duration = 300,
  className = '',
}) {
  const contentRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (show && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [show, children])

  return (
    <div
      className={`overflow-hidden transition-all ${className}`}
      style={{
        height: show ? height : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  )
}

/**
 * 加载动画组件
 */
export function LoadingSpinner({ 
  size = 'md', 
  color = 'purple',
  className = '',
}) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  }

  const colors = {
    purple: 'border-purple-200 border-t-purple-600',
    blue: 'border-blue-200 border-t-blue-600',
    green: 'border-green-200 border-t-green-600',
    gray: 'border-gray-200 border-t-gray-600',
    white: 'border-white/30 border-t-white',
  }

  return (
    <div
      className={`rounded-full animate-spin ${sizes[size]} ${colors[color]} ${className}`}
    />
  )
}

/**
 * 脉冲动画组件
 */
export function PulseAnimation({ children, className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  )
}

/**
 * 弹跳动画组件
 */
export function BounceAnimation({ children, className = '' }) {
  return (
    <div className={`animate-bounce ${className}`}>
      {children}
    </div>
  )
}
