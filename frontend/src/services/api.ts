import { Photo } from '../contexts/PhotoContext'
import { APP_CONFIG } from '../config'

const API_BASE_URL = APP_CONFIG.apiBaseUrl
console.log('API_BASE_URL:', API_BASE_URL)

export interface LoginRequest {
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    name: string
    username: string
  }
  message?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

// 地理数据接口
export interface Country {
  id: string
  iso2: string
  name: string
  latitude?: number
  longitude?: number
}

export interface Admin1 {
  id: string
  countryId: string
  name: string
}

export interface City {
  id: string
  countryId: string
  code?: string // 兼容旧接口
  name: string
  isMunicipality: boolean
  latitude?: number
  longitude?: number
}

// 回忆数据接口
export interface Memory {
  id: string
  createdById: string
  happenedAt: string
  title: string
  topic?: string
  locationTxt?: string
  countryId: string
  admin1Id?: string
  cityId?: string
  imageUrl?: string
  description?: string
  loveDays?: number
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
  country: Country
  admin1?: Admin1
  city?: City
  memoryTags: Array<{
    id: string
    memoryId: string
    tagId: string
    tag: {
      id: string
      name: string
    }
  }>
  images?: Array<{
    id: string
    memoryId: string
    imageUrl: string
    thumbnailUrl?: string
    order: number
    createdAt: string
  }>
}

export interface CreateMemoryRequest {
  happenedAt: string
  title: string
  topic?: string
  locationTxt?: string
  countryId: string
  admin1Id?: string
  cityId?: string
  imageUrl?: string | string[]  // 支持单图或多图
  tagIds?: string[]
  description?: string
}

// 酒店数据接口
export interface Hotel {
  id: string
  createdById: string
  name: string
  checkInDate: string
  checkOutDate?: string
  locationTxt?: string
  countryId: string
  admin1Id?: string
  cityId?: string
  notes?: string
  rating?: number
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
  country: Country
  admin1?: Admin1
  city?: City
  hotelImages: Array<{
    id: string
    imageUrl: string
    thumbnailUrl?: string
    order: number
  }>
  roomCardImages: Array<{
    id: string
    imageUrl: string
    thumbnailUrl?: string
    order: number
  }>
}

export interface CreateHotelRequest {
  name: string
  checkInDate: string
  checkOutDate?: string
  locationTxt?: string
  countryId: string
  admin1Id?: string
  cityId?: string
  notes?: string
  rating?: number
  hotelImages?: string[]
  roomCardImages?: string[]
}

// 统计数据接口
export interface CountryStats {
  [countryCode: string]: number
}

export interface Admin1Stats {
  [admin1Name: string]: number
}

export interface CityStats {
  [cityName: string]: number
}

export interface SummaryStats {
  countries: CountryStats
  admin1s: {
    [countryCode: string]: Admin1Stats
  }
  cities: {
    [countryCode: string]: {
      [admin1Name: string]: CityStats
    }
  }
}

// 新的地图API接口
export interface CountryStatistic {
  id: string           // ISO2 代码（小写）如 'cn', 'us'
  name: string         // 显示名称（根据lang）
  visitCount: number
}

export interface RegionStatistic {
  id: string          // 数据库ID
  name: string        // 显示名称
  visitCount: number
}

export interface WorldMapData {
  statistics: {
    countries: CountryStatistic[]
  }
}

export interface CountryMapData {
  country: {
    code: string
    name: string
    totalVisits: number
    mapFolder: string // 地图文件夹名称（后端提供）
  }
  regions: RegionStatistic[]
  allRegionNames: Record<string, string> // 所有地区的名称映射（用于 tooltip）
}

export interface RegionMemoriesData {
  region: {
    id: string
    name: string
  }
  memoriesByCity: {
    [cityName: string]: Memory[]
  }
}

export interface PhotoUploadResponse {
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl: string
  mediumUrl: string
  uploadedAt: string
  uploadedBy: string
  size: number
  width: number
  height: number
}


export interface BlockMapData {
  id: string
  name: string
  nameEn: string
  visitCount: number
  children?: BlockMapData[]
}

export interface LocationNormalizeResult {
  normalized: string
  countryId: string | null
  regionId: string | null
  confidence: number
}

export interface LocationValidationResult {
  isValid: boolean
  normalized: string
  countryId: string | null
  regionId: string | null
  confidence: number
}

class ApiService {

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    // 获取token
    const token = localStorage.getItem('token')
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      // 只有 401 表示令牌失效；403 是已登录但无权执行该操作。
      if (response.status === 401) {
        console.warn('🔐 认证失败，自动登出')
        // 清除本地存储
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        // 已在登录页时不要重复导航，否则全局 Provider 会形成刷新循环。
        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
        throw new Error('登录已失效，请重新登录')
      }
      
