import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePhotos } from '../contexts/PhotoContext'
import { useTusUpload } from '../hooks/useTusUpload'
import { useMemories } from '../hooks/useMemories'
import { useGeoData } from '../hooks/useGeoData'
import { api } from '../services/api'
import LocationSelector from '../components/LocationSelector'
import TagSelector from '../components/TagSelector'
import { Calendar, CheckCircle, ChevronLeft, Plus, X, Image as ImageIcon } from 'lucide-react'
import { emitDataRefresh, DATA_REFRESH_EVENTS } from '../utils/dataEvents'
import { clearWorldMapCache, clearCountryMapCache, clearRegionMemoriesCache } from '../hooks/useMapData'

// --- Memoized Components ---

export default function Upload() {
  const { loadPhotos } = usePhotos()
  const { uploads, addFiles, removeUpload, setUploads, uploadAllFiles, isUploading } = useTusUpload()
  const { createMemory } = useMemories()
  const { countries, admin1s, cities, loadAdmin1s, loadCities, clearAdmin1s, clearCities } = useGeoData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdMemoryId, setCreatedMemoryId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 回忆表单数据
  const [selectedDate, setSelectedDate] = useState('')
  const [theme, setTheme] = useState('')
  const [selectedTagId, setSelectedTagId] = useState('')

  // 地理选择状态
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedAdmin1, setSelectedAdmin1] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')

  // 标签列表
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([])

  // 拖拽排序相关状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  // Preview索引和滑动手势
  const [activeIndex, setActiveIndex] = useState(0)
  const [gesture, setGesture] = useState({ x: 0, y: 0, scale: 1 })
  const [gestureAnimating, setGestureAnimating] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)
  const touchState = useRef({
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    lastCx: 0, lastCy: 0,
    startScale: 1,
    initialDistance: 0,
    isPinching: false,
    isPanning: false
  })

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
  }

  // 同步缩略图滚动位置
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      // +1 是因为第一个子元素是 "Plus" 按钮
      const activeElement = thumbnailContainerRef.current.children[activeIndex + 1] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeIndex])

  // 当uploads变化时，确保activeIndex在范围内
  useEffect(() => {
    if (uploads.length > 0 && activeIndex >= uploads.length) {
      setActiveIndex(uploads.length - 1)
    }
  }, [uploads, activeIndex])

  // 禁用浏览器系统手势干扰
  useEffect(() => {
    const doc = document.documentElement
    const originalTouchAction = doc.style.touchAction
    doc.style.touchAction = 'none'
    return () => {
      doc.style.touchAction = originalTouchAction
    }
  }, [])

  // 计算 UI 透明度（缩放时隐藏 UI）
  const uiOpacityClass = gesture.scale > 1.05 || isPinching
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100 pointer-events-auto'

  const handleTouchStart = (e: React.TouchEvent) => {
    setGestureAnimating(false)
    if (e.touches.length >= 2) {
      touchState.current.isPinching = true
      setIsPinching(true)
      touchState.current.isPanning = false
      touchState.current.initialDistance = getDistance(e.touches[0], e.touches[1])
      touchState.current.startScale = gesture.scale
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      touchState.current.startX = cx
      touchState.current.startY = cy
      touchState.current.lastCx = cx
      touchState.current.lastCy = cy
      touchState.current.lastX = gesture.x
      touchState.current.lastY = gesture.y
    } else if (e.touches.length === 1) {
      touchState.current.isPinching = false
      setIsPinching(false)
      touchState.current.isPanning = true
      touchState.current.startX = e.touches[0].clientX
      touchState.current.startY = e.touches[0].clientY
      touchState.current.lastX = gesture.x
      touchState.current.lastY = gesture.y
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length >= 2 && touchState.current.isPinching) {
      if (e.cancelable) e.preventDefault()
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const baseScale = touchState.current.startScale
      let newScale = baseScale * (currentDistance / touchState.current.initialDistance)
      newScale = Math.max(1, Math.min(newScale, 5))

      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const dx = cx - touchState.current.lastCx
      const dy = cy - touchState.current.lastCy
      touchState.current.lastCx = cx
      touchState.current.lastCy = cy

      setGesture(prev => {
        const scaleDiff = newScale / prev.scale
        const nextX = prev.x + (cx - window.innerWidth / 2 - prev.x) * (1 - scaleDiff) + dx
        const nextY = prev.y + (cy - window.innerHeight / 2 - prev.y) * (1 - scaleDiff) + dy
        return { ...prev, scale: newScale, x: nextX, y: nextY }
      })
    } else if (e.touches.length === 1 && touchState.current.isPanning) {
      const dx = e.touches[0].clientX - touchState.current.startX
      const dy = e.touches[0].clientY - touchState.current.startY

      if (gesture.scale > 1) {
        if (e.cancelable) e.preventDefault()
        setGesture(prev => ({
          ...prev,
          x: touchState.current.lastX + dx,
          y: touchState.current.lastY + dy
        }))
      } else {
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (absDx > absDy) {
          if (e.cancelable) e.preventDefault()
          setGesture(prev => ({ ...prev, x: dx, y: 0 }))
        }
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchState.current.isPinching = false
      setIsPinching(false)
      touchState.current.isPanning = true
      touchState.current.startX = e.touches[0].clientX
      touchState.current.startY = e.touches[0].clientY
      touchState.current.lastX = gesture.x
      touchState.current.lastY = gesture.y
      return
    }

    const dx = gesture.x
    const swipeThreshold = 50
    
    setGestureAnimating(true)
    if (gesture.scale <= 1) {
      if (dx > swipeThreshold && activeIndex > 0) {
        setActiveIndex(activeIndex - 1)
      } else if (dx < -swipeThreshold && activeIndex < uploads.length - 1) {
        setActiveIndex(activeIndex + 1)
      }
      setGesture({ x: 0, y: 0, scale: 1 })
    } else {
      // 缩放状态下的回弹逻辑可以在这里完善，目前保持当前位置
      // 如果缩放比例回到1，则重置位移
      if (gesture.scale <= 1.05) {
        setGesture({ x: 0, y: 0, scale: 1 })
      }
    }
  }

  // 获取标签列表
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagList = await api.getTags()
        setTags(tagList)
      } catch (error) {
        console.error('获取标签列表失败:', error)
      }
    }
    fetchTags()
  }, [])

  // 初始化日期
  useEffect(() => {
    // 设置默认日期
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    setSelectedDate(`${year}-${month}-${day}`)
  }, [])

  // 监听uploads状态变化
  useEffect(() => {
    console.log('uploads状态发生变化:', uploads)
  }, [uploads])

  // 当国家或省份改变时，自动加载City数据
  useEffect(() => {
    if (selectedCountry && selectedAdmin1) {
      loadCities(selectedCountry, selectedAdmin1)
    } else {
      clearCities()
    }
  }, [selectedCountry, selectedAdmin1, loadCities, clearCities])




  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files: File[]) => {
    try {
      console.log('选择的文件:', files)
      console.log('调用addFiles前的uploads状态:', uploads)
      // 只添加文件到上传列表，不立即处理
      const newUploads = addFiles(files)
      console.log('添加文件到上传列表:', newUploads)
      console.log('调用addFiles后的uploads状态:', uploads)
    } catch (error) {
      console.error('添加文件失败:', error)
      alert('Unable to add files. Please try again.')
    }
  }


  // 日期变化处理
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }

  // 主题输入处理
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.value)
  }

  // 保存回忆
  const handleSaveMemory = async () => {
    if (!theme.trim()) {
      alert('请输入回忆主题')
      return
    }
    if (!selectedCountry) {
      alert('Choose a country')
      return
    }
    if (!selectedTagId) {
      alert('Choose a tag')
      return
    }
    if (uploads.length === 0) {
      alert('Choose at least one photo')
      return
    }

    setIsSaving(true)
    try {
      console.log('开始保存回忆，文件数量:', uploads.length)

      // 上传图片 - 使用带进度的上传功能
      const imageUrls: string[] = []

      // 先收集已有的编辑图片 - 使用原始相对路径，不用带 host 的完整 URL
      for (const upload of uploads) {
        if (upload.isEditImage) {
          // 优先使用 imageUrl（原始相对路径），回落到 preview
          const rawUrl = (upload as any).imageUrl || upload.preview
          if (rawUrl) imageUrls.push(rawUrl)
        } else if (upload.imageUrl) {
          // 新上传完成的图片：使用已有的URL
          imageUrls.push(upload.imageUrl)
        }
      }

      // 批量上传待上传的新文件（带进度显示）
      try {
        const newImageUrls = await uploadAllFiles()
        imageUrls.push(...newImageUrls)
      } catch (error) {
        console.error('上传图片失败:', error)
        alert('Image upload failed. Please try again.')
        return
      }

      if (imageUrls.length === 0) {
        alert('Choose at least one photo')
        return
      }

      // 获取选中的标签Name
      const selectedTag = tags.find(t => t.id === selectedTagId)

      // 构建回忆数据
      const memoryData: any = {
        happenedAt: selectedDate || new Date().toISOString().split('T')[0], // 直接发送日期字符串 YYYY-MM-DD
        title: theme,
        topic: selectedTag?.name || '',  // 保存标签Name到topic字段
        countryId: selectedCountry,
        admin1Id: selectedAdmin1 || undefined,
        cityId: selectedCity || undefined,
        imageUrl: imageUrls, // 保存所有图片URL（可以是数组）
        tagIds: selectedTagId ? [selectedTagId] : [] // 保存标签ID到tagIds数组
      }

      // 新建模式：调用创建API
      const result = await createMemory(memoryData)
      console.log('回忆创建成功', result)

      // 保存新创建的回忆ID
      if (result && result.id) {
        setCreatedMemoryId(result.id)
      }

      // 清除地图缓存并发送事件
      clearWorldMapCache()
      clearCountryMapCache()
      clearRegionMemoriesCache()
      emitDataRefresh(DATA_REFRESH_EVENTS.MEMORIES_CHANGED)
      emitDataRefresh(DATA_REFRESH_EVENTS.MAP_DATA_CHANGED)

      // 刷新照片数据（新建模式）
      await loadPhotos()

      // 清空表单
      setTheme('')
      setSelectedTagId('')
      setSelectedCountry('')
      setSelectedAdmin1('')
      setSelectedCity('')
      setUploads([])
      clearAdmin1s()
      clearCities()

      // 显示成功提示
      setShowSuccessModal(true)

    } catch (error) {
      console.error('保存失败:', error)
      alert('Unable to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-[#0B0C10] text-white relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Layer: Swiping Track */}
      <div 
        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{
          transform: `translate3d(${gesture.scale > 1 ? gesture.x : 0}px, ${gesture.scale > 1 ? gesture.y : 0}px, 0) scale(${gesture.scale})`,
          transition: gestureAnimating ? 'transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1)' : 'none',
        }}
      >
        {uploads.length > 0 ? (
          <div 
            className={`flex h-full ${gestureAnimating && gesture.scale <= 1 ? 'transition-transform duration-350 ease-[cubic-bezier(0.25, 0.1, 0.25, 1.0)]' : ''}`}
            style={{
              transform: `translateX(calc(-${activeIndex * 100}% + ${gesture.scale <= 1 ? gesture.x : 0}px))`,
              width: `${uploads.length * 100}%`
            }}
          >
            {uploads.map((upload, idx) => (
              <div key={upload.id || idx} className="w-full h-full flex items-center justify-center flex-shrink-0">
                <img 
                  src={upload.preview} 
                  className="w-full h-full object-contain opacity-100" 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full aspect-square bg-[#1A1B22] flex items-center justify-center">
            <ImageIcon className="text-gray-600 w-16 h-16" />
          </div>
        )}
      </div>

      {/* Top Controls Overlay */}
      <div className={`fixed top-0 left-0 right-0 z-[10010] pt-[env(safe-area-inset-top,40px)] px-6 pb-1 flex flex-col pointer-events-none transition-opacity duration-300 ${uiOpacityClass}`}>
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/80 to-transparent pointer-events-none -z-10"></div>
        <div className="flex justify-between items-start w-full mb-6 py-2 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-[44px] h-[44px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white shadow-lg active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 ml-[-2px]" />
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 h-[40px] bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-sm font-medium shadow-lg active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMemory}
              disabled={isSaving || isUploading}
              className={`px-4 h-[40px] bg-pink-500/80 backdrop-blur-md rounded-full border border-pink-400/30 text-white text-sm font-bold shadow-lg active:scale-95 transition-all ${(isSaving || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? '图片上传中...' : (isSaving ? '正在保存...' : '保存')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 px-1 pb-2">
          <div className="animate-in fade-in duration-300 pointer-events-auto w-full">
            <input
              type="text"
              value={theme}
              onChange={handleThemeChange}
              className="bg-transparent border-none p-0 text-white !text-3xl sm:!text-4xl font-bold leading-tight tracking-tight focus:outline-none placeholder:text-white/20 w-full"
              placeholder="Enter a title"
            />
          </div>

          <div className="flex items-center gap-3 mt-1">
            <label className="relative flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/90 hover:bg-white/20 transition-all active:scale-95 animate-in fade-in duration-300 delay-75 pointer-events-auto cursor-pointer w-fit shadow-sm">
              <Calendar className="h-3 w-3 text-pink-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider pointer-events-none whitespace-nowrap">
                {selectedDate ? selectedDate.replace(/-/g, ' ') : '选择日期'}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ appearance: 'none' }}
              />
            </label>

            <div className="animate-in fade-in duration-300 delay-100 pointer-events-auto w-fit">
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
                  if (countryId) loadAdmin1s(countryId)
                }}
                onAdmin1Change={(admin1Id) => {
                  setSelectedAdmin1(admin1Id)
                  setSelectedCity('')
                  clearCities()
                }}
                onCityChange={setSelectedCity}
                compact={true}
              />
            </div>
          </div>

          <div className="mt-0.5 animate-in fade-in duration-300 delay-150 pointer-events-auto w-fit">
            <TagSelector
              tags={tags}
              selectedTagId={selectedTagId}
              onTagChange={setSelectedTagId}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      <div className={`fixed bottom-0 left-0 right-0 z-[10010] px-6 pb-8 flex flex-col gap-4 pointer-events-none transition-opacity duration-300 ${uiOpacityClass}`}>
        <div className="absolute bottom-0 inset-x-0 h-80 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/80 to-transparent pointer-events-none -z-10"></div>
        <div className="flex flex-col gap-3 pointer-events-auto">
          <div className="flex items-center justify-between px-1 animate-in fade-in duration-300 delay-200">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-black">Photos</span>
            <span className="text-white/30 text-[10px] tabular-nums">{uploads.length}  photos</span>
          </div>

          <div ref={thumbnailContainerRef} className="flex gap-3 overflow-x-auto hide-scrollbar px-6 py-2 -mx-6 items-center pointer-events-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/40 hover:bg-white/10 hover:border-white/20 transition-all flex-shrink-0 animate-in zoom-in duration-300"
            >
              <Plus className="w-5 h-5" />
            </button>

            {uploads.map((upload: any, i: number) => {
              const uniqueKey = upload.id || upload.preview || (upload.file?.name || '') || `upload-${i}`
              return (
                <div
                  key={uniqueKey}
                  draggable
                  onClick={() => setActiveIndex(i)}
                  onDragStart={(e) => {
                    setDraggedIndex(i)
                    e.dataTransfer.setData('text/plain', i.toString())
                    e.currentTarget.style.opacity = '0.4'
                  }}
                  onDragEnd={(e) => {
                    setDraggedIndex(null)
                    e.currentTarget.style.opacity = '1'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedIndex === null || draggedIndex === i) return
                    const newUploads = [...uploads]
                    const [moved] = newUploads.splice(draggedIndex, 1)
                    newUploads.splice(i, 0, moved)
                    setUploads(newUploads)
                    setDraggedIndex(null)
                    // 保持当前Preview的图片一致
                    if (activeIndex === draggedIndex) {
                      setActiveIndex(i)
                    } else if (draggedIndex < activeIndex && i >= activeIndex) {
                      setActiveIndex(activeIndex - 1)
                    } else if (draggedIndex > activeIndex && i <= activeIndex) {
                      setActiveIndex(activeIndex + 1)
                    }
                  }}
                  className={`relative w-14 h-14 flex-shrink-0 transition-all group cursor-pointer ${i === activeIndex ? 'scale-[1.1] z-10' : 'scale-100 opacity-60'}`}
                >
                  <div className={`relative w-full h-full rounded-full overflow-hidden border-2 transition-all ${i === 0 ? 'border-pink-500/50 ring-2 ring-pink-500/20' : (i === activeIndex ? 'border-white' : 'border-white/10')}`}>
                    <img src={upload.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-3 bg-pink-500 flex items-center justify-center">
                        <span className="text-[6px] text-white font-black uppercase tracking-tighter">Cover</span>
                      </div>
                    )}
                    {upload.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <span className="text-[8px] text-white font-bold">{upload.progress}%</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('确定要删除这 photos吗？')) {
                        if ((upload as any).isEditImage) {
                          setUploads(uploads.filter((_, idx) => idx !== i))
                        } else {
                          if (upload.file) removeUpload(upload.file)
                        }
                      }
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-white/20 text-white shadow-lg active:scale-90 transition-transform z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 成功提示模态框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[20000] pointer-events-auto">
          <div className="bg-[#1C1C1E] rounded-2xl p-8 mx-4 max-w-sm w-full text-center border border-[#38383A]">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Memory saved!</h3>
            <p className="text-[#8E8E93] mb-6">Your memory is now part of the journal.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  if (createdMemoryId) {
                    navigate(`/?scrollTo=${createdMemoryId}`)
                  } else {
                    navigate('/')
                  }
                }}
                className="flex-1 bg-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-pink-600 transition-colors"
              >
                View journal
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-[#2C2C2E] text-[#8E8E93] py-3 px-4 rounded-xl font-medium hover:bg-[#3A3A3C] transition-colors"
              >
                Add another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
