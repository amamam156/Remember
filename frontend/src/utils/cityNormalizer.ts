/**
 * 城市规范化结果接口
 */
export interface NormalizedCity {
  cityId: string
  cityName: string
  cityNameEn: string
  isChinese: boolean
  country: string
  province: string
  coordinates?: {
    lng: number
    lat: number
  }
}

/**
 * 城市访问统计接口
 */
export interface CityVisitStats {
  cityId: string
  cityName: string
  cityNameEn: string
  isChinese: boolean
  visitCount: number
  coordinates?: {
    lng: number
    lat: number
  }
}

// 常见城市坐标数据 (同步自 backend/src/database/seed.ts)
export const cityCoordinates: Record<string, { lng: number; lat: number }> = {
  // 中国主要城市
  'beijing': { lng: 116.4074, lat: 39.9042 },
  'shanghai': { lng: 121.4737, lat: 31.2304 },
  'tianjin': { lng: 117.2054, lat: 39.1336 },
  'chongqing': { lng: 106.5504, lat: 29.5637 },
  'guangzhou': { lng: 113.2644, lat: 23.1291 },
  'shenzhen': { lng: 114.0579, lat: 22.5431 },
  'zhuhai': { lng: 113.5767, lat: 22.2707 },
  'foshan': { lng: 113.1214, lat: 23.0215 },
  'dongguan': { lng: 113.7518, lat: 23.0205 },
  'hangzhou': { lng: 120.1551, lat: 30.2741 },
  'ningbo': { lng: 121.5440, lat: 29.8683 },
  'wenzhou': { lng: 120.7011, lat: 28.0006 },
  'nanjing': { lng: 118.7674, lat: 32.0415 },
  'suzhou': { lng: 120.5853, lat: 31.2989 },
  'wuxi': { lng: 120.3017, lat: 31.5747 },
  'wuhan': { lng: 114.2986, lat: 30.5844 },
  'chengdu': { lng: 104.0668, lat: 30.5728 },
  'xian': { lng: 108.9402, lat: 34.3416 },
  'changsha': { lng: 112.9823, lat: 28.1949 },
  'fuzhou': { lng: 119.3062, lat: 26.0753 },
  'xiamen': { lng: 118.0894, lat: 24.4798 },
  'kunming': { lng: 102.7122, lat: 25.0406 },
  'harbin': { lng: 126.6425, lat: 45.7560 },
  'taipei': { lng: 121.5654, lat: 25.0330 },
  'hongkong_city': { lng: 114.1694, lat: 22.3193 },
  'macau_city': { lng: 113.5439, lat: 22.1987 },
  
  // 美国主要城市
  'newyork_city': { lng: -74.0060, lat: 40.7128 },
  'losangeles': { lng: -118.2437, lat: 34.0522 },
  'chicago': { lng: -87.6298, lat: 41.8781 },
  'houston': { lng: -95.3698, lat: 29.7604 },
  'dallas': { lng: -96.7970, lat: 32.7767 },
  'sanfrancisco': { lng: -122.4194, lat: 37.7749 },
  'seattle': { lng: -122.3321, lat: 47.6062 },
  'mukilteo': { lng: -122.3046, lat: 47.9445 },
  'boston': { lng: -71.0589, lat: 42.3601 },
  
  // 国际主要城市
  'tokyo': { lng: 139.6917, lat: 35.6895 },
  'osaka': { lng: 135.5023, lat: 34.6937 },
  'seoul': { lng: 126.9780, lat: 37.5665 },
  'singapore': { lng: 103.8198, lat: 1.3521 },
  'bangkok': { lng: 100.5018, lat: 13.7563 },
  'london': { lng: -0.1276, lat: 51.5074 },
  'paris': { lng: 2.3522, lat: 48.8566 },
  'berlin': { lng: 13.4050, lat: 52.5200 },
  'rome': { lng: 12.4964, lat: 41.9028 },
  'madrid': { lng: -3.7038, lat: 40.4168 },
  'toronto': { lng: -79.3832, lat: 43.6532 },
  'sydney': { lng: 151.2093, lat: -33.8688 }
}

// 城市基本信息映射 (用于快速查找)
const cityInfoMap: Record<string, { name: string; nameEn: string; isChinese: boolean; country: string; province: string }> = {
  'beijing': { name: '北京', nameEn: 'Beijing', isChinese: true, country: '中国', province: '直辖市' },
  'shanghai': { name: '上海', nameEn: 'Shanghai', isChinese: true, country: '中国', province: '直辖市' },
  'tianjin': { name: '天津', nameEn: 'Tianjin', isChinese: true, country: '中国', province: '直辖市' },
  'chongqing': { name: '重庆', nameEn: 'Chongqing', isChinese: true, country: '中国', province: '直辖市' },
  'guangzhou': { name: '广州', nameEn: 'Guangzhou', isChinese: true, country: '中国', province: '广东省' },
  'shenzhen': { name: '深圳', nameEn: 'Shenzhen', isChinese: true, country: '中国', province: '广东省' },
  'hangzhou': { name: '杭州', nameEn: 'Hangzhou', isChinese: true, country: '中国', province: '浙江省' },
  'nanjing': { name: '南京', nameEn: 'Nanjing', isChinese: true, country: '中国', province: '江苏省' },
  'wuhan': { name: '武汉', nameEn: 'Wuhan', isChinese: true, country: '中国', province: '湖北省' },
  'chengdu': { name: '成都', nameEn: 'Chengdu', isChinese: true, country: '中国', province: '四川省' },
  'xian': { name: '西安', nameEn: 'Xi’an', isChinese: true, country: '中国', province: '陕西省' },
  'taipei': { name: '台北', nameEn: 'Taipei', isChinese: true, country: '中国', province: '台湾省' },
  'hongkong_city': { name: '香港', nameEn: 'Hong Kong', isChinese: true, country: '中国', province: '香港特别行政区' },
  'macau_city': { name: '澳门', nameEn: 'Macau', isChinese: true, country: '中国', province: '澳门特别行政区' },
  'newyork_city': { name: 'New York City', nameEn: 'New York', isChinese: false, country: 'USA', province: 'New York' },
  'tokyo': { name: 'Tokyo', nameEn: 'Tokyo', isChinese: false, country: 'Japan', province: 'Tokyo' },
  'london': { name: 'London', nameEn: 'London', isChinese: false, country: 'UK', province: 'England' },
  'paris': { name: 'Paris', nameEn: 'Paris', isChinese: false, country: 'France', province: 'Île-de-France' }
}

