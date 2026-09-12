/**
 * 滚动位置管理器
 * 用于在页面切换时保存和恢复滚动位置
 * 使用原生方法，等待内容渲染完成后再恢复
 */

const SCROLL_POSITION_KEY_PREFIX = 'scroll_position_'

/**
 * 保存页面的滚动位置
 */
export function saveScrollPosition(pathname: string): void {
  const scrollContainer = document.querySelector('.app-main') as HTMLElement
  if (scrollContainer) {
    const scrollY = scrollContainer.scrollTop
    sessionStorage.setItem(`${SCROLL_POSITION_KEY_PREFIX}${pathname}`, scrollY.toString())
  }
}

/**
 * 恢复页面的滚动位置（统一方法）
 * 自动处理从详情页返回和TabBar切换的两种情况
 * @param pathname 页面路径
 * @param detailKey 从详情页返回时使用的key（可选，如 'album_scroll_y', 'hotels_scroll_y'）
 * @param minContentHeight 最小内容高度，默认1000（用于判断内容是否加载完成）
 */
export function restoreScrollPosition(
  pathname: string, 
  detailKey?: string,
  minContentHeight: number = 1000
): void {
  const scrollContainer = document.querySelector('.app-main') as HTMLElement
  if (!scrollContainer) return
  
  // 优先检查从详情页返回的滚动位置
  let savedScrollY: string | null = null
  if (detailKey) {
    savedScrollY = sessionStorage.getItem(detailKey)
    if (savedScrollY) {
      // 找到详情页返回的滚动位置，使用它并清除
      sessionStorage.removeItem(detailKey)
    }
  }
  
  // 如果没有从详情页返回的滚动位置，检查TabBar切换的滚动位置
  if (!savedScrollY) {
    savedScrollY = sessionStorage.getItem(`${SCROLL_POSITION_KEY_PREFIX}${pathname}`)
  }
  
  if (!savedScrollY) return
  
  const scrollValue = parseInt(savedScrollY, 10)
  if (isNaN(scrollValue) || scrollValue <= 0) {
    if (detailKey) sessionStorage.removeItem(detailKey)
    sessionStorage.removeItem(`${SCROLL_POSITION_KEY_PREFIX}${pathname}`)
    return
  }
  
  // 等待内容高度足够时再恢复
  let attempts = 0
  const maxAttempts = 100 // 最多尝试 5 秒
  
  const tryRestore = () => {
    attempts++
    
    // 检查内容高度是否足够（使用滚动值 + 缓冲，或者最小内容高度）
    const minHeight = Math.max(scrollValue + 100, minContentHeight)
    const hasEnoughHeight = scrollContainer.scrollHeight > minHeight
    
    if (hasEnoughHeight) {
      // 内容已准备好，恢复滚动位置
      scrollContainer.scrollTop = scrollValue
      sessionStorage.removeItem(`${SCROLL_POSITION_KEY_PREFIX}${pathname}`)
    } else if (attempts < maxAttempts) {
      // 内容还未准备好，继续等待
      setTimeout(tryRestore, 50)
    } else {
      // 超时，强制恢复
      scrollContainer.scrollTop = scrollValue
      sessionStorage.removeItem(`${SCROLL_POSITION_KEY_PREFIX}${pathname}`)
    }
  }
  
  // 立即尝试一次
  tryRestore()
}

/**
 * 清除页面的滚动位置
 */
export function clearScrollPosition(pathname: string): void {
  sessionStorage.removeItem(`${SCROLL_POSITION_KEY_PREFIX}${pathname}`)
}

