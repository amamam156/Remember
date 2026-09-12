import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Hotel } from '../services/api'
import { Hotel as HotelIcon, Star } from 'lucide-react'
import HotelTimelineView from '../components/HotelTimelineView'
import InfiniteScroll from '../components/InfiniteScroll'
import { apiService } from '../services/api'
import { APP_CONFIG } from '../config'
import { onDataRefresh, DATA_REFRESH_EVENTS } from '../utils/dataEvents'
import { getCache, setCache, CACHE_KEYS, removeCache, CACHE_TTL } from '../utils/cache'

// stars级选项
const ratingOptions = [
  { label: 'All', value: null },
  { label: '5星', value: 5 },
  { label: '4星', value: 4 },
  { label: '3星', value: 3 },
  { label: '2星', value: 2 },
  { label: '1星', value: 1 }
]

export default function Hotels() {
  const { } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedRating, setSelectedRating] = useState<string>('All')
  const [showRatingOptions, setShowRatingOptions] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const scrollToIdRef = useRef<string | null>(null)
  const hasLoadedOnce = useRef(false)
  
  // 检查scrollTo参数（独立的effect，只在当前页面时生效）
  useEffect(() => {
    // 只在酒店页面时检查scrollTo参数
    if (location.pathname === '/hotels') {
      const scrollToId = searchParams.get('scrollTo')
      if (scrollToId) {
        scrollToIdRef.current = scrollToId
      }
    }
  }, [searchParams, location.pathname])
  
  // 滚动到指定的酒店卡片
  useEffect(() => {
    // 只在酒店页面时执行滚动
    if (location.pathname !== '/hotels') return
    if (!scrollToIdRef.current || hotels.length === 0) return
    
    const targetId = scrollToIdRef.current
    console.log('🎯 准备滚动到酒店:', targetId, '酒店总数:', hotels.length)
    
    // 等待DOM渲染完成
    const timer = setTimeout(() => {
      const element = document.getElementById(`hotel-${targetId}`)
      console.log('🔍 查找元素 hotel-' + targetId + ':', element ? '找到' : '未找到')
      
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
    }, 500) // 增加延迟确保DOM完全渲染
    
    return () => clearTimeout(timer)
  }, [hotels, setSearchParams])

  // 监听酒店数据变化事件
  useEffect(() => {
    const unsubscribe = onDataRefresh(DATA_REFRESH_EVENTS.HOTELS_CHANGED, () => {
      console.log('检测到酒店数据变化，刷新数据...')
      
      // 清除酒店缓存
      removeCache(CACHE_KEYS.HOTELS)
      
      // 重新加载数据，使用当前的筛选条件
      const loadHotels = async () => {
        setIsLoading(true)
        setPage(1)
        
        try {
          // 使用完整的参数，包括当前的筛选和排序条件
          const params: any = {
            page: 1,
            limit: APP_CONFIG.pagination.defaultPageSize,
            sortOrder: sortOrder
          }
          
          // 如果选择了星级，添加星级筛选
          if (selectedRating !== 'All') {
            const ratingOption = ratingOptions.find(opt => opt.label === selectedRating)
            if (ratingOption && ratingOption.value !== null) {
              params.rating = ratingOption.value
            }
          }
          
          const response = await apiService.getHotels(params)
          if (response.success) {
            const cacheData = {
              hotels: response.data.hotels,
              total: response.data.pagination.total,
              hasMore: response.data.hotels.length < response.data.pagination.total
            }
            setHotels(cacheData.hotels)
            setHasMore(cacheData.hasMore)
            // 更新缓存
            setCache(CACHE_KEYS.HOTELS, cacheData, CACHE_TTL.HOTELS)
          }
        } catch (error) {
          console.error('重新加载酒店失败:', error)
        } finally {
          setIsLoading(false)
        }
      }
      
      loadHotels()
    })
    
    return unsubscribe
  }, [sortOrder, selectedRating])

  // 从后端加载Stay list - 使用缓存优先策略
  // 只在页面首 visits加载时执行，切换页面时不会重新加载（使用缓存）
  useEffect(() => {
    // 如果页面路径不是酒店页面，不加载数据
    if (location.pathname !== '/hotels') return
    
    // 如果已经加载过，不重复加载（避免切换页面时重新加载）
    if (hasLoadedOnce.current) {
      // 恢复滚动位置（由下面的 useEffect 统一处理）
      return
    }
    
    hasLoadedOnce.current = true
    const loadHotels = async () => {
      // 1. 先从缓存读取并立即显示（秒开）
      const cachedHotels = getCache<any>(CACHE_KEYS.HOTELS)
      if (cachedHotels) {
        console.log('📦 使用缓存酒店')
        setHotels(cachedHotels.hotels)
        setHasMore(cachedHotels.hasMore)
        setIsLoading(false)
      } else {
        setIsLoading(true)
      }
      
      setPage(1)
      
      try {
        // 2. 后台拉取最新数据
        console.log('🔄 后台更新酒店数据...')
        const params: any = {
          page: 1,
          limit: APP_CONFIG.pagination.defaultPageSize,
          sortOrder: sortOrder
        }
        
        // 如果选择了星级，添加星级筛选
        if (selectedRating !== 'All') {
          const ratingOption = ratingOptions.find(opt => opt.label === selectedRating)
          if (ratingOption && ratingOption.value !== null) {
            params.rating = ratingOption.value
          }
        }
        
        const response = await apiService.getHotels(params)
        if (response.success) {
          const cacheData = {
            hotels: response.data.hotels,
            total: response.data.pagination.total,
            hasMore: response.data.hotels.length < response.data.pagination.total
          }
          setHotels(cacheData.hotels)
          setHasMore(cacheData.hasMore)
          // 更新缓存
          setCache(CACHE_KEYS.HOTELS, cacheData, CACHE_TTL.HOTELS)
        }
        console.log('✅ 酒店数据更新完成')
      } catch (error) {
        console.error('加载酒店失败:', error)
        // 如果有缓存，失败也不影响使用
      } finally {
        setIsLoading(false)
      }
    }
    
    loadHotels()
  }, [sortOrder, selectedRating])

  // 加载更多酒店
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    const nextPage = page + 1
    setIsLoading(true)

    try {
      const params: any = {
        page: nextPage,
        limit: APP_CONFIG.pagination.defaultPageSize,
        sortOrder: sortOrder
      }
      
      // 如果选择了星级，添加星级筛选
      if (selectedRating !== 'All') {
        const ratingOption = ratingOptions.find(opt => opt.label === selectedRating)
        if (ratingOption && ratingOption.value !== null) {
          params.rating = ratingOption.value
        }
      }
      
      const response = await apiService.getHotels(params)
      if (response.success) {
        setHotels(prevHotels => {
          const newHotels = [...prevHotels, ...response.data.hotels]
          setPage(nextPage)
          setHasMore(newHotels.length < response.data.pagination.total)
          setIsLoading(false)
          return newHotels
        })
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('加载更多酒店失败:', error)
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore, sortOrder, selectedRating])

  return (
    <div>
      {/* 主要内容区域 */}
      <div className="main-content">
        {/* 时间轴列表 */}
        <div className="timeline-container">
          <div className="timeline-header">
            <div className="header-content">
              <h3 className="timeline-title">Stay list</h3>
              <div className="header-controls">
                <button 
                  className="sort-toggle-btn"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '正序' : '倒序'}
                </button>
                <div className="filter-section">
                  <button 
                    className="filter-btn"
                    onClick={() => setShowRatingOptions(!showRatingOptions)}
                  >
                    {selectedRating === 'All' ? (
                      selectedRating
                    ) : (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{ratingOptions.find(opt => opt.label === selectedRating)?.value}</span>
                      </span>
                    )}
                    <span className="arrow-icon">▼</span>
                  </button>
                  {showRatingOptions && (
                    <div className="tag-dropdown">
                      {ratingOptions.map(option => (
                        <button
                          key={option.label}
                          className={`tag-item ${selectedRating === option.label ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRating(option.label)
                            setShowRatingOptions(false)
                          }}
                        >
                          {option.value === null ? (
                            option.label
                          ) : (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{option.value}</span>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="timeline-content">
            {hotels.length === 0 && !isLoading ? (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4">
                <div className="text-center py-8">
                  <HotelIcon className="h-16 w-16 text-gray-300 dark:text-[#8E8E93] mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-[#8E8E93]">No stays yet</p>
                  <p className="text-gray-400 dark:text-[#8E8E93]/70 text-sm mt-2">Save your first stay.</p>
                </div>
              </div>
            ) : (
              <InfiniteScroll
                loadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoading}
              >
                <HotelTimelineView hotels={hotels} />
              </InfiniteScroll>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

