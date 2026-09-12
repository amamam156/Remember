import { useState, useEffect } from 'react'
import { apiService, WorldMapData, CountryMapData, RegionMemoriesData } from '../services/api'
import { getCache, setCache, removeCache, CACHE_TTL } from '../utils/cache'

// 地图数据缓存键前缀
const MAP_CACHE_PREFIX = {
  WORLD: 'app_cache_world_map_unified',
  COUNTRY: 'app_cache_country_map_unified_',
  REGION: 'app_cache_region_memories_unified_',
}

/**
 * Hook for fetching world map data with cache
 */
export function useWorldMapData(refreshTrigger: number = 0) {
  const cacheKey = MAP_CACHE_PREFIX.WORLD
  
  const [data, setData] = useState<WorldMapData | null>(() => getCache<WorldMapData>(cacheKey))
  const [isLoading, setIsLoading] = useState(() => !getCache<WorldMapData>(cacheKey))
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    
    // 检查缓存
    const cachedData = getCache<WorldMapData>(cacheKey)
    
    if (cachedData && refreshTrigger === 0) {
      setData(cachedData)
      setIsLoading(false)
      return
    }
    
    // 如果 refreshTrigger > 0，清除缓存和 state
    if (refreshTrigger > 0) {
      removeCache(cacheKey)
      setData(null)
      setError(null)
      setRetryCount(0)
    }

    const fetchData = async () => {
      if (cancelled) return
      
      setIsLoading(true)
      setError(null)
      try {
        const result = await apiService.getWorldMapData()
        
        if (cancelled) return
        
        setData(result)
        setCache(cacheKey, result, CACHE_TTL.WORLD_MAP)
      } catch (err) {
        if (cancelled) return
        
        setError(err instanceof Error ? err.message : '加载世界地图数据失败')
        
        if (retryCount < 1) {
          setTimeout(() => {
            if (!cancelled) {
              setRetryCount(prev => prev + 1)
            }
          }, 1000)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      cancelled = true
    }
  }, [retryCount, refreshTrigger, cacheKey])

  return { data, isLoading, error }
}

/**
 * Hook for fetching country map data with cache
 */
