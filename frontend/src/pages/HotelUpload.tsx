import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGeoData } from '../hooks/useGeoData'
import { api } from '../services/api'
import LocationSelector from '../components/LocationSelector'
import { Calendar, Camera, CheckCircle, Star, CreditCard } from 'lucide-react'
import { APP_CONFIG } from '../config'
import { emitDataRefresh, DATA_REFRESH_EVENTS } from '../utils/dataEvents'

const API_BASE_URL = APP_CONFIG.apiBaseUrl

// 编辑数据接口
interface EditHotelData {
  id: string
  name: string
  checkInDate: string
  checkOutDate?: string
  countryId?: string
  admin1Id?: string
  cityId?: string
  notes?: string
  rating?: number
  hotelImages?: string[]
  roomCardImages?: string[]
}

export default function HotelUpload() {
  const { countries, admin1s, cities, loadAdmin1s, loadCities, clearAdmin1s, clearCities } = useGeoData()
  const hotelFileInputRef = useRef<HTMLInputElement>(null)
  const roomCardFileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  
  // 酒店表单数据
  const [name, setName] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [editData, setEditData] = useState<EditHotelData | null>(null)
  const [createdHotelId, setCreatedHotelId] = useState<string | null>(null)
  
  // 地理选择状态
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedAdmin1, setSelectedAdmin1] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  
  // 图片分类：Room key photos和Stay photos
  const [roomCardUploads, setRoomCardUploads] = useState<Array<{ id?: string; file: File | null; preview: string; progress: number; status: 'uploading' | 'completed' | 'error'; error: string | null; isEditImage?: boolean }>>([])
  const [hotelUploads, setHotelUploads] = useState<Array<{ id?: string; file: File | null; preview: string; progress: number; status: 'uploading' | 'completed' | 'error'; error: string | null; isEditImage?: boolean }>>([])
  
  // 拖拽排序相关状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedType, setDraggedType] = useState<'roomCard' | 'hotel' | null>(null)

  // 初始化日期和编辑模式数据回填
  // 当国家或省份改变时，自动加载City数据
  useEffect(() => {
    if (selectedCountry && selectedAdmin1) {
      loadCities(selectedCountry, selectedAdmin1)
    } else {
      clearCities()
    }
  }, [selectedCountry, selectedAdmin1, loadCities, clearCities])

  useEffect(() => {
    if (isEditMode) {
      const editDataStr = localStorage.getItem('editHotel')
      if (editDataStr) {
        try {
          const data = JSON.parse(editDataStr)
          setEditData(data)
          setName(data.name || '')
          setCheckInDate(data.checkInDate?.split('T')[0] || '')
          setCheckOutDate(data.checkOutDate?.split('T')[0] || '')
          setNotes(data.notes || '')
          setRating(data.rating)
          
          if (data.countryId) {
            setSelectedCountry(data.countryId)
            loadAdmin1s(data.countryId)
          }
          if (data.admin1Id) {
            setSelectedAdmin1(data.admin1Id)
            if (data.countryId) {
              loadCities(data.countryId, data.admin1Id)
            }
          }
          if (data.cityId) {
            setSelectedCity(data.cityId)
          }
          
          if (data.roomCardImages && data.roomCardImages.length > 0) {
            const previewImages = data.roomCardImages.map((imageUrl: string, index: number) => ({
              id: `edit-roomCard-${index}`,
              file: null as File | null,
              preview: imageUrl,
              progress: 100,
              status: 'completed' as const,
              error: null,
              isEditImage: true
            }))
            setRoomCardUploads(previewImages)
          }
          
          if (data.hotelImages && data.hotelImages.length > 0) {
            const previewImages = data.hotelImages.map((imageUrl: string, index: number) => ({
              id: `edit-hotel-${index}`,
              file: null as File | null,
              preview: imageUrl,
              progress: 100,
              status: 'completed' as const,
              error: null,
              isEditImage: true
            }))
            setHotelUploads(previewImages)
          }
        } catch (error) {
          console.error('加载编辑数据失败:', error)
        }
      }
    } else {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      setCheckInDate(`${year}-${month}-${day}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode])

  const handleRoomCardFiles = async (files: File[]) => {
    const newUploads = files.map(file => ({
      id: undefined,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'completed' as const, // 改为 'completed' 表示文件已选择，待上传
      error: null
    }))
    setRoomCardUploads([...roomCardUploads, ...newUploads])
  }

  const handleHotelFiles = async (files: File[]) => {
    const newUploads = files.map(file => ({
      id: undefined,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'completed' as const, // 改为 'completed' 表示文件已选择，待上传
      error: null
    }))
    setHotelUploads([...hotelUploads, ...newUploads])
  }

  // 图片拖拽排序处理函数
  const handleImageDragStart = (e: React.DragEvent, index: number, type: 'roomCard' | 'hotel') => {
    setDraggedIndex(index)
    setDraggedType(type)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = (e: React.DragEvent, index: number, type: 'roomCard' | 'hotel') => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedIndex !== null && draggedIndex !== index && draggedType === type) {
      setDragOverIndex(index)
    }
  }

  const handleImageDrop = (e: React.DragEvent, dropIndex: number, type: 'roomCard' | 'hotel') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedIndex === null || draggedType !== type || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      setDraggedType(null)
      return
    }

    if (type === 'roomCard') {
      const newUploads = [...roomCardUploads]
      const draggedItem = newUploads[draggedIndex]
      newUploads.splice(draggedIndex, 1)
      newUploads.splice(dropIndex, 0, draggedItem)
      setRoomCardUploads(newUploads)
    } else {
      const newUploads = [...hotelUploads]
      const draggedItem = newUploads[draggedIndex]
      newUploads.splice(draggedIndex, 1)
      newUploads.splice(dropIndex, 0, draggedItem)
      setHotelUploads(newUploads)
    }
    
    setDraggedIndex(null)
    setDragOverIndex(null)
    setDraggedType(null)
  }

  const handleImageDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    setDraggedType(null)
  }

  // 保存酒店
  const handleSaveHotel = async () => {
    if (!name.trim()) {
      alert('请输入Stay name')
      return
    }
    if (!checkInDate) {
      alert('请选择Check-in')
      return
    }
    if (!selectedCountry) {
      alert('Choose a country')
      return
    }
    if (roomCardUploads.length === 0 && hotelUploads.length === 0) {
      alert('请至少上传一张图片')
      return
    }

    try {
      // 上传图片
      const roomCardImageUrls: string[] = []
      const hotelImageUrls: string[] = []
      
      // 处理Room key photos
      for (const upload of roomCardUploads) {
        if (upload.isEditImage && upload.preview) {
          roomCardImageUrls.push(upload.preview)
        } else if (upload.file) {
          try {
            const formData = new FormData()
            formData.append('image', upload.file)
            const token = localStorage.getItem('token')
            
            // 构建完整的上传URL（支持相对路径和绝对路径）
            const uploadUrl = API_BASE_URL ? `${API_BASE_URL}/api/upload` : '/api/upload'
            console.log('上传Room key photos到:', uploadUrl, '文件大小:', upload.file.size, 'bytes')
            
            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: formData,
            })
            
            if (!response.ok) {
              // 处理认证失败
              if (response.status === 401 || response.status === 403) {
                console.warn('🔐 认证失败，跳转登录页')
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                window.location.href = '/login'
                return
              }
              throw new Error(`上传失败: ${response.status}`)
            }
            
            const result = await response.json()
            if (result.success) {
              roomCardImageUrls.push(result.data.imageUrl)
            }
          } catch (error) {
            console.error('上传Room key photos失败:', error)
            const errorMsg = error instanceof Error ? error.message : '未知错误'
            alert(`Room key photos上传失败: ${errorMsg}\n请检查网络连接或图片大小`)
            return
          }
        }
      }
      
      // 处理Stay photos
      for (const upload of hotelUploads) {
        if (upload.isEditImage && upload.preview) {
          hotelImageUrls.push(upload.preview)
        } else if (upload.file) {
          try {
            const formData = new FormData()
            formData.append('image', upload.file)
            const token = localStorage.getItem('token')
            
            // 构建完整的上传URL（支持相对路径和绝对路径）
            const uploadUrl = API_BASE_URL ? `${API_BASE_URL}/api/upload` : '/api/upload'
            console.log('上传Stay photos到:', uploadUrl, '文件大小:', upload.file.size, 'bytes')
            
            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: formData,
            })
            
            if (!response.ok) {
              // 处理认证失败
              if (response.status === 401 || response.status === 403) {
                console.warn('🔐 认证失败，跳转登录页')
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                window.location.href = '/login'
                return
              }
              const errorText = await response.text()
              throw new Error(`上传失败 (${response.status}): ${errorText}`)
            }
            
            const result = await response.json()
            if (result.success) {
              hotelImageUrls.push(result.data.imageUrl)
            } else {
              throw new Error(result.message || '上传失败')
            }
          } catch (error) {
            console.error('上传Stay photos失败:', error)
            const errorMsg = error instanceof Error ? error.message : '未知错误'
            alert(`Stay photos上传失败: ${errorMsg}\n请检查网络连接或图片大小`)
            return
          }
        }
      }
      
      const hotelData: any = {
        name: name.trim(),
        checkInDate: checkInDate,
        checkOutDate: checkOutDate || undefined,
        countryId: selectedCountry,
        admin1Id: selectedAdmin1 || undefined,
        cityId: selectedCity || undefined,
        notes: notes || undefined,
        rating: rating || undefined,
        roomCardImages: roomCardImageUrls,
        hotelImages: hotelImageUrls
      }
      
      if (isEditMode && editData?.id) {
        await api.updateHotel(editData.id, hotelData)
        localStorage.removeItem('editHotel')
        
        // 发送数据变化事件
        emitDataRefresh(DATA_REFRESH_EVENTS.HOTELS_CHANGED)
        
        navigate('/hotels')
      } else {
        const result = await api.createHotel(hotelData)
        console.log('酒店创建成功', result)
        
        // 保存新创建的酒店ID
        if (result && result.data && result.data.id) {
          setCreatedHotelId(result.data.id)
        }
        
        // 发送数据变化事件
        emitDataRefresh(DATA_REFRESH_EVENTS.HOTELS_CHANGED)
        setName('')
        setCheckInDate('')
        setCheckOutDate('')
        setNotes('')
        setRating(undefined)
        setRoomCardUploads([])
        setHotelUploads([])
        setSelectedCountry('')
        setSelectedAdmin1('')
        setSelectedCity('')
        clearAdmin1s()
        clearCities()
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('Unable to save. Please try again.')
    }
  }

  return (
    <div>
      <div className="p-4">
        <div className="memory-card">
          {/* Stay name */}
          <div className="theme-section">
            <label className="theme-label">Stay name<span className="text-red-500 ml-1">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a stay name..."
              className="theme-input"
            />
          </div>

          {/* 日期选择 */}
          <div className="time-section">
            <label className="time-label">Check-in<span className="text-red-500 ml-1">*</span></label>
            <div className="time-picker">
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="time-input"
              />
              <Calendar className="h-5 w-5 text-gray-500 dark:text-[#8E8E93]" />
            </div>
          </div>

          <div className="time-section">
            <label className="time-label">Check-out</label>
            <div className="time-picker">
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate}
                className="time-input"
              />
              <Calendar className="h-5 w-5 text-gray-500 dark:text-[#8E8E93]" />
            </div>
          </div>

          {/* 地点选择 */}
          <div className="bottom-info mb-6">
            <LocationSelector
              countries={countries}
              admin1s={admin1s}
              cities={cities}
              selectedCountry={selectedCountry}
              selectedAdmin1={selectedAdmin1}
              selectedCity={selectedCity}
              onCountryChange={(countryId) => {
                setSelectedCountry(countryId)
                setSelectedAdmin1('')
                setSelectedCity('')
                clearAdmin1s()
                clearCities()
                if (countryId) {
                  loadAdmin1s(countryId)
                }
              }}
              onAdmin1Change={(admin1Id) => {
                setSelectedAdmin1(admin1Id)
                setSelectedCity('')
                clearCities()
              }}
              onCityChange={setSelectedCity}
              required={true}
            />
          </div>

          {/* Room key photos上传 */}
          <div className="image-section">
            <div className="flex items-center justify-between mb-2">
              <label className="image-label">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Room key photos
              </label>
              {roomCardUploads.length > 0 && (
                <span className="text-sm text-gray-500 dark:text-[#8E8E93]">Selected {roomCardUploads.length} images</span>
              )}
            </div>
            <div className="image-upload-area">
              <div 
                className="upload-placeholder"
                onClick={() => roomCardFileInputRef.current?.click()}
              >
                <Camera className="h-8 w-8 text-gray-500 dark:text-[#8E8E93] mb-2" />
                <span className="upload-text">Add room key photos</span>
              </div>
              
              {roomCardUploads.map((upload, index) => {
                const uniqueKey = upload.id || upload.preview || (upload.file?.name || '') || `roomCard-${index}`
                return (
                  <div 
                    key={uniqueKey} 
                    className={`image-preview ${draggedIndex === index && draggedType === 'roomCard' ? 'dragging' : ''} ${dragOverIndex === index && draggedType === 'roomCard' ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, index, 'roomCard')}
                    onDragOver={(e) => handleImageDragOver(e, index, 'roomCard')}
                    onDrop={(e) => handleImageDrop(e, index, 'roomCard')}
                    onDragEnd={handleImageDragEnd}
                    style={{ cursor: 'grab' }}
                  >
                    <img
                      src={upload.preview || (upload.file ? URL.createObjectURL(upload.file) : '')}
                      alt="Room key preview"
                      className="preview-image"
                      draggable={false}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setRoomCardUploads(roomCardUploads.filter((_, i) => i !== index))
                      }}
                      className="delete-btn"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              
              <input
                ref={roomCardFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleRoomCardFiles(Array.from(e.target.files))
                  }
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Stay photos上传 */}
          <div className="image-section">
            <div className="flex items-center justify-between mb-2">
              <label className="image-label">
                <Camera className="h-4 w-4 inline mr-1" />
                Stay photos<span className="text-red-500 ml-1">*</span>
              </label>
              {hotelUploads.length > 0 && (
                <span className="text-sm text-gray-500 dark:text-[#8E8E93]">Selected {hotelUploads.length} images</span>
              )}
            </div>
            <div className="image-upload-area">
              <div 
                className="upload-placeholder"
                onClick={() => hotelFileInputRef.current?.click()}
              >
                <Camera className="h-8 w-8 text-gray-500 dark:text-[#8E8E93] mb-2" />
                <span className="upload-text">Add stay photos</span>
              </div>
              
              {hotelUploads.map((upload, index) => {
                const uniqueKey = upload.id || upload.preview || (upload.file?.name || '') || `hotel-${index}`
                return (
                  <div 
                    key={uniqueKey} 
                    className={`image-preview ${draggedIndex === index && draggedType === 'hotel' ? 'dragging' : ''} ${dragOverIndex === index && draggedType === 'hotel' ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, index, 'hotel')}
                    onDragOver={(e) => handleImageDragOver(e, index, 'hotel')}
                    onDrop={(e) => handleImageDrop(e, index, 'hotel')}
                    onDragEnd={handleImageDragEnd}
                    style={{ cursor: 'grab' }}
                  >
                    {index === 0 && <div className="cover-badge">Cover</div>}
                    <img
                      src={upload.preview || (upload.file ? URL.createObjectURL(upload.file) : '')}
                      alt="Stay preview"
                      className="preview-image"
                      draggable={false}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setHotelUploads(hotelUploads.filter((_, i) => i !== index))
                      }}
                      className="delete-btn"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              
              <input
                ref={hotelFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleHotelFiles(Array.from(e.target.files))
                  }
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Rating */}
          <div className="theme-section">
            <label className="theme-label">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star === rating ? undefined : star)}
                  className={`p-2 rounded-lg transition-colors ${
                    star <= (rating || 0)
                      ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                      : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500'
                  }`}
                >
                  <Star className={`h-6 w-6 ${star <= (rating || 0) ? 'fill-current' : ''}`} />
                </button>
              ))}
              {rating && (
                <span className="text-sm text-gray-500 dark:text-[#8E8E93] ml-2">{rating} stars</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="theme-section">
            <label className="theme-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="theme-input"
              rows={4}
            />
          </div>
        </div>

        <div className="save-section" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
          <button 
            className="save-btn"
            onClick={handleSaveHotel}
          >
            {isEditMode ? '更新酒店' : '保存酒店'}
          </button>
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-8 mx-4 max-w-sm w-full text-center border border-white/20 dark:border-[#38383A]">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Stay saved!</h3>
              <p className="text-gray-600 dark:text-[#8E8E93] mb-6">Your stay has been saved.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    // 如果有创建的酒店ID，带上scrollTo参数
                    if (createdHotelId) {
                      navigate(`/hotels?scrollTo=${createdHotelId}`)
                    } else {
                      navigate('/hotels')
                    }
                  }}
                  className="flex-1 bg-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-pink-600 transition-colors"
                >
                  View list
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-[#8E8E93] py-3 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors"
                >
                  Add another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