      // 尝试解析错误响应
      let errorData: any = null
      try {
        errorData = await response.json()
      } catch {
        // 如果无法解析为JSON，使用默认错误
      }
      
      const error = new Error(errorData?.error || `API Error: ${response.status} ${response.statusText}`)
      ;(error as any).response = { data: errorData, status: response.status }
      throw error
    }

    return response.json()
  }

  // 认证相关
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    return response
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' })
  }

  // 地理数据相关
  async getCountries(): Promise<Country[]> {
    return this.request<Country[]>('/api/geo/countries')
  }

  async getAdmin1s(country: string): Promise<Admin1[]> {
    return this.request<Admin1[]>(`/api/geo/admin1?country=${country}`)
  }

  async getCities(country: string, admin1?: string): Promise<City[]> {
    if (!country || country.trim() === '') {
      throw new Error('country参数不能为空')
    }
    const params = new URLSearchParams({ country })
    if (admin1) {
      params.append('admin1', admin1)
    }
    return this.request<City[]>(`/api/geo/cities?${params.toString()}`)
  }

  // 全局搜索地点
  async searchLocations(query: string): Promise<Array<{
    type: 'country' | 'admin1' | 'city'
    id: string
    name: string
    fullPath: string
    country?: { id: string; name: string }
    admin1?: { id: string; name: string }
  }>> {
    return this.request(`/api/geo/search?q=${encodeURIComponent(query)}`)
  }

  // 管理地点
  async createCountry(data: { iso2: string; name: string; latitude?: number; longitude?: number }): Promise<{ success: boolean; data: any }> {
    return this.request('/api/geo/countries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCountry(id: string, data: { iso2?: string; name?: string; latitude?: number; longitude?: number }): Promise<{ success: boolean; data: any }> {
    return this.request(`/api/geo/countries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCountry(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/geo/countries/${id}`, {
      method: 'DELETE'
    })
  }

  async createAdmin1(data: { countryId: string; name: string; latitude?: number; longitude?: number }): Promise<{ success: boolean; data: any }> {
    return this.request('/api/geo/admin1', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAdmin1(id: string, data: { name?: string; latitude?: number; longitude?: number }): Promise<{ success: boolean; data: any }> {
    return this.request(`/api/geo/admin1/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAdmin1(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/geo/admin1/${id}`, {
      method: 'DELETE'
    })
  }

  async createCity(data: { countryId: string; admin1Id?: string; name: string; isMunicipality?: boolean; latitude?: number; longitude?: number }): Promise<{ success: boolean; data: any }> {
    return this.request('/api/geo/cities', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCity(id: string, data: { name?: string; isMunicipality?: boolean; latitude?: number; longitude?: number; admin1Id?: string }): Promise<{ success: boolean; data: any }> {
    return this.request(`/api/geo/cities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCity(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/geo/cities/${id}`, {
      method: 'DELETE'
    })
  }

  // 标签相关
  async getTags(): Promise<Array<{ id: string; name: string }>> {
    const response = await this.request<{ success: boolean; data: Array<{ id: string; name: string }> }>('/api/tags')
    return response.data
  }

  // 回忆相关
  async getMemories(params?: {
    page?: number
    limit?: number
    countryId?: string
    admin1Id?: string
    cityId?: string
    tagIds?: string[]
    startDate?: string
    endDate?: string
    sortOrder?: 'asc' | 'desc' // 新增：排序参数
  }): Promise<{
    success: boolean
    data: {
      memories: Memory[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }
  }> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v))
          } else {
            queryParams.append(key, String(value))
          }
        }
      })
    }
    
    const queryString = queryParams.toString()
    const url = queryString ? `/api/memories?${queryString}` : '/api/memories'
    return this.request(url)
  }

  async getMemory(id: string): Promise<{
    success: boolean
    data: Memory
  }> {
    return this.request(`/api/memories/${id}`)
  }

  async createMemory(memoryData: CreateMemoryRequest): Promise<{
    success: boolean
    data: Memory
    message: string
  }> {
    return this.request('/api/memories', {
      method: 'POST',
      body: JSON.stringify(memoryData),
    })
  }

  async updateMemory(id: string, memoryData: Partial<CreateMemoryRequest>): Promise<{
    success: boolean
    data: Memory
    message: string
  }> {
    return this.request(`/api/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memoryData),
    })
  }

  async deleteMemory(id: string): Promise<{
    success: boolean
    message: string
  }> {
    return this.request(`/api/memories/${id}`, {
      method: 'DELETE',
    })
  }

  // 统计相关
  async getCountryStats(from?: string, to?: string): Promise<CountryStats> {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    
    const queryString = params.toString()
    const url = queryString ? `/api/stats/countries?${queryString}` : '/api/stats/countries'
    return this.request<CountryStats>(url)
  }

  async getAdmin1Stats(country: string, from?: string, to?: string): Promise<Admin1Stats> {
    const params = new URLSearchParams({ country })
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    
    return this.request<Admin1Stats>(`/api/stats/admin1?${params.toString()}`)
  }

  async getCityStats(country: string, admin1?: string, from?: string, to?: string): Promise<CityStats> {
    const params = new URLSearchParams({ country })
    if (admin1) params.append('admin1', admin1)
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    
    return this.request<CityStats>(`/api/stats/cities?${params.toString()}`)
  }

  async getSummaryStats(from?: string, to?: string): Promise<SummaryStats> {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    
    const queryString = params.toString()
    const url = queryString ? `/api/stats/summary?${queryString}` : '/api/stats/summary'
    return this.request<SummaryStats>(url)
  }

  // 照片相关
  async getPhotos(): Promise<Photo[]> {
    const response = await this.getMemories({ limit: 1000 })
    
    if (!response.success || !response.data.memories) {
      return []
    }
    
    // 直接返回后端数据，不做任何转换
    return response.data.memories.filter(m => m.imageUrl)
  }

  async uploadPhoto(file: File): Promise<PhotoUploadResponse> {
    const formData = new FormData()
    formData.append('image', file)

    return this.request<PhotoUploadResponse>('/api/upload', {
      method: 'POST',
      headers: {
        // 不设置Content-Type，让浏览器自动设置multipart/form-data
      },
      body: formData,
    })
  }

  async deletePhoto(id: string): Promise<void> {
    await this.request(`/api/memories/${id}`, {
      method: 'DELETE',
    })
  }

  // 这些旧的 photos API 已废弃，使用新的 memories API
  // 保留方法签名以防破坏现有代码

  // 健康检查
  async healthCheck(): Promise<{ ok: boolean }> {
    return this.request('/health')
  }

  // 新的地图API
  async getWorldMapData(): Promise<WorldMapData> {
    return this.request('/api/map/world')
  }

  async getCountryMapData(countryCode: string): Promise<CountryMapData> {
    return this.request(`/api/map/country/${countryCode}`)
  }

  async getRegionMemories(
    regionId: string, 
    isCountryLevel: boolean = false,
    page?: number,
    limit?: number
  ): Promise<RegionMemoriesData | {
    region: { id: string; name: string };
    memories: Memory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams()
    queryParams.append('isCountry', String(isCountryLevel))
    if (page !== undefined) {
      queryParams.append('page', String(page))
    }
    if (limit !== undefined) {
      queryParams.append('limit', String(limit))
    }
    return this.request(`/api/map/memories/${regionId}?${queryParams.toString()}`)
  }

  // 酒店相关
  async getHotels(params?: {
    page?: number
    limit?: number
    countryId?: string
    admin1Id?: string
    cityId?: string
    startDate?: string
    endDate?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{
    success: boolean
    data: {
      hotels: Hotel[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }
  }> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }
    
    const queryString = queryParams.toString()
    const url = queryString ? `/api/hotels?${queryString}` : '/api/hotels'
    return this.request(url)
  }

  async getHotel(id: string): Promise<{
    success: boolean
    data: Hotel
  }> {
    return this.request(`/api/hotels/${id}`)
  }

  async createHotel(hotelData: CreateHotelRequest): Promise<{
    success: boolean
    data: Hotel
    message: string
  }> {
    return this.request('/api/hotels', {
      method: 'POST',
      body: JSON.stringify(hotelData),
    })
  }

  async updateHotel(id: string, hotelData: Partial<CreateHotelRequest>): Promise<{
    success: boolean
    data: Hotel
    message: string
  }> {
    return this.request(`/api/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hotelData),
    })
  }

  async deleteHotel(id: string): Promise<{
    success: boolean
    message: string
  }> {
    return this.request(`/api/hotels/${id}`, {
      method: 'DELETE',
    })
  }

  // ==================== 强人所难应用 ====================
  
  async createHardTimeRecord(data: {
    date: string
    startTime: string
    endTime: string
    rating: number
  }): Promise<ApiResponse<any>> {
    return this.request('/api/hard-times', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getHardTimeRecords(params?: {
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<any[]>> {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return this.request(`/api/hard-times${query ? `?${query}` : ''}`)
  }

  async getHardTimeRecordByDate(date: string): Promise<ApiResponse<any>> {
    return this.request(`/api/hard-times/${date}`)
  }

  async updateHardTimeRecord(id: string, data: {
    startTime?: string
    endTime?: string
    rating?: number
  }): Promise<ApiResponse<any>> {
    return this.request(`/api/hard-times/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteHardTimeRecord(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/hard-times/${id}`, {
      method: 'DELETE'
    })
  }

  // ==================== 倒计时 ====================
  
  async getCountdown(): Promise<{
    success: boolean
    data: {
      days: number
      hours: number
      minutes: number
      seconds: number
      text: string
    }
  }> {
    return this.request('/api/countdown')
  }

}

export const apiService = new ApiService()
export const api = apiService // 别名导出，方便使用