export function useCountryMapData(countryCode: string | null, refreshTrigger: number = 0) {
  const cacheKey = countryCode ? `${MAP_CACHE_PREFIX.COUNTRY}${countryCode}` : null
  
  const [data, setData] = useState<CountryMapData | null>(() => 
    cacheKey ? getCache<CountryMapData>(cacheKey) : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    
    if (!countryCode || !cacheKey) {
      setData(null)
      setIsLoading(false)
      return
    }
    
    const cachedData = getCache<CountryMapData>(cacheKey)
    
    if (cachedData && refreshTrigger === 0) {
      setData(cachedData)
      setIsLoading(false)
      return
    }
    
    if (refreshTrigger > 0 && cacheKey) {
      removeCache(cacheKey)
      setData(null)
      setError(null)
      setRetryCount(0)
    }

    const fetchData = async () => {
      if (cancelled) return
      
      setIsLoading(true)
      setError(null)
      let shouldRetry = false
      try {
        const result = await apiService.getCountryMapData(countryCode)
        
        if (cancelled) return
        
        setData(result)
        if (cacheKey) {
          setCache(cacheKey, result, CACHE_TTL.COUNTRY_MAP)
        }
      } catch (err) {
        if (cancelled) return
        
        const errorMessage = err instanceof Error ? err.message : '加载国家地图数据失败'
        const is404 = errorMessage.includes('404') || errorMessage.includes('Not Found') || errorMessage.includes('国家不存在')
        
        if (is404 && retryCount < 1) {
          setError(null)
          shouldRetry = true
          setTimeout(() => {
            if (!cancelled) {
              setIsLoading(true)
              setRetryCount(prev => prev + 1)
            }
          }, 500)
        } else {
          setError(errorMessage)
          if (retryCount < 1) {
            setTimeout(() => {
              if (!cancelled) {
                setRetryCount(prev => prev + 1)
              }
            }, 1000)
          }
        }
      } finally {
        if (!shouldRetry && !cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      cancelled = true
    }
  }, [countryCode, retryCount, refreshTrigger, cacheKey])

  return { data, isLoading, error }
}

/**
 * Hook for fetching region memories with cache
 */
export function useRegionMemories(
  regionId: string | null,
  isCountryLevel: boolean = false,
  refreshTrigger: number = 0
) {
  const cacheKey = regionId ? `${MAP_CACHE_PREFIX.REGION}${regionId}_${isCountryLevel}` : null
  
  const [data, setData] = useState<RegionMemoriesData | null>(() =>
    cacheKey ? getCache<RegionMemoriesData>(cacheKey) : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    
    if (!regionId || !cacheKey) {
      setData(null)
      setRetryCount(0)
      return
    }

    if (refreshTrigger > 0 && cacheKey) {
      removeCache(cacheKey)
      setData(null)
      setError(null)
      setRetryCount(0)
    }
    
    const cachedData = getCache<RegionMemoriesData>(cacheKey)
    
    if (cachedData && refreshTrigger === 0) {
      setData(cachedData)
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      if (cancelled) return
      
      setIsLoading(true)
      setError(null)
      try {
        const result = await apiService.getRegionMemories(regionId, isCountryLevel)
        
        if (cancelled) return
        
        if ('memoriesByCity' in result) {
          setData(result as RegionMemoriesData)
        } else {
          const emptyData: RegionMemoriesData = {
            region: result.region,
            memoriesByCity: {}
          }
          setData(emptyData)
        }
        if (cacheKey) {
          setCache(cacheKey, result, CACHE_TTL.REGION_MEMORIES)
        }
      } catch (err: any) {
        if (cancelled) return
        
        if (err?.message?.includes('404') || err?.message?.includes('Not Found') || err?.message?.includes('不存在')) {
          const emptyData: RegionMemoriesData = {
            region: { id: regionId, name: regionId },
            memoriesByCity: {}
          }
          setData(emptyData)
          if (cacheKey) {
            setCache(cacheKey, emptyData, CACHE_TTL.REGION_MEMORIES)
          }
          setError(null)
        } else {
          setError(err instanceof Error ? err.message : '加载区域回忆失败')
          if (retryCount < 1) {
            setTimeout(() => {
              if (!cancelled) {
                setRetryCount(prev => prev + 1)
              }
            }, 1000)
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      cancelled = true
    }
  }, [regionId, isCountryLevel, retryCount, refreshTrigger, cacheKey])

  return { data, isLoading, error }
}

/**
 * 清除所有地图数据缓存（可用于刷新数据）
 */
export function clearMapDataCache() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(MAP_CACHE_PREFIX.WORLD) ||
        key.startsWith(MAP_CACHE_PREFIX.COUNTRY) ||
        key.startsWith(MAP_CACHE_PREFIX.REGION)) {
      removeCache(key)
    }
  })
}

/**
 * 清除世界地图缓存
 */
export function clearWorldMapCache() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(MAP_CACHE_PREFIX.WORLD)) {
      removeCache(key)
    }
  })
}

/**
 * 清除国家地图缓存
 */
export function clearCountryMapCache(countryCode?: string) {
  if (countryCode) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${MAP_CACHE_PREFIX.COUNTRY}${countryCode}`)) {
        removeCache(key)
      }
    })
  } else {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(MAP_CACHE_PREFIX.COUNTRY)) {
        removeCache(key)
      }
    })
  }
}

/**
 * 清除区域回忆缓存
 */
export function clearRegionMemoriesCache(regionId?: string) {
  if (regionId) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${MAP_CACHE_PREFIX.REGION}${regionId}`)) {
        removeCache(key)
      }
    })
  } else {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(MAP_CACHE_PREFIX.REGION)) {
        removeCache(key)
      }
    })
  }
}
