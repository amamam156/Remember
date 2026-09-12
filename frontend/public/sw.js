// 简化的原生 Service Worker
const CACHE_NAME = 'album-cache-v5'  // 更新版本号以清除旧缓存
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天
const MAP_BOOT_ASSETS = [
  '/map-assets/liberty.json'
]

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] 安装新的 Service Worker v5')
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(MAP_BOOT_ASSETS)))
  self.skipWaiting()
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活 Service Worker v3，清理旧缓存')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] 删除旧缓存:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// 获取请求 - 网络优先策略（不缓存JS/CSS，避免更新问题）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // 只处理 http/https 协议的请求，忽略 chrome-extension、file、data 等
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  if (event.request.method === 'GET' && url.pathname.startsWith('/map-assets/')) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
    return
  }

  // Cache map tiles, fonts and sprites after their first successful load.
  if (event.request.method === 'GET' && url.hostname === 'tiles.openfreemap.org') {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok || response.type === 'opaque') {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()))
        }
        return response
      }))
    )
    return
  }

  // 只缓存图片，不缓存JS/CSS（避免更新问题）
  if (event.request.method === 'GET' && (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i)
  )) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(event.request).then((response) => {
          // 只缓存成功的响应
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        }).catch(() => {
          // 网络失败时返回离线页面（如果有）
          if (event.request.destination === 'document') {
            return caches.match('/offline.html')
          }
        })
      })
    )
  }
})
