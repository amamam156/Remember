import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { apiService } from '../services/api'
import { Hotel } from '../services/api'
import { ImagePreview } from '../components/ImagePreview'
import { APP_CONFIG } from '../config'
import { Camera, MapPin, Star, CreditCard } from 'lucide-react'
import { emitDataRefresh, DATA_REFRESH_EVENTS } from '../utils/dataEvents'

export default function HotelDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number>(0)
  
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(location.state?.hotel || null)
  const hasLoadedRef = useRef(false)


  useEffect(() => {
    // 滚动到顶部
    const scrollContainer = document.querySelector('.app-main') as HTMLElement
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
    
    hasLoadedRef.current = false
    
    const loadHotel = async () => {
      if (!id) return
      
      try {
        if (location.state?.hotel) {
          setSelectedHotel(location.state.hotel)
          hasLoadedRef.current = true
          return
        }
        
        const response = await apiService.getHotel(id)
        if (response.success && response.data) {
          setSelectedHotel(response.data)
          hasLoadedRef.current = true
        }
      } catch (error) {
        console.error('加载Stay details失败:', error)
      }
    }
    loadHotel()
  }, [id, location.state])


  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `${APP_CONFIG.apiBaseUrl}${url}`
  }

  // 获取所有图片URL数组
  const getAllImageUrls = (): string[] => {
    const allImages = [
      ...(selectedHotel?.roomCardImages || []),
      ...(selectedHotel?.hotelImages || [])
    ]
    return allImages.map(img => getImageUrl(img.imageUrl))
  }

  const handleImageClick = (imageUrl: string, index: number) => {
    setPreviewImage(imageUrl)
    setPreviewIndex(index)
  }

  const closePreview = () => {
    setPreviewImage(null)
    setPreviewIndex(0)
  }

  const nextImage = () => {
    const allImages = getAllImageUrls()
    if (allImages.length > 1) {
      const nextIndex = (previewIndex + 1) % allImages.length
      setPreviewIndex(nextIndex)
      setPreviewImage(allImages[nextIndex])
    }
  }

  const prevImage = () => {
    const allImages = getAllImageUrls()
    if (allImages.length > 1) {
      const prevIndex = previewIndex === 0 ? allImages.length - 1 : previewIndex - 1
      setPreviewIndex(prevIndex)
      setPreviewImage(allImages[prevIndex])
    }
  }

  const handleEdit = () => {
    if (selectedHotel) {
      const editData = {
        id: selectedHotel.id,
        name: selectedHotel.name || '',
        checkInDate: selectedHotel.checkInDate?.split('T')[0] || '',
        checkOutDate: selectedHotel.checkOutDate?.split('T')[0] || '',
        notes: selectedHotel.notes || '',
        rating: selectedHotel.rating,
        countryId: selectedHotel.countryId || '',
        admin1Id: selectedHotel.admin1Id || '',
        cityId: selectedHotel.cityId || '',
        roomCardImages: selectedHotel.roomCardImages?.map(img => img.imageUrl) || [],
        hotelImages: selectedHotel.hotelImages?.map(img => img.imageUrl) || []
      }
      
      localStorage.setItem('editHotel', JSON.stringify(editData))
      navigate('/hotel/upload?edit=true')
    }
  }

  const handleDelete = async () => {
    if (selectedHotel && confirm('确定要删除这个Stays吗？删除后无法恢复。')) {
      try {
        await apiService.deleteHotel(selectedHotel.id)
        
        // 触发数据刷新事件
        emitDataRefresh(DATA_REFRESH_EVENTS.HOTELS_CHANGED)
        
        navigate('/hotels')
      } catch (error) {
        console.error('Delete stay失败:', error)
        alert('Unable to delete. Please try again.')
      }
    }
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
    return { day, month, year }
  }

  const getLocationText = (hotel: Hotel) => {
    const parts = []
    if (hotel.country?.name) parts.push(hotel.country.name)
    if (hotel.admin1?.name) parts.push(hotel.admin1.name)
    if (hotel.city?.name) parts.push(hotel.city.name)
    
    if (parts.length > 0) return parts.join(' · ')
    return hotel.locationTxt || ''
  }

  if (!selectedHotel) {
    return (
      <div>
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-[#8E8E93]">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  const { day: checkInDay, month: checkInMonth, year: checkInYear } = formatDate(selectedHotel.checkInDate)
  const locationText = getLocationText(selectedHotel)

  return (
    <div>
      <div className="p-4 space-y-4">
        {/* 酒店信息卡片 */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-white/20 dark:border-[#38383A]">
          {/* Stay name */}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{selectedHotel.name}</h1>

          {/* 日期信息 */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-600 dark:text-[#8E8E93]">
              <span className="text-sm font-medium mr-2">Check-in:</span>
              <span>{checkInMonth}/{checkInDay}/{checkInYear}</span>
            </div>
            {selectedHotel.checkOutDate && (() => {
              const { day, month, year } = formatDate(selectedHotel.checkOutDate)
              return (
                <div className="flex items-center text-gray-600 dark:text-[#8E8E93]">
                  <span className="text-sm font-medium mr-2">Check-out:</span>
                  <span>{month}/{day}/{year}</span>
                </div>
              )
            })()}
          </div>

          {/* 地点信息 */}
          <div className="flex items-center text-gray-600 dark:text-[#8E8E93] mb-4">
            <MapPin className="w-4 h-4 mr-2 text-gray-500 dark:text-[#8E8E93]" />
            <span>{locationText}</span>
          </div>

          {/* Rating */}
          {selectedHotel.rating && (
            <div className="flex items-center mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-[#8E8E93] mr-2">Rating:</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= selectedHotel.rating!
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-[#8E8E93]">{selectedHotel.rating} stars</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedHotel.notes && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-[#8E8E93] block mb-1">Notes:</span>
              <p className="text-gray-600 dark:text-[#8E8E93] text-sm whitespace-pre-wrap">{selectedHotel.notes}</p>
            </div>
          )}
        </div>

        {/* Room key photos */}
        {selectedHotel.roomCardImages && selectedHotel.roomCardImages.length > 0 && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-white/20 dark:border-[#38383A]">
            <div className="text-sm text-gray-500 dark:text-[#8E8E93] mb-4 flex items-center">
              <CreditCard className="w-4 h-4 mr-1" />
              Room keys {selectedHotel.roomCardImages.length > 1 ? `(${selectedHotel.roomCardImages.length})` : ''}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selectedHotel.roomCardImages.map((image, index) => {
                // 网格中使用缩略图，点击查看主图
                const thumbnailUrl = image.imageUrl 
                  ? getImageUrl(image.imageUrl) 
                  : getImageUrl(image.thumbnailUrl)
                
                return (
                  <div
                    key={image.id || index}
                    className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => handleImageClick(getImageUrl(image.imageUrl), index)}
                  >
                    <img
                      src={thumbnailUrl}
                      alt={`Room keys ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stay photos */}
        {selectedHotel.hotelImages && selectedHotel.hotelImages.length > 0 && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-white/20 dark:border-[#38383A]">
            <div className="text-sm text-gray-500 dark:text-[#8E8E93] mb-4 flex items-center">
              <Camera className="w-4 h-4 mr-1" />
              Photos {selectedHotel.hotelImages.length > 1 ? `(${selectedHotel.hotelImages.length})` : ''}
            </div>
            {selectedHotel.hotelImages.length > 1 ? (
              // 多图片显示
              <div className="grid grid-cols-2 gap-2">
                {selectedHotel.hotelImages.map((image, index) => {
                  // 网格中使用缩略图，点击查看主图
                  const thumbnailUrl = image.imageUrl 
                    ? getImageUrl(image.imageUrl) 
                    : getImageUrl(image.thumbnailUrl)
                  
                  return (
                    <div
                      key={image.id || index}
                      className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => handleImageClick(
                        getImageUrl(image.imageUrl),
                        (selectedHotel.roomCardImages?.length || 0) + index
                      )}
                    >
                      <img
                        src={thumbnailUrl}
                        alt={`Stay photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            ) : selectedHotel.hotelImages.length === 1 ? (
              // 单图片显示
              <div
                className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(
                  getImageUrl(selectedHotel.hotelImages[0].imageUrl),
                  selectedHotel.roomCardImages?.length || 0
                )}
              >
                <img
                  src={getImageUrl(selectedHotel.hotelImages[0].imageUrl)}
                  alt={selectedHotel.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              // 无图片
              <div className="text-center text-gray-400 dark:text-[#8E8E93]/70 py-8">No photos</div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="save-section" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
          <button 
            className="save-btn"
            onClick={handleEdit}
          >
            Edit stay
          </button>
          <button 
            className="save-btn"
            onClick={handleDelete}
            style={{ backgroundColor: '#ef4444' }}
          >
            Delete stay
          </button>
        </div>
      </div>

      {/* 图片Preview - 使用新组件 */}
      {previewImage && (
        <ImagePreview
          imageUrl={previewImage}
          images={getAllImageUrls()}
          currentIndex={previewIndex}
          onClose={closePreview}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </div>
  )
}
