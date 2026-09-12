import { APP_CONFIG } from '../config'

/**
 * 根据访问次数获取对应的颜色类名
 * @param count 访问次数
 * @returns CSS类名
 */
export const getVisitCountColorClass = (count: number): string => {
  if (count === 0) return 'unvisited'
  
  const { veryHigh, high, medium } = APP_CONFIG.visitCountThresholds
  
  if (count >= veryHigh) return 'visited-very-high'
  if (count >= high) return 'visited-high'
  if (count >= medium) return 'visited-medium'
  return 'visited-low'
}

