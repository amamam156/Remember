/**
 * 本地缓存工具
 * 提供带过期时间的缓存机制，优化iOS Safari兼容性
 */

// 缓存键名
export const CACHE_KEYS = {
  MEMORIES: 'app_cache_memories',
  HOTELS: 'app_cache_hotels',
  TAGS: 'app_cache_tags',
  STATS: 'app_cache_stats',
  WORLD_MAP: 'app_cache_world_map',
  COUNTRY_MAP: 'app_cache_country_map',
  REGION_MEMORIES: 'app_cache_region_memories',
  HARD_TIMES_PREFIX: 'app_cache_hard_times_', // 按月份缓存
} as const

// 缓存数据结构
interface CachedData<T> {
  data: T
  timestamp: number
  version: string
  expiresAt?: number // 过期时间戳（可选）
}

// 缓存配置
const CACHE_VERSION = '1.0'
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000 // 默认7天过期
const MAX_CACHE_SIZE = 5 * 1024 * 1024 // 最大缓存大小：5MB（iOS Safari限制约5-10MB）
const CLEANUP_THRESHOLD = 0.8 // 当缓存使用率达到80%时触发清理

// 不同数据类型的TTL配置（毫秒）
export const CACHE_TTL = {
  MEMORIES: 24 * 60 * 60 * 1000, // 1天
  HOTELS: 24 * 60 * 60 * 1000, // 1天
  TAGS: 7 * 24 * 60 * 60 * 1000, // 7天（标签变化较少）
  STATS: 1 * 60 * 60 * 1000, // 1小时
  WORLD_MAP: 7 * 24 * 60 * 60 * 1000, // 7天
  COUNTRY_MAP: 7 * 24 * 60 * 60 * 1000, // 7天
  REGION_MEMORIES: 24 * 60 * 60 * 1000, // 1天
  HARD_TIMES: 7 * 24 * 60 * 60 * 1000, // 7天
} as const

/**
 * 保存数据到缓存（带过期时间）
 * @param key 缓存键
 * @param data 要缓存的数据
 * @param ttl 过期时间（毫秒），默认使用DEFAULT_TTL
 */
export function setCache<T>(key: string, data: T, ttl?: number): void {
  try {
    // 检查缓存大小，如果接近限制则清理
    checkAndCleanupCache()
    
    const now = Date.now()
    const expiresAt = ttl ? now + ttl : now + DEFAULT_TTL
    
    const cached: CachedData<T> = {
      data,
      timestamp: now,
      version: CACHE_VERSION,
      expiresAt,
    }
    
    const serialized = JSON.stringify(cached)
    
    // iOS Safari: 检查单个缓存项是否过大
    if (serialized.length > MAX_CACHE_SIZE * 0.5) {
      console.warn(`⚠️ 缓存项 ${key} 过大 (${(serialized.length / 1024).toFixed(2)}KB)，可能影响性能`)
    }
    
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error('保存缓存失败:', error)
    
    // iOS Safari: 处理存储配额错误
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError' || 
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          (error as any).code === 22) {
        console.warn('⚠️ localStorage 存储配额已满，清理旧缓存...')
        // 清理过期和旧缓存
        cleanupExpiredCache()
        cleanupOldCache()
        
        // 重试一次
        try {
          const now = Date.now()
          const expiresAt = ttl ? now + ttl : now + DEFAULT_TTL
          const cached: CachedData<T> = {
            data,
            timestamp: now,
            version: CACHE_VERSION,
            expiresAt,
          }
          localStorage.setItem(key, JSON.stringify(cached))
        } catch (retryError) {
          console.error('重试保存缓存失败，清除所有缓存:', retryError)
          clearAllCache()
        }
      }
    }
  }
}

/**
 * 从缓存读取数据（自动检查过期）
 * @param key 缓存键
 * @returns 缓存的数据，如果过期或不存在则返回null
 */
export function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const parsed: CachedData<T> = JSON.parse(cached)
    
    // 检查版本
    if (parsed.version !== CACHE_VERSION) {
      localStorage.removeItem(key)
      return null
    }
    
    // 检查是否过期
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      console.log(`🗑️ 缓存 ${key} 已过期，自动删除`)
      localStorage.removeItem(key)
      return null
    }

    return parsed.data
  } catch (error) {
    console.error('读取缓存失败:', error)
    // iOS Safari: 清理损坏的缓存
    try {
      localStorage.removeItem(key)
    } catch {
      // 忽略清理错误
    }
    return null
  }
}

/**
 * 删除指定缓存
 */
export function removeCache(key: string): void {
  localStorage.removeItem(key)
}

/**
 * 清除所有应用缓存
 */
export function clearAllCache(): void {
  try {
    // 清除所有已知的缓存键
    Object.values(CACHE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch {
        // 忽略单个删除错误
      }
    })
    
    // 清除所有以 app_cache_ 开头的缓存（包括动态生成的）
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('app_cache_') || key.startsWith('app_cache_world_map_') || 
                  key.startsWith('app_cache_country_map_') || key.startsWith('app_cache_region_memories_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch {
        // 忽略删除错误
      }
    })
    
    console.log('✅ 所有缓存已清除')
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
}

