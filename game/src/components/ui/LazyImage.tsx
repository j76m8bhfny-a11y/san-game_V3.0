/**
 * 懒加载图片组件
 * 
 * 功能：
 * - 自动懒加载（进入视口时加载）
 * - 加载状态显示
 * - 错误处理和重试
 * - 占位符显示
 */

import React, { useState, useEffect, CSSProperties } from 'react';
import { useLazyImage } from '@/utils/imageLoader';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  retryCount?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  placeholder = '',
  rootMargin = '50px',
  threshold = 0.1,
  onLoad,
  onError,
  retryCount = 3
}) => {
  const { imgRef, imageSrc, isLoading, hasError, retry } = useLazyImage(src, {
    rootMargin,
    threshold,
    placeholder,
    retryCount
  });

  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (imageSrc === src && !isLoading) {
      setShowSkeleton(false);
      onLoad?.();
    }
  }, [imageSrc, src, isLoading, onLoad]);

  useEffect(() => {
    if (hasError) {
      onError?.();
    }
  }, [hasError, onError]);

  return (
    <div 
      ref={imgRef as any}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* 骨架屏/占位符 */}
      {showSkeleton && (
        <div 
          className="absolute inset-0 bg-gray-800 animate-pulse"
          style={{
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}
      
      {/* 实际图片 */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            showSkeleton ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setShowSkeleton(false)}
        />
      )}
      
      {/* 加载指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      
      {/* 错误提示 */}
      {hasError && !isLoading && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 cursor-pointer"
          onClick={retry}
        >
          <svg 
            className="w-8 h-8 text-gray-500 mb-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <span className="text-xs text-gray-400">点击重试</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
