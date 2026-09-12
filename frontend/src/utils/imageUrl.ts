import { APP_CONFIG } from '../config'

/**
 * 获取完整的图片URL
 * @param imageUrl 图片路径（可能是相对路径或完整URL）
 * @returns 完整的图片URL，如果输入为空则返回 null
 */
export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null
  
  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  // 拼接基础URL
  return `${APP_CONFIG.apiBaseUrl}${imageUrl}`
}