/**
 * 清理过期的缓存
 */
function cleanupExpiredCache(): void {
  try {
    const now = Date.now()
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('app_cache_')) continue
      
      try {
        const cached = localStorage.getItem(key)
        if (!cached) continue
        
        const parsed: CachedData<any> = JSON.parse(cached)
        
        // 检查版本
        if (parsed.version !== CACHE_VERSION) {
          keysToRemove.push(key)
          continue
        }
        
        // 检查是否过期
        if (parsed.expiresAt && now > parsed.expiresAt) {
          keysToRemove.push(key)
        }
      } catch {
        // 解析失败，删除损坏的缓存
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch {
        // 忽略删除错误
      }
    })
    
    if (keysToRemove.length > 0) {
      console.log(`🗑️ 清理了 ${keysToRemove.length} 个过期缓存`)
    }
  } catch (error) {
    console.error('清理过期缓存失败:', error)
  }
}

/**
 * 清理最旧的缓存（当存储空间不足时）
 */
function cleanupOldCache(): void {
  try {
    const cacheEntries: Array<{ key: string; timestamp: number; size: number }> = []
    
    // 收集所有缓存项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('app_cache_')) continue
      
      try {
        const cached = localStorage.getItem(key)
        if (!cached) continue
        
        const parsed: CachedData<any> = JSON.parse(cached)
        if (parsed.version !== CACHE_VERSION) continue
        
        cacheEntries.push({
          key,
          timestamp: parsed.timestamp || 0,
          size: cached.length
        })
      } catch {
        // 忽略解析错误
      }
    }
    
    // 按时间戳排序（最旧的在前）
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp)
    
    // 删除最旧的50%缓存
    const toRemove = Math.floor(cacheEntries.length * 0.5)
    for (let i = 0; i < toRemove; i++) {
      try {
        localStorage.removeItem(cacheEntries[i].key)
      } catch {
        // 忽略删除错误
      }
    }
    
    if (toRemove > 0) {
      console.log(`🗑️ 清理了 ${toRemove} 个旧缓存以释放空间`)
    }
  } catch (error) {
    console.error('清理旧缓存失败:', error)
  }
}

/**
 * 检查缓存大小并自动清理
 */
function checkAndCleanupCache(): void {
  try {
    const totalSize = getTotalCacheSize()
    const usageRatio = totalSize / MAX_CACHE_SIZE
    
    if (usageRatio > CLEANUP_THRESHOLD) {
      console.log(`⚠️ 缓存使用率 ${(usageRatio * 100).toFixed(1)}%，触发自动清理`)
      cleanupExpiredCache()
      
      // 如果清理后仍然超过阈值，清理旧缓存
      const newSize = getTotalCacheSize()
      if (newSize / MAX_CACHE_SIZE > CLEANUP_THRESHOLD) {
        cleanupOldCache()
      }
    }
  } catch (error) {
    console.error('检查缓存大小失败:', error)
  }
}

/**
 * 获取总缓存大小（字节）
 */
function getTotalCacheSize(): number {
  let totalSize = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('app_cache_')) {
        const item = localStorage.getItem(key)
        if (item) {
          // 估算：每个字符约2字节（UTF-16）
          totalSize += item.length * 2
        }
      }
    }
  } catch (error) {
    console.error('计算缓存大小失败:', error)
  }
  return totalSize
}

/**
 * 获取缓存大小（估算）
 */
export function getCacheSize(): string {
  const totalSize = getTotalCacheSize()
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
  return `${sizeInMB} MB`
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  totalSize: number
  totalSizeMB: string
  itemCount: number
  expiredCount: number
  usageRatio: number
} {
  const now = Date.now()
  let totalSize = 0
  let itemCount = 0
  let expiredCount = 0
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('app_cache_')) continue
      
      try {
        const cached = localStorage.getItem(key)
        if (!cached) continue
        
        const parsed: CachedData<any> = JSON.parse(cached)
        if (parsed.version !== CACHE_VERSION) continue
        
        itemCount++
        totalSize += cached.length * 2
        
        if (parsed.expiresAt && now > parsed.expiresAt) {
          expiredCount++
        }
      } catch {
        // 忽略解析错误
      }
    }
  } catch (error) {
    console.error('获取缓存统计失败:', error)
  }
  
  return {
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    itemCount,
    expiredCount,
    usageRatio: totalSize / MAX_CACHE_SIZE
  }
}

/**
 * 批量保存缓存
 */
export function setCacheMultiple(items: Record<string, any>): void {
  Object.entries(items).forEach(([key, data]) => {
    setCache(key, data)
  })
}

/**
 * 检查缓存是否存在且未过期
 */
export function hasCache(key: string): boolean {
  const cached = getCache(key)
  return cached !== null
}

/**
 * 初始化缓存清理（应用启动时调用）
 */
export function initCacheCleanup(): void {
  // 清理过期缓存
  cleanupExpiredCache()
  
  // 检查并清理旧缓存
  checkAndCleanupCache()
  
  // 定期清理（每小时一次）
  setInterval(() => {
    cleanupExpiredCache()
    checkAndCleanupCache()
  }, 60 * 60 * 1000)
}

