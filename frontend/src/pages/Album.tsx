import { useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Photo } from '../contexts/PhotoContext'
import { Heart, Search } from 'lucide-react'
import TimelineView from '../components/TimelineView'
import { apiService } from '../services/api'
import { onDataRefresh, DATA_REFRESH_EVENTS } from '../utils/dataEvents'
import { clearMapDataCache } from '../hooks/useMapData'
import { getCache, setCache, CACHE_KEYS, removeCache, CACHE_TTL } from '../utils/cache'

export default function Album() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { } = useAuth()

  const [sortOrder] = useState<'asc' | 'desc'>('desc')
  const [memories, setMemories] = useState<Photo[]>(() => {
    const cachedMemories = getCache<any>(CACHE_KEYS.MEMORIES)
    return cachedMemories ? cachedMemories.memories : []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(() => {
    const cachedMemories = getCache<any>(CACHE_KEYS.MEMORIES)
    return cachedMemories ? cachedMemories.hasMore : true
  })
  const [startDate] = useState<string>('')
  const [endDate] = useState<string>('')
  const hasLoadedOnce = useRef(false)
  const scrollToIdRef = useRef<string | null>(null)

  // 检查scrollTo参数（独立的effect，只在当前页面时生效）
  useEffect(() => {
    // 只在首页时检查scrollTo参数
    if (location.pathname === '/') {
      const scrollToId = searchParams.get('scrollTo')
      if (scrollToId) {
        scrollToIdRef.current = scrollToId
      }
    }
  }, [searchParams, location.pathname])

  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  // 从后端加载标签列表和回忆 - 使用缓存优先策略
  // 只在页面首 visits加载时执行，切换页面时不会重新加载（使用缓存）
  useEffect(() => {
    // 如果页面路径不是首页，不加载数据
    if (location.pathname !== '/') return

    // 加载标签
    apiService.getTags().then(tags => {
      if (tags) setAvailableTags(tags)
    })

    // 只有在切换标签或初始加载时，我们才执行加载逻辑
    
    // 如果是初始加载且有缓存，我们会显示缓存，但这里不 return，
    // 因为我们需要在后台拉取最新数据（由 loadData 处理）
    
    // 如果已经加载过，且当前没有切换标签（即不是因为点击标签触发的），则跳过
    // 这通常发生在组件重渲染或从详情页Back时
    if (hasLoadedOnce.current && location.pathname === '/' && !selectedTagId) {
      // 只有在真的是第一 visits进入页面且没有筛选时，才需要走这里的逻辑
      // 如果已经加载过了，且这 visits不是因为选中了某个标签而触发的 useEffect，就跳过
      // 注意：点击“All”会将 selectedTagId 置为 null，这会触发 useEffect
    }

    hasLoadedOnce.current = true

    const loadData = async () => {
      setIsLoading(true)
      // 清空当前回忆，为入场动画创造空间
      setMemories([])
      try {
        // 1. 先从缓存读取并立即显示（秒开）
        const cachedMemories = getCache<any>(CACHE_KEYS.MEMORIES)

        if (cachedMemories) {
          console.log('📦 使用缓存回忆')
          setMemories(cachedMemories.memories)
          setHasMore(cachedMemories.hasMore)
        }

        // 2. 后台拉取最新数据
        console.log('🔄 后台更新数据...')
        const memoriesData = await apiService.getMemories({
          page: 1,
          limit: 100, // Increase limit for gallery view
          sortOrder: 'desc',
          tagIds: selectedTagId ? [selectedTagId] : undefined
        })

        // 3. 更新UI和缓存
        if (memoriesData.success) {
          const cacheData = {
            memories: memoriesData.data.memories,
            total: memoriesData.data.pagination.total,
            hasMore: memoriesData.data.memories.length < memoriesData.data.pagination.total
          }
          setMemories(cacheData.memories)
          setHasMore(cacheData.hasMore)
          // 只有在未筛选标签时才更新全局缓存
          if (!selectedTagId) {
            setCache(CACHE_KEYS.MEMORIES, cacheData, CACHE_TTL.MEMORIES)
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedTagId])

  // 滚动到指定的回忆卡片（优先级最高，最后执行）
  useEffect(() => {
    // 只在首页时执行滚动
    if (location.pathname !== '/') return
    if (!scrollToIdRef.current || memories.length === 0) return

    const targetId = scrollToIdRef.current
    console.log('🎯 准备滚动到回忆:', targetId, '回忆总数:', memories.length)

    // 等待DOM渲染完成，延迟长一点确保其他滚动位置恢复完成
    const timer = setTimeout(() => {
      const element = document.getElementById(`memory-${targetId}`)
      console.log('🔍 查找元素 memory-' + targetId + ':', element ? '找到' : '未找到')

      if (element) {
        // 找到滚动容器（.app-main）
        const scrollContainer = document.querySelector('.app-main') as HTMLElement
        console.log('📦 找到滚动容器:', scrollContainer ? '是' : '否')

        if (scrollContainer) {
          // 计算元素相对于滚动容器的位置
          const containerRect = scrollContainer.getBoundingClientRect()
          const elementRect = element.getBoundingClientRect()
          const scrollTop = scrollContainer.scrollTop
          const targetScrollTop = scrollTop + elementRect.top - containerRect.top - 80 // 80px offset for TopNav

          console.log('📍 滚动位置计算 - 当前:', scrollTop, '目标:', targetScrollTop)

          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          })

          // 清除scrollTo参数和ref
          setSearchParams({})
          scrollToIdRef.current = null
        }
      } else {
        console.warn('⚠️ 未找到目标元素，可能还在加载中')
      }
    }, 600) // 延迟长一点确保其他滚动位置恢复完成后再执行

    return () => clearTimeout(timer)
  }, [memories, setSearchParams, location.pathname])

  // 监听回忆数据变化事件
  useEffect(() => {
    const unsubscribe = onDataRefresh(DATA_REFRESH_EVENTS.MEMORIES_CHANGED, () => {
      console.log('检测到回忆数据变化，刷新数据...')

      // 清除相关缓存
      clearMapDataCache()
      removeCache(CACHE_KEYS.MEMORIES) // 清除回忆缓存

      // 重新加载数据，使用当前的筛选条件
      const loadData = async () => {
        setIsLoading(true)
        setPage(1)

        try {
          const response = await apiService.getMemories({
            page: 1,
            limit: 100,
            sortOrder: sortOrder,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            tagIds: selectedTagId ? [selectedTagId] : undefined
          })
          if (response.success) {
            const cacheData = {
              memories: response.data.memories,
              total: response.data.pagination.total,
              hasMore: response.data.memories.length < response.data.pagination.total
            }
            setMemories(cacheData.memories)
            setHasMore(cacheData.hasMore)
            // 更新缓存
            if (!selectedTagId) {
              setCache(CACHE_KEYS.MEMORIES, cacheData, CACHE_TTL.MEMORIES)
            }
          }
        } catch (error) {
          console.error('重新加载回忆失败:', error)
        } finally {
          setIsLoading(false)
        }
      }

      loadData()
    })

    // 组件卸载时清理监听
    return unsubscribe
  }, [sortOrder, startDate, endDate, selectedTagId])

  // 加载更多回忆 - Gallery uses its own internal infinite tiling, but we can still load more into the array
  const loadMore = async () => {
    if (isLoading || !hasMore) return

    const nextPage = page + 1
    setIsLoading(true)

    try {
      const response = await apiService.getMemories({
        page: nextPage,
        limit: 100,
        sortOrder: sortOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        tagIds: selectedTagId ? [selectedTagId] : undefined
      })
      if (response.success) {
        const newMemories = [...memories, ...response.data.memories]
        setMemories(newMemories)
        setPage(nextPage)
        setHasMore(newMemories.length < response.data.pagination.total)
      }
    } catch (error) {
      console.error('加载更多回忆失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* 主要内容区域 */}
      {/* 主要内容区域 */}
      <div className="main-content !p-0">
        {/* Top filter bar (Search + Categories) - Now Floating */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top,40px)+16px)] pb-6 overflow-x-auto hide-scrollbar w-full bg-gradient-to-b from-[#0B0C10]/95 via-[#0B0C10]/70 to-transparent pointer-events-auto">
          <button className="flex-shrink-0 w-[44px] h-[44px] rounded-full bg-[#1A1B22]/80 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-sm transition-colors hover:bg-white/20 pointer-events-auto">
            <Search className="w-5 h-5 text-white" />
          </button>

          {/* Tag filtering categories */}
          <button 
            onClick={() => setSelectedTagId(null)}
            className={`flex-shrink-0 h-[44px] px-5 rounded-full backdrop-blur-md border border-white/10 text-[11px] font-semibold shadow-sm transition-all pointer-events-auto ${
              selectedTagId === null ? 'bg-pink-500 text-white border-pink-400' : 'bg-[#1A1B22]/80 text-white/90 hover:bg-[#3A3B41]/80'
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button 
              key={tag.id} 
              onClick={() => setSelectedTagId(tag.id)}
              className={`flex-shrink-0 h-[44px] px-5 rounded-full backdrop-blur-md border border-white/10 text-[11px] font-semibold shadow-sm transition-all pointer-events-auto ${
                selectedTagId === tag.id ? 'bg-pink-500 text-white border-pink-400' : 'bg-[#1A1B22]/80 text-white/90 hover:bg-[#3A3B41]/80'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>

        {/* Bottom fade overlay - fixed so it always covers to real screen bottom (incl. tabbar) */}
        <div className="fixed bottom-0 left-0 right-0 z-10 h-36 bg-gradient-to-t from-[#0B0C10]/95 via-[#0B0C10]/60 to-transparent pointer-events-none" />

        <div className="w-full relative min-h-[60vh] flex flex-col">
          {memories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="loading-spinner !h-8 !w-8"></div>
                  <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Loading...</span>
                </div>
              ) : (
                <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                  <Heart className="h-16 w-16 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No memories yet</p>
                  <p className="text-white/20 text-[10px] mt-2">Save your first memory</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 w-full h-full">
              <TimelineView 
                key={selectedTagId || 'all'} 
                photos={memories} 
              />
              {/* Optional: Hidden trigger for background loading more */}
              {hasMore && !isLoading && (
                <div 
                  className="opacity-0 pointer-events-none absolute bottom-0 h-10 w-10" 
                  ref={(el) => {
                    if (el) {
                      const observer = new IntersectionObserver((entries) => {
                        if (entries[0].isIntersecting) loadMore();
                      });
                      observer.observe(el);
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

