import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Calendar, MapPin, Plus, Video } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const MENU_ITEMS = [
  {
    label: 'Call Johnson',
    sublabel: 'AI digital person · Demo',
    icon: Video,
    iconBg: 'bg-cyan-500',
    href: '/johnson',
  },
  {
    label: 'Add memory',
    sublabel: 'Save a new moment',
    icon: Plus,
    iconBg: 'bg-pink-500',
    href: '/upload',
  },
  {
    label: 'Hard Times',
    sublabel: 'Track time and ratings',
    icon: Calendar,
    iconBg: 'bg-purple-500',
    href: '/apps/hard-times',
  },
  {
    label: 'Locations',
    sublabel: 'Add and manage places',
    icon: MapPin,
    iconBg: 'bg-blue-500',
    href: '/location-management',
  },
]

export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isFeedActive = location.pathname === '/'
  const isMapActive = location.pathname === '/love-memories'

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handleOutside), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleOutside)
    }
  }, [menuOpen])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleItemClick = (href: string) => {
    setMenuOpen(false)
    setTimeout(() => navigate(href), 160)
  }

  return (
    <div className="w-full px-6 flex items-center justify-between pb-6 pt-2 pointer-events-none">

      {/* Menu Button + iOS-style unified popup */}
      <div ref={menuRef} className="relative pointer-events-auto">

        {/* === iOS-style single card popup === */}
        <div
          className="absolute bottom-full mb-3 left-0 w-60 rounded-[20px] overflow-hidden"
          style={{
            pointerEvents: menuOpen ? 'auto' : 'none',
            background: 'rgba(30, 30, 36, 0.92)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)',
            // Card-level spring: scale from bottom-left origin
            transformOrigin: 'bottom left',
            transform: menuOpen ? 'scale(1) translateY(0px)' : 'scale(0.7) translateY(12px)',
            opacity: menuOpen ? 1 : 0,
            transition: menuOpen
              ? 'transform 0.38s cubic-bezier(0.34, 1.36, 0.64, 1), opacity 0.2s ease'
              : 'transform 0.22s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease',
          }}
        >
          {MENU_ITEMS.map((item, i) => {
            const Icon = item.icon
            const isLast = i === MENU_ITEMS.length - 1

            // Per-item stagger (runs after card opens)
            const itemDelay = menuOpen ? `${i * 35}ms` : '0ms'

            return (
              <div key={item.href}>
                <button
                  onClick={() => handleItemClick(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-[13px] text-left active:bg-white/10 transition-colors duration-100"
                  style={{
                    opacity: menuOpen ? 1 : 0,
                    transform: menuOpen ? 'translateX(0)' : 'translateX(-8px)',
                    transition: `opacity 0.25s ease ${itemDelay}, transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) ${itemDelay}`,
                  }}
                >
                  {/* Icon badge */}
                  <div className={`w-8 h-8 rounded-[9px] ${item.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                  </div>

                  {/* Text */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-[14px] font-semibold leading-tight">{item.label}</span>
                    <span className="text-white/45 text-[11px] mt-[2px] leading-tight">{item.sublabel}</span>
                  </div>
                </button>

                {/* iOS-style hairline divider (not after last item) */}
                {!isLast && (
                  <div className="mx-4 h-[0.5px] bg-white/10" />
                )}
              </div>
            )
          })}
        </div>

        {/* The button itself — Menu ↔ X crossfade */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-[44px] h-[44px] rounded-full bg-[#2A2B31]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-[#3A3B41]/80 transition-colors shadow-lg relative overflow-hidden"
        >
          <Menu
            className="w-5 h-5 absolute transition-all duration-300"
            style={{
              opacity: menuOpen ? 0 : 1,
              transform: menuOpen ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
            }}
          />
          <X
            className="w-5 h-5 absolute transition-all duration-300"
            style={{
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
            }}
          />
        </button>
      </div>

      {/* Toggle Pill */}
      <div className="flex items-center h-[44px] bg-[#2A2B31]/80 backdrop-blur-xl border border-white/10 rounded-full p-1 pointer-events-auto shadow-lg">
        <button
          onClick={() => navigate('/love-memories')}
          className={`h-full px-6 rounded-full text-[13px] font-semibold transition-all duration-300 ${
            isMapActive ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => navigate('/')}
          className={`h-full px-6 rounded-full text-[13px] font-semibold transition-all duration-300 ${
            isFeedActive ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'
          }`}
        >
          Feed
        </button>
      </div>
    </div>
  )
}
