import { useEffect, useRef, ReactNode } from 'react'

interface InfiniteScrollProps {
  children: ReactNode
  loadMore: () => void
  hasMore: boolean
  isLoading: boolean
  loader?: ReactNode
  endMessage?: ReactNode
}

/**
 * 无限滚动组件
 * 使用 Intersection Observer API 实现
 */
export default function InfiniteScroll({
  children,
  loadMore,
  hasMore,
  isLoading,
  loader,
  endMessage
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoading, loadMore])

  return (
    <>
      {children}
      
      {/* 触发器元素 */}
      <div ref={observerTarget} style={{ height: '20px' }} />
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-4">
          {loader || (
            <div className="flex items-center justify-center">
              <div className="loading-spinner"></div>
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          )}
        </div>
      )}
      
      {/* 没有更多数据 */}
      {!hasMore && !isLoading && (
        <div className="text-center py-4 text-gray-500">
          {endMessage || '没有更多内容了'}
        </div>
      )}
    </>
  )
}

