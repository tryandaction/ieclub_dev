/**
 * 图片懒加载组件
 * 优化图片加载性能
 */
import React, { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import './LazyImage.scss';

export const LazyImage = ({ 
  src, 
  alt = '', 
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  className = '',
  onLoad,
  onError,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // 小程序环境直接加载
    const taroEnv = (typeof process !== 'undefined' && process.env && process.env.TARO_ENV) || 'h5';
    if (taroEnv !== 'h5') {
      loadImage();
      return;
    }

    // H5 环境使用 IntersectionObserver
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current);
              }
            }
          });
        },
        {
          rootMargin: '50px', // 提前 50px 开始加载
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    } else {
      // 不支持 IntersectionObserver，直接加载
      loadImage();
    }
  }, [src]);

  const loadImage = () => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };
  };

  return (
    <div className={`lazy-image-wrapper ${className}`} ref={imgRef}>
      <img
        src={imageSrc}
        alt={alt}
        className={`lazy-image ${isLoading ? 'loading' : ''} ${hasError ? 'error' : ''}`}
        {...props}
      />
      {isLoading && (
        <div className="lazy-image-skeleton">
          <div className="skeleton-shimmer" />
        </div>
      )}
      {hasError && (
        <div className="lazy-image-error">
          <span>图片加载失败</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;


