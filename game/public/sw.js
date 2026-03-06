/**
 * Service Worker - 离线缓存支持
 * 
 * 功能：
 * - 静态资源缓存（JS、CSS、图片）
 * - 运行时缓存（事件JSON数据）
 * - 缓存优先策略
 */

const CACHE_NAME = 'pixel-life-v1';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;

// 静态资源列表（构建后由Vite注入）
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/fonts/PixelFont.woff2',
];

// 安装：缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.warn('[SW] Failed to cache static assets:', err);
      })
  );
  
  // 立即激活
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith(CACHE_NAME) && 
              name !== STATIC_CACHE && 
              name !== RUNTIME_CACHE)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
  );
  
  // 立即接管所有客户端
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非GET请求
  if (request.method !== 'GET') return;
  
  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') return;
  
  // 策略1：静态资源 - 缓存优先
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // 策略2：事件JSON - 网络优先，失败时回退缓存
  if (isEventData(url)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }
  
  // 策略3：图片 - 缓存优先，带过期
  if (isImage(url)) {
    event.respondWith(cacheFirstWithExpiration(request, RUNTIME_CACHE, 7 * 24 * 60 * 60 * 1000));
    return;
  }
  
  // 策略4：其他API请求 - 网络优先
  if (isAPI(request)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }
});

// ============ 策略函数 ============

/**
 * 缓存优先策略
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * 网络优先策略
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', error);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * 缓存优先（带过期时间）
 */
async function cacheFirstWithExpiration(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // 检查是否过期
    const dateHeader = cached.headers.get('sw-cache-time');
    if (dateHeader) {
      const age = Date.now() - parseInt(dateHeader);
      if (age < maxAge) {
        return cached;
      }
    } else {
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // 添加时间戳头部
      const headers = new Headers(response.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
      
      cache.put(request, modifiedResponse.clone());
      return modifiedResponse;
    }
    return response;
  } catch (error) {
    if (cached) {
      return cached;  // 即使过期也返回
    }
    return new Response('Offline', { status: 503 });
  }
}

// ============ 判断函数 ============

function isStaticAsset(url) {
  return STATIC_ASSETS.some(path => url.pathname.includes(path)) ||
    url.pathname.match(/\.(js|css|woff2?)$/);
}

function isEventData(url) {
  return url.pathname.includes('/assets/data/events/') && 
    url.pathname.endsWith('.json');
}

function isImage(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

function isAPI(request) {
  return request.headers.get('Accept')?.includes('application/json');
}

// ============ 消息处理 ============

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

console.log('[SW] Service Worker loaded');