/**
 * 规范化地点文本到市级行政区
 */
export function normalizeLocationToCity(locationText: string): NormalizedCity | null {
  if (!locationText || typeof locationText !== 'string') {
    return null
  }

  const text = locationText.trim()
  if (!text) return null

  // 1. 常见别名/名称匹配
  const aliases: Record<string, string> = {
    '北京': 'beijing', '上海': 'shanghai', '天津': 'tianjin', '重庆': 'chongqing',
    '广州': 'guangzhou', '深圳': 'shenzhen', '杭州': 'hangzhou', '南京': 'nanjing',
    '武汉': 'wuhan', '成都': 'chengdu', '西安': 'xian', '苏州': 'suzhou',
    '台北': 'taipei', '香港': 'hongkong_city', '澳门': 'macau_city',
    '纽约': 'newyork_city', '东京': 'tokyo', '伦敦': 'london', '巴黎': 'paris'
  }

  const cleanText = text.replace(/[市县区镇村]$/g, '').trim()
  
  // 查找匹配的ID
  let cityId = aliases[cleanText] || aliases[text]
  
  if (!cityId) {
    // 尝试在 infoMap 中查找
    cityId = Object.keys(cityInfoMap).find(id => 
      cityInfoMap[id].name.includes(cleanText) || 
      cityInfoMap[id].nameEn.toLowerCase() === text.toLowerCase()
    ) || ''
  }

  if (cityId && cityInfoMap[cityId]) {
    const info = cityInfoMap[cityId]
    return {
      cityId,
      cityName: info.name,
      cityNameEn: info.nameEn,
      isChinese: info.isChinese,
      country: info.country,
      province: info.province,
      coordinates: cityCoordinates[cityId]
    }
  }

  // 如果没有找到详细信息，至少尝试返回坐标 (如果ID匹配)
  if (cityId && cityCoordinates[cityId]) {
    return {
      cityId,
      cityName: text,
      cityNameEn: text,
      isChinese: text.match(/[\u4e00-\u9fa5]/) !== null,
      country: '',
      province: '',
      coordinates: cityCoordinates[cityId]
    }
  }

  return null
}

/**
 * 从照片数据中提取城市访问统计
 */
export function extractCityVisitStats(photos: Array<{ location?: string; city?: { id: string; name: string }; latitude?: number; longitude?: number }>): CityVisitStats[] {
  const cityStatsMap = new Map<string, CityVisitStats>()

  photos.forEach(photo => {
    // 优先使用照片自带的城市ID和坐标
    if (photo.city?.id && (photo.latitude || cityCoordinates[photo.city.id])) {
      const cityId = photo.city.id
      const existing = cityStatsMap.get(cityId)
      if (existing) {
        existing.visitCount++
      } else {
        cityStatsMap.set(cityId, {
          cityId,
          cityName: photo.city.name,
          cityNameEn: photo.city.name, // 暂时使用中文名作为EN，如果需要可以从infoMap补全
          isChinese: true,
          visitCount: 1,
          coordinates: photo.latitude ? { lat: photo.latitude, lng: photo.longitude || 0 } : cityCoordinates[cityId]
        })
      }
      return
    }

    // 否则尝试规范化
    if (!photo.location) return
    const normalizedCity = normalizeLocationToCity(photo.location)
    if (!normalizedCity) return

    const existing = cityStatsMap.get(normalizedCity.cityId)
    if (existing) {
      existing.visitCount++
    } else {
      cityStatsMap.set(normalizedCity.cityId, {
        cityId: normalizedCity.cityId,
        cityName: normalizedCity.cityName,
        cityNameEn: normalizedCity.cityNameEn,
        isChinese: normalizedCity.isChinese,
        visitCount: 1,
        coordinates: normalizedCity.coordinates
      })
    }
  })

  return Array.from(cityStatsMap.values()).sort((a, b) => b.visitCount - a.visitCount)
}

/**
 * 获取城市显示名称
 */
export function getCityDisplayName(city: CityVisitStats, useChinese: boolean = true): string {
  if (city.isChinese && useChinese) {
    return city.cityName
  }
  return city.cityNameEn || city.cityName
}

/**
 * 获取所有已访问城市的坐标信息
 */
export function getCityCoordinates(cityStats: CityVisitStats[]): Array<{
  cityId: string
  cityName: string
  cityNameEn: string
  isChinese: boolean
  visitCount: number
  lng: number
  lat: number
}> {
  return cityStats
    .filter(city => city.coordinates)
    .map(city => ({
      cityId: city.cityId,
      cityName: city.cityName,
      cityNameEn: city.cityNameEn,
      isChinese: city.isChinese,
      visitCount: city.visitCount,
      lng: city.coordinates!.lng,
      lat: city.coordinates!.lat
    }))
}
