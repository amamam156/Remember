import { Hotel } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { APP_CONFIG } from '../config'

interface HotelTimelineViewProps {
  hotels: Hotel[]
}

export default function HotelTimelineView({ hotels }: HotelTimelineViewProps) {
  const navigate = useNavigate()

  const handleHotelClick = (hotel: Hotel) => {
    // 导航到Stay details页面
    navigate(`/hotel/${hotel.id}`, { 
      state: { 
        hotel: hotel,
        from: 'hotels'
      } 
    })
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    // 直接从字符串提取日期部分: YYYY-MM-DD
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
    return { day, month, year }
  }

  // 获取地点显示文本
  const getLocationText = (hotel: Hotel) => {
    const name = hotel.city?.name || hotel.admin1?.name || hotel.country?.name
    if (name) return name
    return hotel.locationTxt || ''
  }

  return (
    <div className="space-y-6 timeline-view-container">
      {hotels.map((hotel) => {
        const { day, month, year } = formatDate(hotel.checkInDate)
        const locationText = getLocationText(hotel)
        // 获取Cover图片（第一张Stay photos）
        // 优先使用缩略图，提升列表加载速度
        const firstImage = hotel.hotelImages && hotel.hotelImages.length > 0
          ? hotel.hotelImages[0]
          : null
        const coverImage = firstImage
          ? (firstImage.imageUrl || firstImage.thumbnailUrl)
          : null
        
        return (
          <div 
            key={hotel.id}
            id={`hotel-${hotel.id}`}
            className="relative w-full h-64 sm:h-72 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
            onClick={() => handleHotelClick(hotel)}
          >
            {/* 背景图片 - 占满整个卡片 */}
            {coverImage ? (
              <img
                src={coverImage.startsWith('http') ? coverImage : `${APP_CONFIG.apiBaseUrl}${coverImage}`}
                alt={hotel.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // 如果图片加载失败，显示占位符
                  e.currentTarget.style.display = 'none'
                  const placeholder = e.currentTarget.nextElementSibling
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = 'block'
                  }
                }}
              />
            ) : null}
            <div 
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"
              style={{ display: coverImage ? 'none' : 'block' }}
            ></div>
            
            {/* 渐变遮罩 - 确保文字清晰可见 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* 日期 - 左上角，毛玻璃效果 */}
            <div className="absolute top-4 left-4 text-xs text-white font-medium drop-shadow-md bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
              {year}年{month}月{day}日
            </div>
            
            {/* Rating - 右上角，毛玻璃效果 */}
            {hotel.rating && (
              <div className="absolute top-4 right-4 text-xs text-white font-medium drop-shadow-md bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{hotel.rating}</span>
              </div>
            )}
            
            {/* 内容叠加层 */}
            <div className="relative h-full flex flex-col p-4">
              {/* 底部内容 */}
              <div className="mt-auto flex items-center justify-between gap-4">
                {/* 标题 */}
                <h3 className="text-lg sm:text-xl font-semibold text-white drop-shadow-lg flex-1 min-w-0">
                  {hotel.name}
                </h3>
                
                {/* Location - 右侧对齐 */}
                {locationText && (
                  <div className="bg-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg flex-shrink-0">
                    {locationText}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

