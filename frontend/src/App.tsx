import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PhotoProvider } from './contexts/PhotoContext'
import Login from './pages/Login'
import Album from './pages/Album'
import Add from './pages/Add'
import Upload from './pages/Upload'
import MemoryDetail from './pages/MemoryDetail'
import LoveMemories from './pages/LoveMemories'
import Hotels from './pages/Hotels'
import HotelUpload from './pages/HotelUpload'
import HotelDetail from './pages/HotelDetail'
import HardTimes from './pages/HardTimes'
import LocationManagement from './pages/LocationManagement'
import JohnsonCall from './pages/JohnsonCall'
import ProtectedRoute from './components/ProtectedRoute'
import TopNav from './components/TopNav'
import TabBar from './components/TabBar'

import { useState, useEffect } from 'react'
// 移除了先前的倒计时组件

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showLoveMemoriesBack, setShowLoveMemoriesBack] = useState(false)
  
  // 所有 hooks 必须在条件Back之前调用
  // 监听Memory map页面的Back按钮状态变化
  useEffect(() => {
    const handleShowBack = ((e: CustomEvent) => {
      // 使用 queueMicrotask 确保在当前渲染周期后更新状态
      queueMicrotask(() => {
        setShowLoveMemoriesBack(e.detail.show)
      })
    }) as EventListener
    
    window.addEventListener('love-memories-show-back', handleShowBack)
    return () => {
      window.removeEventListener('love-memories-show-back', handleShowBack)
    }
  }, [])
  
  // 重置Memory mapBack按钮状态（当离开该页面时）
  useEffect(() => {
    if (location.pathname !== '/love-memories') {
      setShowLoveMemoriesBack(false)
    }
  }, [location.pathname])
  
  const isLoginPage = location.pathname === '/login'
  
  // 登录页单独渲染，不使用App壳结构
  if (isLoginPage) {
    return <Login />
  }
  
  // 判断当前页面是否需要显示TopNav
  const needsTopNav = () => {
    // Album页面不需要默认TopNav
    if (location.pathname === '/') return 'none'
    // Memory map页面使用沉浸式设计，不需要默认TopNav
    if (location.pathname === '/love-memories') return 'none'
    // MemoryDetail自己有沉浸式交互，隐藏系统顶部栏
    if (location.pathname.startsWith('/memory/')) return 'none'
    // 上传页面现在是沉浸式全屏，隐藏系统顶部栏
    if (location.pathname === '/upload') return 'none'
    // Hard Times页面使用沉浸式设计，不需要默认TopNav
    if (location.pathname === '/apps/hard-times') return 'none'
    // Locations页面使用自定义导航，隐藏默认TopNav
    if (location.pathname === '/location-management') return 'none'
    if (location.pathname === '/johnson') return 'none'
    // 所有其他页面使用默认TopNav
    return 'default'
  }
  
  // TabBar 显示判定
  const shouldShowTabBar = () => {
     if (location.state?.backgroundLocation) return false;
     if (location.pathname === '/upload') return false;
     if (location.pathname.startsWith('/memory/')) return false;
     if (location.pathname.startsWith('/hotel/')) return false;
     if (location.pathname === '/apps/hard-times') return false;
     if (location.pathname === '/location-management') return false;
     if (location.pathname === '/johnson') return false;
     return true;
  }
  
  // 获取当前页面的标题
  const getPageTitle = () => {
    const searchParams = new URLSearchParams(location.search)
    const isEdit = searchParams.get('edit') === 'true'
    
    if (location.pathname === '/upload') return isEdit ? 'Edit memory' : 'Add memory'
    if (location.pathname === '/hotel/upload') return isEdit ? 'Edit stay' : 'Add stay'
    if (location.pathname.startsWith('/memory/')) return 'Memory details'
    if (location.pathname.startsWith('/hotel/')) return 'Stay details'
    if (location.pathname === '/hotels') return 'Stays'
    if (location.pathname === '/love-memories') return 'Memory map'
    if (location.pathname === '/apps') return 'Apps'
    if (location.pathname === '/add') return 'Add'

    if (location.pathname === '/apps/hard-times') return 'Hard Times'
    if (location.pathname === '/location-management') return 'Locations'
    return ''
  }
  
  // 判断是否需要显示Back按钮
  const shouldShowBackButton = () => {
    // Memory map页面的Back按钮动态显示
    if (location.pathname === '/love-memories') return showLoveMemoriesBack
    // 详情页、上传页、子Apps页面都显示Back按钮
    if (location.pathname === '/upload') return true
    if (location.pathname === '/hotel/upload') return true
    if (location.pathname.startsWith('/memory/')) return true
    if (location.pathname.startsWith('/hotel/') && location.pathname !== '/hotels') return true
    if (location.pathname.startsWith('/apps/')) return true
    if (location.pathname === '/location-management') return true
    return false
  }
  
  const topNavType = needsTopNav()
  
  // Extract backgroundLocation for shared element transitions over exist routes
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <div className="app-root">
      {/* 顶部导航：sticky定位，悬浮玻璃条（背景透明，内容可穿过） */}
      {topNavType === 'default' && (
        <div className="app-header bg-transparent">
          <TopNav 
            title={getPageTitle()}
            subtitle={location.pathname === '/love-memories' ? 'Every place has a story' : undefined}
            showBackButton={shouldShowBackButton()}
            showShareButton={false}
            onBack={() => {
              // Memory map页面的Back逻辑通过自定义事件触发
              if (location.pathname === '/love-memories') {
                window.dispatchEvent(new CustomEvent('love-memories-back'))
              } else if (location.pathname.startsWith('/memory/')) {
                // Memory details页面的Back逻辑通过自定义事件触发
                window.dispatchEvent(new CustomEvent('memory-detail-back'))
              } else {
                // 其他页面直接Back上一页
                navigate(-1)
              }
            }}
          />
        </div>
      )}
      
      {/* 中间内容：独立滚动，背景透明让内容穿过 */}
      <main className="app-main">
        <Routes location={backgroundLocation || location}>
          <Route path="/" element={<ProtectedRoute><Album /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><Add /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/memory/:id" element={<ProtectedRoute><MemoryDetail /></ProtectedRoute>} />
          <Route path="/love-memories" element={<ProtectedRoute><LoveMemories /></ProtectedRoute>} />
          <Route path="/hotels" element={<ProtectedRoute><Hotels /></ProtectedRoute>} />
          <Route path="/hotel/upload" element={<ProtectedRoute><HotelUpload /></ProtectedRoute>} />
          <Route path="/hotel/:id" element={<ProtectedRoute><HotelDetail /></ProtectedRoute>} />

          <Route path="/apps/hard-times" element={<ProtectedRoute><HardTimes /></ProtectedRoute>} />
          <Route path="/location-management" element={<ProtectedRoute><LocationManagement /></ProtectedRoute>} />
          <Route path="/johnson" element={<ProtectedRoute><JohnsonCall /></ProtectedRoute>} />
        </Routes>
      </main>
      
      {/* 底部标签栏：固定底部 */}
      {shouldShowTabBar() && (
        <footer className="app-tabbar transition-opacity duration-300">
          <TabBar />
        </footer>
      )}

      {/* Overlay Routes (Shared Element Transitions) - Rendered outside main to layer over TabBar */}
      {backgroundLocation && (
        <Routes>
           <Route path="/memory/:id" element={<ProtectedRoute><MemoryDetail /></ProtectedRoute>} />
        </Routes>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <PhotoProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </PhotoProvider>
    </AuthProvider>
  )
}

export default App
