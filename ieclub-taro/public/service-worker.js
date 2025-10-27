/**
 * Service Worker - PWA 离线支持
 * 缓存策略：Cache First（缓存优先）+ Network Fallback（网络降级）
 */

const CACHE_NAME = 'ieclub-v1.0.0';
const RUNTIME_CACHE = 'ieclub-runtime';

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // 立即激活新的 SW
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim()) // 立即控制所有页面
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 HTTP(S) 请求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API 请求：Network First（网络优先）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 缓存成功的 API 响应
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时返回缓存
          return caches.match(request);
        })
    );
    return;
  }

  // 静态资源：Cache First（缓存优先）
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // 缓存未命中，从网络获取
        return fetch(request).then((response) => {
          // 只缓存成功的响应
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
      .catch(() => {
        // 返回离线页面（如果有）
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// 监听消息（用于清除缓存等操作）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});


