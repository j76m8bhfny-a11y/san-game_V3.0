/**
 * 图片懒加载与缓存管理
 * 
 * 功能：
 * - 图片懒加载（IntersectionObserver）
 * - 图片缓存限制（LRU）
 * - 错误处理和占位符
 */

import { useState, useEffect, useRef } from 'react';

// 图片缓存配置
const CONFIG = {
  MAX_CACHE_SIZE: 50,  // 最大缓存图片数
  PLACEHOLDER_COLOR: '#1f2937',  // 占位符颜色
  RETRY_DELAY: 1000,  // 重试延迟
};

// 图片缓存
interface CachedImage {
  element: HTMLImageElement;
  lastAccessed: number;
  accessCount: number;
}

const imageCache = new Map<string, CachedImage>();
const loadingQueue = new Set<string>();

/**
 * 更新图片访问记录（LRU）
 */
function updateImageAccess(url: string): void {
  const cached = imageCache.get(url);
  if (cached) {
    cached.lastAccessed = Date.now();
    cached.accessCount++;
  }
}

/**
 * 清理最旧的缓存
 */
function evictOldestCache(): void {
  if (imageCache.size < CONFIG.MAX_CACHE_SIZE) return;
  
  // 按最后访问时间排序
  const sorted = Array.from(imageCache.entries())
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  // 删除最旧的20%
  const toDelete = Math.ceil(CONFIG.MAX_CACHE_SIZE * 0.2);
  for (let i = 0; i < toDelete && i < sorted.length; i++) {
    const [url] = sorted[i];
    imageCache.delete(url);
    console.log(`[ImageLoader] 清理缓存: ${url}`);
  }
}

/**
 * 预加载图片
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // 检查缓存
    if (imageCache.has(url)) {
      updateImageAccess(url);
      resolve(imageCache.get(url)!.element);
      return;
    }
    
    // 检查是否正在加载
    if (loadingQueue.has(url)) {
      // 等待加载完成
      const checkInterval = setInterval(() => {
        if (imageCache.has(url)) {
          clearInterval(checkInterval);
          resolve(imageCache.get(url)!.element);
        }
      }, 100);
      
      // 5秒后超时
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Image load timeout'));
      }, 5000);
      return;
    }
    
    loadingQueue.add(url);
    
    const img = new Image();
    
    img.onload = () => {
      loadingQueue.delete(url);
      
      // 缓存清理
      evictOldestCache();
      
      // 加入缓存
      imageCache.set(url, {
        element: img,
        lastAccessed: Date.now(),
        accessCount: 1
      });
      
      resolve(img);
    };
    
    img.onerror = () => {
      loadingQueue.delete(url);
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    img.src = url;
  });
}

/**
 * 懒加载Hook
 */
export function useLazyImage(
  src: string | undefined,
  options: {
    rootMargin?: string;
    threshold?: number;
    placeholder?: string;
    retryCount?: number;
  } = {}
) {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = '',
    retryCount = 3
  } = options;
  
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (!src) {
      setImageSrc(placeholder);
      return;
    }
    
    // 检查缓存
    if (imageCache.has(src)) {
      setImageSrc(src);
      updateImageAccess(src);
      return;
    }
    
    const element = imgRef.current;
    if (!element) return;
    
    // 创建IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsLoading(true);
            
            preloadImage(src)
              .then(() => {
                setImageSrc(src);
                setIsLoading(false);
                setHasError(false);
              })
              .catch((error) => {
                console.warn('[ImageLoader] 加载失败:', error);
                setHasError(true);
                setIsLoading(false);
                
                // 重试机制
                if (retryAttempt < retryCount) {
                  setTimeout(() => {
                    setRetryAttempt(prev => prev + 1);
                  }, CONFIG.RETRY_DELAY * (retryAttempt + 1));
                }
              });
            
            // 停止观察
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold }
    );
    
    observerRef.current.observe(element);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, placeholder, rootMargin, threshold, retryAttempt, retryCount]);
  
  return {
    imgRef,
    imageSrc,
    isLoading,
    hasError,
    retry: () => setRetryAttempt(0)
  };
}

/**
 * 批量预加载图片
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => 
    preloadImage(url).catch(err => {
      console.warn(`[ImageLoader] 预加载失败: ${url}`, err);
    })
  );
  
  await Promise.all(promises);
}

/**
 * 清除图片缓存
 */
export function clearImageCache(): void {
  imageCache.clear();
  console.log('[ImageLoader] 图片缓存已清除');
}

/**
 * 获取缓存统计
 */
export function getImageCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
} {
  return {
    size: imageCache.size,
    maxSize: CONFIG.MAX_CACHE_SIZE,
    hitRate: imageCache.size / CONFIG.MAX_CACHE_SIZE
  };
}

// 开发模式挂载到window
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).imageLoader = {
    preloadImage,
    preloadImages,
    clearImageCache,
    getImageCacheStats
  };
}
