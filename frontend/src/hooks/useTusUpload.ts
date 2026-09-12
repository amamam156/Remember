import { useState, useCallback } from 'react'
import { Photo } from '../contexts/PhotoContext'
import { APP_CONFIG } from '../config'

const API_BASE_URL = APP_CONFIG.apiBaseUrl

export interface UploadProgress {
  id?: string
  file?: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  photo?: Photo
  isEditImage?: boolean
  preview?: string
  imageUrl?: string // 上传成功后的图片URL
  memoryInfo?: {
    theme: string
    description: string
    tag: string
    location: string
    date: string
  }
}

// 使用XMLHttpRequest上传文件并跟踪进度
const uploadFileWithProgress = (
  file: File,
  onProgress: (progress: number) => void,
  onComplete: (imageUrl: string) => void,
  onError: (error: string) => void
): void => {
  const formData = new FormData()
  formData.append('image', file)

  const xhr = new XMLHttpRequest()

  // 监听上传进度
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percentComplete = Math.round((e.loaded / e.total) * 100)
      onProgress(percentComplete)
    }
  })

  // 监听上传完成
  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      try {
        const result = JSON.parse(xhr.responseText)
        if (result.success && result.data?.imageUrl) {
          onComplete(result.data.imageUrl)
        } else {
          onError(result.message || '上传失败')
        }
      } catch (error) {
        onError('解析响应失败')
      }
    } else if (xhr.status === 401 || xhr.status === 403) {
      // 认证失败
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else {
      onError(`上传失败: HTTP ${xhr.status}`)
    }
  })

  // 监听上传错误
  xhr.addEventListener('error', () => {
    onError('网络错误，上传失败')
  })

  // 监听上传中断
  xhr.addEventListener('abort', () => {
    onError('上传已取消')
  })

  // 设置请求头并发送
  const token = localStorage.getItem('token')
  xhr.open('POST', `${API_BASE_URL}/api/upload`)
  if (token) {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
  }
  xhr.send(formData)
}

export function useTusUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const addFiles = useCallback((files: File[], memoryInfo?: UploadProgress['memoryInfo']) => {
    console.log('addFiles被调用，文件数量:', files.length)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    console.log('过滤后的图片文件数量:', imageFiles.length)
    
    if (imageFiles.length === 0) {
      throw new Error('请选择图片文件')
    }

    const newUploads: UploadProgress[] = imageFiles.map(file => ({
      id: `new-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      preview: URL.createObjectURL(file),
      memoryInfo
    }))

    console.log('创建的新uploads:', newUploads)
    setUploads(prev => {
      const updated = [...prev, ...newUploads]
      console.log('更新后的uploads状态:', updated)
      return updated
    })
    return newUploads
  }, [])

  const uploadFile = useCallback(async (upload: UploadProgress): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!upload.file) {
        reject(new Error('没有文件'))
        return
      }

      // 更新状态为上传中
      setUploads(prev => prev.map(u => 
        u.file === upload.file 
          ? { ...u, status: 'uploading' as const, progress: 0 }
          : u
      ))

      uploadFileWithProgress(
        upload.file,
        // 进度回调
        (progress) => {
          setUploads(prev => prev.map(u => 
            u.file === upload.file 
              ? { ...u, progress }
              : u
          ))
        },
        // 完成回调
        (imageUrl) => {
          setUploads(prev => prev.map(u => 
            u.file === upload.file 
              ? { 
                  ...u, 
                  status: 'completed' as const,
                  progress: 100,
                  imageUrl
                }
              : u
          ))
          resolve(imageUrl)
        },
        // 错误回调
        (error) => {
          setUploads(prev => prev.map(u => 
            u.file === upload.file 
              ? { 
                  ...u, 
                  status: 'error' as const, 
                  error
                }
              : u
          ))
          reject(new Error(error))
        }
      )
    })
  }, [])

  const uploadFiles = useCallback(async (files: File[], memoryInfo?: UploadProgress['memoryInfo']) => {
    setIsUploading(true)
    
    try {
      // 直接处理文件，不添加到uploads状态
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      
      if (imageFiles.length === 0) {
        throw new Error('请选择图片文件')
      }
      
      // 创建临时的Photo对象，用于本地显示
      // 这些对象不会被发送到后端，只是用于前端状态管理
      const tempPhotos: any[] = imageFiles.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        originalUrl: URL.createObjectURL(file), // 使用临时URL用于预览
        thumbnailUrl: URL.createObjectURL(file),
        mediumUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'user',
        size: file.size,
        width: 800,
        height: 600,
        // 添加回忆信息
        title: memoryInfo?.theme || '',
        description: memoryInfo?.description || '',
        tag: memoryInfo?.tag || '',
        location: memoryInfo?.location || '',
        date: memoryInfo?.date || new Date().toISOString().split('T')[0],
      }))
      
      console.log('创建临时照片数据用于预览:', tempPhotos)

      return {
        successful: tempPhotos,
        failed: 0
      }
    } finally {
      setIsUploading(false)
    }
  }, [addFiles])

  const removeUpload = useCallback((file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file))
  }, [])

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'completed'))
  }, [])

  const retryUpload = useCallback(async (file: File) => {
    const upload = uploads.find(u => u.file === file)
    if (upload && upload.status === 'error') {
      await uploadFile(upload)
    }
  }, [uploads, uploadFile])

  // 批量上传所有待上传的文件
  const uploadAllFiles = useCallback(async (): Promise<string[]> => {
    setIsUploading(true)
    const imageUrls: string[] = []
    
    try {
      // 只上传状态为 pending 或 error 的文件
      const filesToUpload = uploads.filter(u => 
        u.file && (u.status === 'pending' || u.status === 'error')
      )
      
      for (const upload of filesToUpload) {
        try {
          const imageUrl = await uploadFile(upload)
          imageUrls.push(imageUrl)
        } catch (error) {
          console.error('上传文件失败:', error)
          // 继续上传其他文件
        }
      }
      
      return imageUrls
    } finally {
      setIsUploading(false)
    }
  }, [uploads, uploadFile])

  return {
    uploads,
    isUploading,
    addFiles,
    uploadFile,
    uploadFiles,
    uploadAllFiles,
    removeUpload,
    clearCompleted,
    retryUpload,
    setUploads
  }
}
