import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Heart, User, MapPin, Share2 } from 'lucide-react'
import { ReactNode } from 'react'

interface TopNavProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  showLoveButton?: boolean
  showMapButton?: boolean
  showProfileButton?: boolean
  showShareButton?: boolean
  onBack?: () => void
  className?: string
  // 新增：自定义中间内容（用于倒计时等）
  centerContent?: ReactNode
  // 新增：是否显示为主页样式
  variant?: 'default' | 'home'
}

export default function TopNav({
  title,
  subtitle,
  showBackButton = true,
  showHomeButton = false,
  showLoveButton = false,
  showMapButton = false,
  showProfileButton = false,
  showShareButton = true,
  onBack,
  className = '',
  centerContent,
  variant: _variant = 'default'
}: TopNavProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Back上一页
      navigate(-1)
    }
  }

  const handleShare = () => {
    alert('Sharing is coming soon.')
  }

  const handleHome = () => {
    navigate('/')
  }

  const handleLove = () => {
    navigate('/love-memories')
  }

  const handleMap = () => {
    navigate('/hotels')
  }

  const handleProfile = () => {
    navigate('/apps')
  }

  return (
    <div 
      data-top-nav
      className={className}
    >
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* 左侧圆形按钮 */}
        <div className="flex-shrink-0">
          {showBackButton ? (
            <div className="relative">
              <button
                onClick={handleBack}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 dark:bg-[#2C2C2E]/80 backdrop-blur-3xl hover:bg-white/20 dark:hover:bg-[#3A3A3C]/80 transition-all shadow-lg border border-white/20 dark:border-[#38383A] overflow-hidden"
              >
                {/* 内部光泽渐变 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 dark:opacity-30" />
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white relative z-10" />
              </button>
            </div>
          ) : showHomeButton ? (
            <div className="relative">
              <button
                onClick={handleHome}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 dark:bg-[#2C2C2E]/80 backdrop-blur-3xl hover:bg-white/20 dark:hover:bg-[#3A3A3C]/80 transition-all shadow-lg border border-white/20 dark:border-[#38383A] overflow-hidden"
              >
                {/* 内部光泽渐变 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 dark:opacity-30" />
                <Home className="h-5 w-5 text-gray-900 dark:text-white relative z-10" />
              </button>
            </div>
          ) : (
            <div className="w-12 h-12"></div>
          )}
        </div>

        {/* 中间椭圆形区域 - 支持自定义内容或标题 */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <div className="relative bg-white/10 dark:bg-[#2C2C2E]/80 backdrop-blur-3xl rounded-full px-6 py-2 shadow-lg border border-white/20 dark:border-[#38383A] h-12 flex items-center overflow-hidden">
              {/* 内部光泽渐变 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 dark:opacity-30" />
              
              {/* 底部光泽线 */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-[#8E8E93]/40 to-transparent" />
              
              <div className="text-center w-full relative z-10">
                {centerContent ? (
                  // 自定义内容（如倒计时）
                  centerContent
                ) : (
                  // 默认标题显示
                  <>
                    <h2 className="text-gray-900 dark:text-white font-semibold text-base leading-tight truncate">{title}</h2>
                    {subtitle && (
                      <p className="text-gray-500 dark:text-[#8E8E93] text-xs leading-tight truncate">{subtitle}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧圆形按钮 */}
        <div className="flex-shrink-0">
          {showLoveButton ? (
            <div className="relative">
              <button
                onClick={handleLove}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 dark:bg-[#2C2C2E]/80 backdrop-blur-3xl hover:bg-white/20 dark:hover:bg-[#3A3A3C]/80 transition-all shadow-lg border border-white/20 dark:border-[#38383A] overflow-hidden"
              >
                {/* 内部光泽渐变 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 dark:opacity-30" />
                <Heart className="h-5 w-5 text-gray-900 dark:text-white relative z-10" />
              </button>
            </div>
          ) : showMapButton ? (
            <div className="relative">
              <button
                onClick={handleMap}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 dark:bg-[#2C2C2E]/80 backdrop-blur-3xl hover:bg-white/20 dark:hover:bg-[#3A3A3C]/80 transition-all shadow-lg border border-white/20 dark:border-[#38383A] overflow-hidden"
              >
                {/* 内部光泽渐变 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 dark:opacity-30" />
                <MapPin className="h-5 w-5 text-gray-900 dark:text-white relative z-10" />
              </button>
            </div>
          ) : showProfileButton ? (
            <div className="relative">
              <button
                onClick={handleProfile}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 dark:bg-[#2C2C2E]/80 backdrop-blur-3xl hover:bg-white/20 dark:hover:bg-[#3A3A3C]/80 transition-all shadow-lg border border-white/20 dark:border-[#38383A] overflow-hidden"
              >
                {/* 内部光泽渐变 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 dark:opacity-30" />
                <User className="h-5 w-5 text-gray-900 dark:text-white relative z-10" />
              </button>
            </div>
          ) : showShareButton ? (
            <div className="relative">
              <button 
                onClick={handleShare}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 dark:bg-[#2C2C2E]/80 backdrop-blur-3xl hover:bg-white/20 dark:hover:bg-[#3A3A3C]/80 transition-all shadow-lg border border-white/20 dark:border-[#38383A] overflow-hidden"
              >
                {/* 内部光泽渐变 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 dark:opacity-30" />
                <Share2 className="h-5 w-5 text-gray-900 dark:text-white relative z-10" />
              </button>
            </div>
          ) : (
            <div className="w-12 h-12"></div>
          )}
        </div>
      </div>
    </div>
  )
}
