/**
 * 淡入淡出过渡组件
 * 用于页面切换和内容加载时的动画效果
 */
import React, { useState, useEffect } from 'react';

export const FadeTransition = ({ 
  children, 
  show = true, 
  duration = 300,
  delay = 0,
  className = ''
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
  }, [show, duration, delay]);

  if (!shouldRender) return null;

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration}ms ease-in-out`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * 从下方滑入的过渡效果
 */
export const SlideUpTransition = ({ 
  children, 
  show = true, 
  duration = 400,
  delay = 0,
  className = ''
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
  }, [show, duration, delay]);

  if (!shouldRender) return null;

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * 缩放过渡效果
 */
export const ScaleTransition = ({ 
  children, 
  show = true, 
  duration = 300,
  delay = 0,
  className = ''
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
  }, [show, duration, delay]);

  if (!shouldRender) return null;

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * 列表项stagger动画
 */
export const StaggerList = ({ children, delay = 50 }) => {
  const items = React.Children.toArray(children);

  return (
    <>
      {items.map((child, index) => (
        <SlideUpTransition key={index} delay={index * delay}>
          {child}
        </SlideUpTransition>
      ))}
    </>
  );
};

export default FadeTransition;

