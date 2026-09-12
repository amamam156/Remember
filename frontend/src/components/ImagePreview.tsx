import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ImagePreviewProps {
  imageUrl: string
  images: string[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

/**
 * iOS专属图片Preview组件
 * 使用 React Portal 直接挂载到 body，完全独立渲染
 * 避免 z-index 层级问题
 */
export function ImagePreview({ 
  imageUrl, 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}: ImagePreviewProps) {
  
  // iOS专属：挂载时隐藏TabBar，卸载时恢复
  useEffect(() => {
    // 隐藏body滚动
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    
    // 找到TabBar并隐藏
    const tabBar = document.querySelector('[data-tab-bar]') as HTMLElement
    if (tabBar) {
      tabBar.style.display = 'none'
    }
    
    return () => {
      // 恢复
      document.body.style.overflow = originalOverflow
      if (tabBar) {
        tabBar.style.display = ''
      }
    }
  }, [])
  
  // iOS专属：智能区分单击和双指缩放
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
    // 如果是触摸事件且有多个触摸点，不Close（允许缩放）
    if ('touches' in e && e.touches && e.touches.length > 1) {
      return
    }
    // 单击Close
    onClose()
  }
  
  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrev])
  
  const overlayContent = (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center"
      style={{
        zIndex: 999999,
        isolation: 'isolate',
      }}
      onClick={onClose} // 点击背景Close
    >
      {/* Close按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute z-10 group"
        style={{ 
          top: 'max(2rem, env(safe-area-inset-top, 0px) + 1rem)',
          right: '1rem'
        }}
      >
        <div className="relative">
          <div className="relative bg-white/10 backdrop-blur-3xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 rounded-full" />
            <span className="relative text-white text-xl font-light">✕</span>
          </div>
        </div>
      </button>
      
      {/* 上一张按钮 */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="absolute left-4 z-10 bg-white/10 backdrop-blur-3xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg border border-white/20"
        >
          <span className="text-white text-2xl">‹</span>
        </button>
      )}
      
      {/* 图片 - 支持双指缩放，单击Close */}
      <img
        src={imageUrl}
        alt="Preview"
        className="max-w-full max-h-full object-contain"
        style={{ 
          maxHeight: '90vh',
          touchAction: 'pinch-zoom', // iOS专属：允许双指缩放
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onClick={handleImageClick}
        onTouchEnd={(e) => {
          // iOS专属：单指触摸结束时Close，双指不Close
          if (e.changedTouches.length === 1 && e.touches.length === 0) {
            handleImageClick(e as any)
          }
        }}
      />
      
      {/* 下一张按钮 */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 z-10 bg-white/10 backdrop-blur-3xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg border border-white/20"
        >
          <span className="text-white text-2xl">›</span>
        </button>
      )}
      
      {/* 图片计数器 - Liquid Glass 风格（深色背景） */}
      {images.length > 1 && (
        <div 
          className="absolute z-10"
          style={{ bottom: 'max(2rem, env(safe-area-inset-bottom, 0px) + 2rem)' }}
          onClick={(e) => e.stopPropagation()} // 点击计数器不Close
        >
          <div className="relative">
            {/* 主体玻璃效果 - 深色半透明 */}
            <div className="relative bg-black/60 backdrop-blur-3xl rounded-full px-3 py-1.5 shadow-lg border border-white/20">
              {/* 内部光泽 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 rounded-full" />
              
              {/* 文字 */}
              <span className="relative text-white text-xs font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  
  // 使用 Portal 直接挂载到 body
  return createPortal(overlayContent, document.body)
}

