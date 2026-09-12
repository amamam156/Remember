import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { apiService } from '../services/api'

// 直接使用后端 Memory 数据结构
export interface Photo {
  id: string
  createdById: string
  happenedAt: string
  title: string
  topic?: string
  locationTxt?: string
  countryId: string
  admin1Id?: string
  cityId?: string
  imageUrl?: string  // 主图（向后兼容）
  loveDays?: number  // 相恋天数
  createdAt: string
  updatedAt: string
  latitude?: number
  longitude?: number
  country: {
    id: string
    iso2: string
    name: string
    latitude?: number
    longitude?: number
  }
  admin1?: {
    id: string
    countryId: string
    name: string
    latitude?: number
    longitude?: number
  }
  city?: {
    id: string
    countryId: string
    admin1Id?: string
    name: string
    isMunicipality: boolean
    latitude?: number
    longitude?: number
  }
  memoryTags: Array<{
    id: string
    memoryId: string
    tagId: string
    tag: {
      id: string
      name: string
    }
  }>
  images?: Array<{  // 新增：多图片支持
    id: string
    memoryId: string
    imageUrl: string
    thumbnailUrl?: string
    order: number
    createdAt: string
  }>
}

interface PhotoContextType {
  photos: Photo[]
  addPhoto: (photo: Photo) => void
  removePhoto: (id: string) => void
  isLoading: boolean
  setLoading: (loading: boolean) => void
  loadPhotos: () => Promise<void>
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined)

interface PhotoProviderProps {
  children: ReactNode
}

export function PhotoProvider({ children }: PhotoProviderProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const hasLoadedRef = useRef(false)

  // 从后端API加载照片
  const loadPhotos = async () => {
    setIsLoading(true)
    try {
      const apiPhotos = await apiService.getPhotos()
      console.log('从后端API加载的照片数据:', apiPhotos)
      setPhotos(apiPhotos || [])
      hasLoadedRef.current = true
    } catch (error) {
      console.error('从后端加载照片失败:', error)
      setPhotos([])
    } finally {
      setIsLoading(false)
    }
  }


  // 组件挂载时加载照片 - 只加载一次
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadPhotos()
    }
  }, [])

  // 监听全局回忆变更事件，确保数据同步
  useEffect(() => {
    const handleMemoriesChanged = () => {
      console.log('检测到回忆变更，正在刷新 PhotoContext...')
      loadPhotos()
    }
    
    window.addEventListener('memories-changed', handleMemoriesChanged)
    return () => {
      window.removeEventListener('memories-changed', handleMemoriesChanged)
    }
  }, [])

  const addPhoto = async (photo: Photo) => {
    // 直接更新本地状态
    const newPhotos = [photo, ...photos]
    setPhotos(newPhotos)
    console.log('照片已添加到本地状态')
  }

  const removePhoto = async (id: string) => {
    try {
      // 先调用后端API删除
      await apiService.deletePhoto(id)
      console.log('照片已从后端删除')
      
      // 然后更新本地状态
      const newPhotos = photos.filter(photo => photo.id !== id)
      setPhotos(newPhotos)
    } catch (error) {
      console.error('删除照片失败:', error)
      throw error
    }
  }

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  return (
    <PhotoContext.Provider value={{ 
      photos, 
      addPhoto, 
      removePhoto, 
      isLoading, 
      setLoading,
      loadPhotos
    }}>
      {children}
    </PhotoContext.Provider>
  )
}

export function usePhotos() {
  const context = useContext(PhotoContext)
  if (context === undefined) {
    throw new Error('usePhotos must be used within a PhotoProvider')
  }
  return context
}
