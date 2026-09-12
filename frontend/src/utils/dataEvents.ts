// 数据刷新事件类型
export const DATA_REFRESH_EVENTS = {
  MEMORIES_CHANGED: 'memories-changed',
  HOTELS_CHANGED: 'hotels-changed',
  MAP_DATA_CHANGED: 'map-data-changed',
  HARD_TIMES_CHANGED: 'hard-times-changed',
} as const

// 发送数据更新事件
export function emitDataRefresh(eventType: string, detail?: any) {
  const event = new CustomEvent(eventType, { detail })
  window.dispatchEvent(event)
}

// 监听数据更新事件
export function onDataRefresh(eventType: string, callback: (detail?: any) => void) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }
  
  window.addEventListener(eventType, handler)
  
  // 返回清理函数
  return () => {
    window.removeEventListener(eventType, handler)
  }
}

