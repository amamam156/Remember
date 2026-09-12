import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initCacheCleanup } from './utils/cache'

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js?v=5')
      .then((registration) => {
        console.log('[App] SW 注册成功:', registration.scope)
        
        // 检查是否有更新
        registration.addEventListener('updatefound', () => {
          console.log('[App] 发现SW更新')
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[App] 新SW已激活，刷新页面')
                window.location.reload()
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('[App] SW 注册失败:', error)
      })
  })
}

// iOS推荐方案：使用整体容器滚动 + sticky 顶栏
// 不需要额外的JavaScript处理键盘

// 初始化缓存清理机制
initCacheCleanup()

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
