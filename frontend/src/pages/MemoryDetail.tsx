import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { apiService } from '../services/api'
import { usePhotos } from '../contexts/PhotoContext'
import { useTusUpload } from '../hooks/useTusUpload'
import { useGeoData } from '../hooks/useGeoData'
import { useMemories } from '../hooks/useMemories'

import { MapPin, Image as ImageIcon, Trash2, ChevronLeft, Heart, MoreHorizontal, Edit2, X, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { emitDataRefresh, DATA_REFRESH_EVENTS } from '../utils/dataEvents'
import { clearWorldMapCache, clearCountryMapCache, clearRegionMemoriesCache } from '../hooks/useMapData'
import LocationSelector from '../components/LocationSelector'
import TagSelector from '../components/TagSelector'
import { api } from '../services/api'

// --- Memoized Sub-components to prevent re-renders during gesture animations ---

const TopControls = memo(({
  onBack, onEdit, onDelete, title, date, locationTxt, uiOpacityClass,
  loveDays, tags, isEditing, onCancel, onSave, isSaving,
  editTitle, setEditTitle, editDate, setEditDate,
  editCountry, setEditCountry, editAdmin1, setEditAdmin1, editCity, setEditCity,
  countries, admin1s, cities, loadAdmin1s, loadCities, clearAdmin1s, clearCities,
  editTagId, setEditTagId, availableTags
}: {
  onBack: () => void, onEdit: () => void, onDelete: () => void,
  title: string, date: string, locationTxt: string, uiOpacityClass: string,
  loveDays?: number, tags?: any[], isEditing: boolean, onCancel: () => void, onSave: () => void, isSaving: boolean,
  editTitle: string, setEditTitle: (val: string) => void,
  editDate: string, setEditDate: (val: string) => void,
  editCountry: string, setEditCountry: (val: string) => void,
  editAdmin1: string, setEditAdmin1: (val: string) => void,
  editCity: string, setEditCity: (val: string) => void,
  countries: any[], admin1s: any[], cities: any[],
  loadAdmin1s: (cid: string) => void, loadCities: (cid: string, aid: string) => void,
  clearAdmin1s: () => void, clearCities: () => void,
  editTagId: string, setEditTagId: (val: string) => void,
  availableTags: any[]
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [menuOpen]);

  return (
    <div className={`fixed top-0 left-0 right-0 z-[10010] pt-[env(safe-area-inset-top,40px)] px-6 pb-1 flex flex-col pointer-events-none transition-opacity duration-200 ${uiOpacityClass}`}>
      {/* Top gradient removed to show photos clearly */}

      <div className="flex justify-between items-start w-full mb-6 py-2">
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="w-[44px] h-[44px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-lg transition-transform active:scale-90 pointer-events-auto cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6 flex-shrink-0 ml-[-2px]" />
        </button>

        <div className="flex items-center gap-3 pointer-events-auto">
          {isEditing ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="px-4 h-[40px] rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-white/80 shadow-lg transition-all active:scale-95 cursor-pointer text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                disabled={isSaving}
                className={`px-4 h-[40px] rounded-full bg-pink-500/80 backdrop-blur-md flex items-center justify-center border border-pink-400/30 text-white shadow-lg transition-all active:scale-95 cursor-pointer text-sm font-bold ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className={`w-[44px] h-[44px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-lg transition-all active:scale-90 cursor-pointer overflow-hidden ${menuOpen ? 'bg-white/40 ring-1 ring-white/30' : ''}`}
                aria-label="More actions"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>

              {/* iOS-style Context Menu */}
              <div
                className="absolute top-full mt-2 right-0 w-48 rounded-2xl overflow-hidden pointer-events-auto shadow-2xl"
                style={{
                  background: 'rgba(30, 30, 36, 0.95)',
                  backdropFilter: 'blur(32px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.12)',
                  transformOrigin: 'top right',
                  transform: menuOpen ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(-10px)',
                  opacity: menuOpen ? 1 : 0,
                  visibility: menuOpen ? 'visible' : 'hidden',
                  transition: menuOpen
                    ? 'transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1), opacity 0.2s ease, visibility 0s 0s'
                    : 'transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.15s ease, visibility 0s 0.2s',
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center justify-between px-5 py-4 text-white active:bg-white/10 transition-colors border-b border-white/5"
                >
                  <span className="text-[14px] font-semibold text-white/90">Edit memory</span>
                  <Edit2 className="w-4 h-4 opacity-70" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center justify-between px-5 py-4 text-red-500 active:bg-red-500/10 transition-colors"
                >
                  <span className="text-[14px] font-semibold">Delete memory</span>
                  <Trash2 className="w-4 h-4 opacity-80" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-1 pb-2">
        {isEditing ? (
          <div className="animate-in fade-in duration-300 pointer-events-auto w-full">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-transparent border-none p-0 text-white !text-3xl sm:!text-4xl font-bold leading-tight tracking-tight focus:outline-none placeholder:text-white/20 w-full"
              placeholder="Give this moment a title..."
            />
          </div>
        ) : (
          <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight drop-shadow-md">
            {title}
          </h2>
        )}

        <div className="flex flex-col gap-2.5">
          {/* Location - Now positioned above Date */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <div className="animate-in fade-in duration-300 delay-100 pointer-events-auto w-fit">
                <LocationSelector
                  countries={countries}
                  admin1s={admin1s}
                  cities={cities}
                  selectedCountry={editCountry}
                  selectedAdmin1={editAdmin1}
                  selectedCity={editCity}
                  onCountryChange={(cid) => {
                    setEditCountry(cid)
                    setEditAdmin1('')
                    setEditCity('')
                    clearAdmin1s()
                    clearCities()
                    if (cid) loadAdmin1s(cid)
                  }}
                  onAdmin1Change={(aid) => {
                    setEditAdmin1(aid)
                    setEditCity('')
                    clearCities()
                    if (editCountry && aid) loadCities(editCountry, aid)
                  }}
                  onCityChange={setEditCity}
                  compact={true}
                />
              </div>
            ) : (
              <div className="flex items-center gap-1 overflow-hidden">
                <MapPin className="w-3.5 h-3.5 text-white/95 drop-shadow-md flex-shrink-0" />
                <span className="text-[12px] font-bold text-white/95 tracking-widest truncate drop-shadow-md">
                  {locationTxt}
                </span>
              </div>
            )}
          </div>

          {/* Date - Now positioned below Location */}
          {isEditing ? (
            <label className="relative flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/90 hover:bg-white/20 transition-all active:scale-95 animate-in fade-in duration-300 delay-75 pointer-events-auto cursor-pointer w-fit">
              <CalendarIcon className="h-3 w-3 text-pink-400" />
              <span className="text-[11px] font-bold tracking-wider pointer-events-none whitespace-nowrap">
                {editDate ? editDate.replace(/-/g, ' ') : '选择日期'}
              </span>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ appearance: 'none' }}
              />
            </label>
          ) : (
            <div className="flex items-center gap-1.5 opacity-80">
              <CalendarIcon className="w-3 h-3 text-white/90" />
              <span className="text-[12px] font-bold text-white/95 tracking-widest drop-shadow-md">
                {date}
              </span>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-0.5 animate-in fade-in duration-300 delay-150 pointer-events-auto w-fit">
            <TagSelector
              tags={availableTags}
              selectedTagId={editTagId}
              onTagChange={setEditTagId}
              compact={true}
            />
          </div>
        ) : (
          (loveDays !== undefined || (tags && tags.length > 0)) && (
            <div className="flex items-center gap-2 mt-0.5">
              {loveDays !== undefined && (
                <div className="flex items-center gap-1 bg-pink-500/40 px-2 py-0.5 rounded-full border border-pink-500/30">
                  <Heart className="w-2.5 h-2.5 text-pink-500 fill-pink-500" />
                  <span className="text-[10px] font-bold text-white/90 tracking-wider">
                    {loveDays < 0 ? `Together in ${Math.abs(loveDays)} days` : `Together for ${loveDays} days`}
                  </span>
                </div>
              )}
              {tags && tags.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                  {tags.map((t: any) => (
                    <span key={t.id} className="text-[10px] font-medium text-white/90 bg-white/20 px-2 py-0.5 rounded-full border border-white/10 tracking-wider">
                      #{t.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
})
TopControls.displayName = 'TopControls'

const BottomControls = memo(({
  description, allImages, activeIndex, onImageClick, thumbnailContainerRef, uiOpacityClass,
  isEditing, uploads, setUploads, fileInputRef
}: {
  description: string, allImages: string[], activeIndex: number,
  onImageClick: (url: string, i: number) => void,
  thumbnailContainerRef: React.RefObject<HTMLDivElement>,
  uiOpacityClass: string,
  isEditing: boolean,
  uploads: any[], setUploads: React.Dispatch<React.SetStateAction<any[]>>,
  fileInputRef: React.RefObject<HTMLInputElement>
}) => (
  <div className={`fixed bottom-0 left-0 right-0 z-[10010] px-6 pb-8 flex flex-col gap-4 transition-all duration-300 pointer-events-none ${uiOpacityClass}`}>
    {/* Bottom gradient removed to show photos clearly */}


    {!isEditing && description && (
      <p className="text-white/90 text-sm leading-relaxed drop-shadow-md line-clamp-3 mb-2 pointer-events-auto">
        {description}
      </p>
    )}

    <div className="flex flex-col gap-3 pointer-events-auto">
      {isEditing && (
        <div className="flex items-center justify-between px-1 animate-in fade-in duration-300 delay-200">
          <span className="text-white/40 text-[10px] uppercase tracking-widest font-black">Photos</span>
          <span className="text-white/30 text-[10px] tabular-nums">{uploads.length}  photos</span>
        </div>
      )}

      <div ref={thumbnailContainerRef} className="flex gap-3 overflow-x-auto hide-scrollbar px-6 py-2 -mx-6 items-center pointer-events-auto">
        {isEditing && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/40 hover:bg-white/10 hover:border-white/20 transition-all flex-shrink-0 animate-in zoom-in duration-300"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {isEditing ? (
          uploads.map((upload, i) => (
            <div
              key={upload.id || i}
              draggable
              onClick={() => onImageClick(upload.preview, i)}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', i.toString());
                e.currentTarget.style.opacity = '0.4';
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = i;
                if (fromIndex === toIndex) return;
                const newUploads = [...uploads];
                const [moved] = newUploads.splice(fromIndex, 1);
                newUploads.splice(toIndex, 0, moved);
                setUploads(newUploads);
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
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('确定要删除这 photos吗？')) {
                    setUploads(uploads.filter((_, idx) => idx !== i));
                  }
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-white/20 text-white shadow-lg active:scale-90 transition-transform z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          allImages.map((url, i) => (
            <div
              key={url}
              onClick={() => onImageClick(url, i)}
              className={`relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border-[1.5px] shadow-lg cursor-pointer transition-all hover:scale-[1.05] active:scale-95 ${i === activeIndex ? 'border-white opacity-100 scale-[1.1] ring-2 ring-white/50 ring-offset-2 ring-offset-[#0B0C10]' : 'border-white/30 opacity-50'}`}
            >
              <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
            </div>
          ))
        )}
      </div>
    </div>
  </div>
))
BottomControls.displayName = 'BottomControls'

BottomControls.displayName = 'BottomControls'

export default function MemoryDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { photos, removePhoto } = usePhotos()
  const { countries, loadAdmin1s, loadCities, clearAdmin1s, clearCities, admin1s, cities } = useGeoData()
  const { updateMemory } = useMemories()
  const { uploads, setUploads, uploadAllFiles } = useTusUpload()

  const [previewIndex, setPreviewIndex] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTagId, setEditTagId] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editAdmin1, setEditAdmin1] = useState('')
  const [editCity, setEditCity] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([])

  // 从location.state获取照片数据和来源信息
  const [selectedPhoto, setSelectedPhoto] = useState(location.state?.photo || null)
  const fromSource = location.state?.from || 'album'
  const selectedRegion = location.state?.selectedRegion
  const currentCountry = location.state?.currentCountry
  const sourceRect = location.state?.sourceRect
  const hasLoadedRef = useRef(false)
  const [hasStableExpanded, setHasStableExpanded] = useState(false)

  const [transitionPhase, setTransitionPhase] = useState<'init' | 'expanding' | 'expanded' | 'shrinking_ui' | 'shrinking' | 'none'>(sourceRect ? 'init' : 'none')

  useEffect(() => {
    if (transitionPhase === 'init') {
      // Dispatch event to hide the source card in the timeline 
      // as soon as we are about to start expanding (first frame of Detail)
      window.dispatchEvent(new CustomEvent('memory-detail-opened', {
        detail: { id: selectedPhoto.id, rect: sourceRect }
      }));

      requestAnimationFrame(() => {
        setTransitionPhase('expanding');
        setTimeout(() => {
          setTransitionPhase('expanded');
        }, 360); // slightly longer than the 350ms CSS to be safe
      });
    }
  }, [transitionPhase]);


  useEffect(() => {
    if (transitionPhase === 'expanded') {
      const timer = setTimeout(() => {
        setHasStableExpanded(true);
      }, 250); // Give 250ms for the track layer to paint its first high-res frame
      return () => clearTimeout(timer);
    } else {
      setHasStableExpanded(false);
    }
  }, [transitionPhase]);

  // Back函数：根据来源决定Back的目标
  const handleBack = useCallback(() => {
    // Signal timeline to reveal the hidden card
    window.dispatchEvent(new CustomEvent('memory-detail-closed'));
    if (fromSource === 'love-memories') {
      // 从Memory map进入，Back时使用 state 传递状态（同步传递，避免闪烁）
      navigate('/love-memories', {
        state: {
          currentCountry: currentCountry,
          selectedRegion: selectedRegion,
          restoreScroll: true
        },
        replace: false
      })
    } else {
      // 从主页进入，Back主页
      navigate('/')
    }
  }, [fromSource, currentCountry, selectedRegion, navigate])

  const handleBackAnimated = useCallback(() => {
    if (sourceRect && (transitionPhase === 'expanded' || transitionPhase === 'expanding' || transitionPhase === 'shrinking_ui')) {
      // Signal timeline card reveal at the START of the shrink — it fades in over 300ms which matches the 350ms flight
      window.dispatchEvent(new CustomEvent('memory-detail-closed'));

      // Reset zoom and pan for the flight home
      setGesture({ x: 0, y: 0, scale: 1 });

      // IMMEDIATELY jump to shrinking to let the transform-based flight begin
      setTransitionPhase('shrinking');
      setGestureAnimating(true);

      setTimeout(() => {
        handleBack();
      }, 350); // Matches the 0.35s flight duration
    } else {
      handleBack();
    }
  }, [sourceRect, transitionPhase, handleBack]);

  // 监听Back按钮点击（通过自定义事件）
  useEffect(() => {
    const handleBackEvent = () => {
      handleBackAnimated()
    }

    window.addEventListener('memory-detail-back', handleBackEvent)
    return () => {
      window.removeEventListener('memory-detail-back', handleBackEvent)
    }
  }, [handleBackAnimated])


  // 获取标签列表
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagList = await api.getTags()
        setAvailableTags(tagList)
      } catch (error) {
        console.error('获取标签列表失败:', error)
      }
    }
    fetchTags()
  }, [])

  // 始终从 API 获取完整数据（包括 images 数组），确保数据完整性
  useEffect(() => {
    // 滚动到顶部
    const scrollContainer = document.querySelector('.app-main') as HTMLElement
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }

    // 当 id 变化时，重置加载状态
    hasLoadedRef.current = false

    const loadMemory = async () => {
      if (!id) return

      try {
        // 先从 photos context 中查找（可能有完整的 images 数组）
        if (photos.length > 0) {
          const photo = photos.find(p => p.id === id)
          if (photo && photo.images && Array.isArray(photo.images) && photo.images.length > 0) {
            setSelectedPhoto(photo)
            hasLoadedRef.current = true
            return
          }
        }

        // 如果找不到或有数据但不完整，从 API 获取完整数据（包括 images 数组）
        const response = await apiService.getMemory(id)
        if (response.success && response.data) {
          setSelectedPhoto(response.data)
          hasLoadedRef.current = true
        }
      } catch (error) {
        console.error('加载Memory details失败:', error)
      }
    }
    loadMemory()
  }, [id, photos])

  // 辅助函数：获取完整的图片URL
  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    // 使用相对路径，由 Vite 代理转发
    return url.startsWith('/') ? url : `/${url}`
  }

  // 获取所有图片URL数组
  const getAllImageUrls = (): string[] => {
    const urls: string[] = []

    // 1. 优先使用 images 数组
    if (selectedPhoto?.images && Array.isArray(selectedPhoto.images) && selectedPhoto.images.length > 0) {
      selectedPhoto.images.forEach((img: any) => {
        if (img.imageUrl) urls.push(getImageUrl(img.imageUrl))
      })
    }

    // 2. 如果 images 数组为空，但有主图 imageUrl，则添加到列表
    if (urls.length === 0 && selectedPhoto?.imageUrl) {
      urls.push(getImageUrl(selectedPhoto.imageUrl))
    }

    return urls
  }

  const handleImageClick = (_: string, index: number) => {
    setPreviewIndex(index)
  }

  const handleEdit = useCallback(() => {
    if (selectedPhoto) {
      setEditTitle(selectedPhoto.title || '')
      setEditDate(selectedPhoto.happenedAt?.split('T')[0] || '')
      setEditDescription(selectedPhoto.description || '')
      setEditTagId(selectedPhoto.memoryTags?.[0]?.tagId || '')
      setEditCountry(selectedPhoto.countryId || '')
      setEditAdmin1(selectedPhoto.admin1Id || '')
      setEditCity(selectedPhoto.cityId || '')

      // Backfill geo data lists
      if (selectedPhoto.countryId) {
        loadAdmin1s(selectedPhoto.countryId)
        if (selectedPhoto.admin1Id) {
          loadCities(selectedPhoto.countryId, selectedPhoto.admin1Id)
        }
      }

      // Load existing images into uploads for management
      const existingImages = (selectedPhoto.images || []).map((img: any, idx: number) => ({
        id: img.id || `existing-${idx}`,
        progress: 100,
        status: 'completed' as const,
        preview: getImageUrl(img.imageUrl),
        imageUrl: img.imageUrl,
        isEditImage: true
      }))
      setUploads(existingImages)

      setIsEditing(true)
    }
  }, [selectedPhoto, setUploads])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setUploads([]) // Clear temporary uploads
  }, [setUploads])

  const handleSave = useCallback(async () => {
    if (!editTitle.trim()) {
      alert('Enter a title')
      return
    }

    setIsSaving(true)
    try {
      // 1. Upload new images if any
      const newImageUrls = await uploadAllFiles()

      // 2. Prepare final images list (existing + new)
      const finalImageUrls = [
        ...uploads
          .filter(u => u.status === 'completed' && u.imageUrl)
          .map(u => u.imageUrl!),
        ...newImageUrls
      ]

      // 3. Update memory data
      const response = await updateMemory(selectedPhoto.id, {
        title: editTitle,
        happenedAt: editDate,
        description: editDescription,
        countryId: editCountry,
        admin1Id: editAdmin1 || undefined,
        cityId: editCity || undefined,
        tagIds: editTagId ? [editTagId] : [],
        imageUrl: finalImageUrls
      })

      if (response) {
        setSelectedPhoto(response)
        setIsEditing(false)
        setUploads([])

        // Refresh global data
        clearWorldMapCache()
        clearCountryMapCache()
        clearRegionMemoriesCache()
        emitDataRefresh(DATA_REFRESH_EVENTS.MEMORIES_CHANGED)
        emitDataRefresh(DATA_REFRESH_EVENTS.MAP_DATA_CHANGED)
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('Unable to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [selectedPhoto, editTitle, editDate, editDescription, editCountry, editAdmin1, editCity, editTagId, uploads, uploadAllFiles, updateMemory])

  const handleDelete = async () => {
    if (selectedPhoto && confirm('确定要删除这个回忆吗？删除后无法恢复。')) {
      try {
        // 使用 PhotoContext 的 removePhoto 方法，它会自动调用 API 并更新本地状态
        await removePhoto(selectedPhoto.id)
        console.log('回忆删除成功')

        // 清除地图缓存并发送事件
        clearWorldMapCache()
        clearCountryMapCache()
        clearRegionMemoriesCache()
        emitDataRefresh(DATA_REFRESH_EVENTS.MEMORIES_CHANGED)
        emitDataRefresh(DATA_REFRESH_EVENTS.MAP_DATA_CHANGED)

        // 根据来源Back
        handleBack()
      } catch (error) {
        console.error('Delete memory失败:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          alert('You do not have permission to delete this memory.')
          navigate('/login')
        } else {
          alert('Unable to delete. Please try again.')
        }
      }
    }
  }


  // 如果没有照片数据，使用useEffect导航
  useEffect(() => {
    if (!selectedPhoto) {
      if (fromSource === 'love-memories') {
        handleBack()
      } else {
        navigate('/')
      }
    }
  }, [selectedPhoto, navigate, fromSource])


  // 如果没有照片数据，显示加载状态
  if (!selectedPhoto) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-800 dark:text-white text-center">
          <div className="text-2xl mb-4">💕</div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // 使用 happenedAt 字段
  const photoDate = selectedPhoto.happenedAt
  const dataImages = getAllImageUrls()
  const allImages = isEditing ? uploads.map((u: any) => u.preview) : dataImages
  const activeIndex = Math.min(previewIndex, Math.max(0, allImages.length - 1))
  const primaryBg = allImages.length > 0 ? allImages[activeIndex] : null


  // Bridge URL: Use the exact same URL as the grid to prevent flashing
  const transitionUrl = useMemo(() => {
    const p = location.state?.photo
    if (!p) return null
    // Use the CURRENTly active image in the memory, not just the first one
    const currentImg = p.images?.[activeIndex] || p.images?.[0] || null
    const url = currentImg?.imageUrl || currentImg?.thumbnailUrl || p.imageUrl || null
    if (!url) return null
    if (url.startsWith('http')) return url
    // 使用相对路径，由 Vite 代理转发
    return url.startsWith('/') ? url : `/${url}`
  }, [location.state?.photo, activeIndex])

  // Dynamically track loaded image dimensions
  const [imageSizes, setImageSizes] = useState<Record<string, { w: number, h: number }>>(() => {
    const init: Record<string, { w: number, h: number }> = {};
    const p = location.state?.photo;
    if (location.state?.naturalSize && p) {
      // Seed the cache with the size we already know from the thumbnail
      const thumbUrl = transitionUrl;
      const fullUrl = p.images && p.images.length > 0 ? p.images[0].imageUrl : p.imageUrl;
      // 确保 key 为相对路径
      const fullUrlRelative = fullUrl ? (fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`) : null;

      if (thumbUrl) init[thumbUrl] = location.state.naturalSize;
      if (fullUrlRelative) init[fullUrlRelative] = location.state.naturalSize;
    }
    return init;
  });

  useEffect(() => {
    if (primaryBg && !imageSizes[primaryBg]) {
      let isMounted = true;
      const img = new window.Image();
      img.src = primaryBg;
      img.onload = () => {
        if (isMounted) {
          setImageSizes(prev => ({
            ...prev,
            [primaryBg]: { w: img.naturalWidth, h: img.naturalHeight }
          }));
        }
      };
      return () => { isMounted = false; };
    }
  }, [primaryBg, imageSizes]);

  // 核心：统一计算当前图片的宽高比
  const getConsistentRatio = useCallback(() => {
    // 1. 优先使用已加载的大图实际尺寸
    const currentSize = imageSizes[primaryBg || ''];
    if (currentSize && currentSize.w && currentSize.h) {
      const ratio = currentSize.w / currentSize.h;
      if (isFinite(ratio) && ratio > 0) return ratio;
    }

    // 2. 其 visits使用从列表页传过来的精确比例
    const stateRatio = location.state?.naturalRatio || location.state?.photo?._naturalRatio;
    if (stateRatio) {
      return stateRatio;
    }

    // 3. 再 visits使用从列表页传过来的原始尺寸
    if (location.state?.naturalSize) {
      const { w, h } = location.state.naturalSize;
      if (w && h) {
        const ratio = w / h;
        if (isFinite(ratio) && ratio > 0) return ratio;
      }
    }

    // 4. 最后回退到原始 DOM 矩形比例或默认比例
    if (sourceRect && sourceRect.height > 0) {
      return sourceRect.width / sourceRect.height;
    }

    return 1.0;
  }, [imageSizes, primaryBg, location.state, sourceRect]);

  const getRatioForUrl = useCallback((url: string) => {
    // 优先使用已加载的高清图比例
    const size = imageSizes[url];
    if (size && size.w && size.h) return size.w / size.h;

    // 如果是当前主图，且还没加载完，回退到全局计算（使用列表页传来的等价比例）
    if (url === primaryBg) return getConsistentRatio();

    return 1.0;
  }, [imageSizes, primaryBg, getConsistentRatio]);

  // Touch Gestures
  const [gesture, setGesture] = useState({ x: 0, y: 0, scale: 1 });
  const [gestureAnimating, setGestureAnimating] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const swipeLock = useRef(false);
  const touchState = useRef({
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    lastCx: 0, lastCy: 0,
    startScale: 1,
    initialDistance: 0,
    isPinching: false,
    isPanning: false
  });

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (transitionPhase !== 'expanded' || swipeLock.current) return;
    setGestureAnimating(false);

    if (e.touches.length >= 2) {
      touchState.current.isPinching = true;
      setIsPinching(true);
      touchState.current.isPanning = false;
      touchState.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
      touchState.current.startScale = gesture.scale;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchState.current.startX = cx;
      touchState.current.startY = cy;
      touchState.current.lastCx = cx;
      touchState.current.lastCy = cy;
      touchState.current.lastX = gesture.x;
      touchState.current.lastY = gesture.y;

      // If we were dragging down, reset drag state before starting pinch
      if (gesture.y > 0 && gesture.scale === 1) {
        setGesture(prev => ({ ...prev, y: 0 }));
      }
    } else if (e.touches.length === 1) {
      touchState.current.isPinching = false;
      setIsPinching(false);
      touchState.current.isPanning = true;
      touchState.current.startX = e.touches[0].clientX;
      touchState.current.startY = e.touches[0].clientY;
      touchState.current.lastX = gesture.x;
      touchState.current.lastY = gesture.y;
    }
  };

  // Block iOS Safari edge-swipe back gesture and all system gestures (zoom, etc)
  useEffect(() => {
    const doc = document.documentElement;
    const originalTouchAction = doc.style.touchAction;
    const originalOverscroll = doc.style.overscrollBehaviorX;

    // Disable all browser touch actions globally while in detail view
    doc.style.touchAction = 'none';
    doc.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';

    const handleEdgeTouch = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touchX = e.touches[0].clientX;
        // Aggressively block any horizontal start near edges
        if (touchX < 40 || touchX > window.innerWidth - 40) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', handleEdgeTouch, { passive: false });
    return () => {
      doc.style.touchAction = originalTouchAction;
      doc.style.overscrollBehaviorX = originalOverscroll;
      document.body.style.overscrollBehaviorX = '';
      document.removeEventListener('touchstart', handleEdgeTouch);
    };
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (transitionPhase !== 'expanded' || swipeLock.current) return;

    if (e.touches.length >= 2 && touchState.current.isPinching) {
      if (e.cancelable) e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const baseScale = touchState.current.startScale;
      let newScale = baseScale * (currentDistance / touchState.current.initialDistance);
      newScale = Math.max(1, Math.min(newScale, 5));

      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = cx - touchState.current.lastCx;
      const dy = cy - touchState.current.lastCy;
      touchState.current.lastCx = cx;
      touchState.current.lastCy = cy;

      setGesture(prev => {
        const scaleDiff = newScale / prev.scale;
        let nextX = prev.x + (cx - window.innerWidth / 2 - prev.x) * (1 - scaleDiff) + dx;
        let nextY = prev.y + (cy - window.innerHeight / 2 - prev.y) * (1 - scaleDiff) + dy;

        const W = window.innerWidth;
        const H = window.innerHeight;
        const currentSize = primaryBg ? imageSizes[primaryBg] : null;
        let imgRatio = 1;
        if (currentSize) {
          imgRatio = currentSize.w / currentSize.h;
        } else if (location.state?.naturalSize) {
          imgRatio = location.state.naturalSize.w / location.state.naturalSize.h;
        } else if (sourceRect) {
          imgRatio = sourceRect.width / sourceRect.height;
        }
        let tw = H * imgRatio;
        let th = H;
        if (tw > W) { tw = W; th = W / imgRatio; }

        const maxAllowedX = Math.max(0, (tw * newScale - W) / 2);
        const maxAllowedY = Math.max(0, (th * newScale - H) / 2);

        const softClamp = (val: number, max: number) => {
          if (val > max) return max + (val - max) * 0.3;
          if (val < -max) return -max + (val + max) * 0.3;
          return val;
        };

        return { ...prev, scale: newScale, x: softClamp(nextX, maxAllowedX), y: softClamp(nextY, maxAllowedY) };
      });
    } else if (e.touches.length === 1 && touchState.current.isPanning) {
      const dx = e.touches[0].clientX - touchState.current.startX;
      const dy = e.touches[0].clientY - touchState.current.startY;

      if (gesture.scale > 1) {
        if (e.cancelable) e.preventDefault();
        setGesture(prev => {
          let nextX = touchState.current.lastX + dx;
          let nextY = touchState.current.lastY + dy;

          const W = window.innerWidth;
          const H = window.innerHeight;

          const imgRatio = getConsistentRatio();

          let tw, th;
          if (imgRatio >= 0.3) {
            tw = W;
            th = W / imgRatio;
          } else {
            th = H;
            tw = H * imgRatio;
            if (tw > W) {
              tw = W;
              th = W / imgRatio;
            }
          }

          const maxAllowedX = Math.max(0, (tw * prev.scale - W) / 2);
          const maxAllowedY = Math.max(0, (th * prev.scale - H) / 2);

          const softClamp = (val: number, max: number) => {
            if (val > max) return max + (val - max) * 0.3;
            if (val < -max) return -max + (val + max) * 0.3;
            return val;
          };

          return { ...prev, x: softClamp(nextX, maxAllowedX), y: softClamp(nextY, maxAllowedY) };
        });
      } else {
        // scale === 1
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx > absDy || gesture.x !== 0) {
          // Horizontal priority (swipe between images)
          if (e.cancelable) e.preventDefault();
          setGesture(prev => ({ ...prev, x: dx, y: 0 }));
        } else if (dy > 0 || gesture.y > 0) {
          // Vertical priority (Interactive Hero Transition)
          if (e.cancelable) e.preventDefault();

          setGesture(prev => ({
            ...prev,
            y: dy,
            x: 0
          }));
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (transitionPhase !== 'expanded' || swipeLock.current) return;

    // Re-anchor when one finger is lifted
    if (e.touches.length > 0) {
      // Just re-anchor, don't end gesture
      touchState.current.isPinching = false;
      setIsPinching(false);
      touchState.current.isPanning = true;
      touchState.current.startX = e.touches[0].clientX;
      touchState.current.startY = e.touches[0].clientY;
      touchState.current.lastX = gesture.x;
      touchState.current.lastY = gesture.y;
      return;
    }

    setIsPinching(false);

    setGestureAnimating(true);

    // Fetch standard bounds for jump distance
    const W = window.innerWidth;
    const H = window.innerHeight;
    const currentSize = primaryBg ? imageSizes[primaryBg] : null;
    const imgRatio = currentSize
      ? currentSize.w / currentSize.h
      : (location.state?.naturalSize ? location.state.naturalSize.w / location.state.naturalSize.h : (sourceRect ? (sourceRect.width / sourceRect.height) : 1));
    let tw = H * imgRatio;
    if (tw > W) tw = W;

    if (gesture.scale <= 1) {
      if (gesture.y > 120) {
        handleBackAnimated();
        return;
      }

      const swipeThreshold = 50;
      if (gesture.x > swipeThreshold && activeIndex > 0) {
        // Switch to Previous
        setGestureAnimating(true);
        setPreviewIndex(activeIndex - 1);
        setGesture({ x: 0, y: 0, scale: 1 });
        return;
      } else if (gesture.x < -swipeThreshold && activeIndex < allImages.length - 1) {
        // Switch to Next
        setGestureAnimating(true);
        setPreviewIndex(activeIndex + 1);
        setGesture({ x: 0, y: 0, scale: 1 });
        return;
      }
    }

    // Spring back
    setGesture(prev => {
      if (prev.scale <= 1) return { x: 0, y: 0, scale: 1 };

      const W = window.innerWidth;
      const H = window.innerHeight;
      const imgRatio = getConsistentRatio();
      let tw = H * imgRatio;
      let th = H;
      if (tw > W) { tw = W; th = W / imgRatio; }

      const maxAllowedX = Math.max(0, (tw * prev.scale - W) / 2);
      const maxAllowedY = Math.max(0, (th * prev.scale - H) / 2);

      let finalX = prev.x;
      let finalY = prev.y;
      if (finalX > maxAllowedX) finalX = maxAllowedX;
      if (finalX < -maxAllowedX) finalX = -maxAllowedX;
      if (finalY > maxAllowedY) finalY = maxAllowedY;
      if (finalY < -maxAllowedY) finalY = -maxAllowedY;

      return { x: finalX, y: finalY, scale: prev.scale };
    });

    touchState.current.isPinching = false;
    touchState.current.isPanning = false;
  };

  // Sync thumbnail scroll position when activeIndex changes
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      // 在编辑模式下，第一个子元素是 "Plus" 按钮，所以索引需要 +1
      const childIndex = isEditing ? activeIndex + 1 : activeIndex;
      const activeElement = thumbnailContainerRef.current.children[childIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeIndex]);

  const wrapperStyle: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10000,
      overflow: 'hidden',
      backgroundColor: '#0B0C10',
      transformOrigin: 'center center',
      willChange: 'transform'
    };

    if (transitionPhase === 'none') {
      return { ...base, inset: 0, overflow: 'auto', zIndex: 50 };
    }

    if (transitionPhase === 'init') {
      return {
        ...base,
        top: sourceRect?.top,
        left: sourceRect?.left,
        width: sourceRect?.width,
        height: sourceRect?.height,
        borderRadius: '16px',
        transition: 'none'
      };
    }

    // expanded, expanding, shrinking_ui
    // Calculate aspect ratio matching to preserve COVER geometry without scale popping
    // (Essentially: replicate the iOS Hero animation box expansion bound logic)
    // 1. Get window
    const W = window.innerWidth;
    const H = window.innerHeight;

    // 2. 使用统一比例
    const imgRatio = getConsistentRatio();

    // 3. 按照用户反馈优化逻辑：
    // 使用 0.3 作为阈值。即便是在 iPhone Pro Max 上显示标准比例竖图，也会铺满宽度。
    let tw, th;
    if (imgRatio >= 0.3) {
      tw = W;
      th = W / imgRatio;
    } else {
      th = H;
      tw = H * imgRatio;
      if (tw > W) {
        tw = W;
        th = W / imgRatio;
      }
    }

    // TARGETS: We will use these to FLY the card back home via transform ONLY.
    // This ensures a gapless handoff from manual drag to automated return.
    const targetScaleX = sourceRect ? (sourceRect.width / tw) : 1;
    const targetScaleY = sourceRect ? (sourceRect.height / th) : 1;
    const targetTx = sourceRect ? (sourceRect.left + sourceRect.width / 2 - W / 2) : 0;
    const targetTy = sourceRect ? (sourceRect.top + sourceRect.height / 2 - H / 2) : 0;

    let finalTransform = 'none';
    let finalRadius = '0px';

    if (transitionPhase === 'shrinking') {
      // THE FLIGHT: Fly from current (or center) to the exact sourceRect location
      finalTransform = `translate3d(${targetTx}px, ${targetTy}px, 0) scale(${targetScaleX}, ${targetScaleY})`;
      // CORRECT COMPENSATED RADIUS: use elliptical radius to stay perfectly circular in screen space
      // even when scaleX and scaleY are different.
      finalRadius = `${16 / targetScaleX}px / ${16 / targetScaleY}px`;
    } else if (gesture.y > 0 && gesture.scale <= 1 && !isPinching && (transitionPhase === 'expanded' || transitionPhase === 'shrinking_ui')) {
      // THE PREVIEW: User is manually dragging the animation progress
      // ONLY trigger this when we are at scale 1 (not zoomed in)
      const progress = Math.min(1, gesture.y / 450);
      const currentTx = progress * targetTx;
      const finalTy = (gesture.y + progress * (targetTy - gesture.y));
      const currentScaleX = 1 - (progress * (1 - targetScaleX));
      const currentScaleY = 1 - (progress * (1 - targetScaleY));

      finalTransform = `translate3d(${currentTx}px, ${finalTy}px, 0) scale(${currentScaleX}, ${currentScaleY})`;
      // Progressively increase radius while compensating for current scales
      finalRadius = `${(progress * 16) / currentScaleX}px / ${(progress * 16) / currentScaleY}px`;
    }

    return {
      ...base,
      top: (H - th) / 2,
      left: (W - tw) / 2,
      width: tw,
      height: th,
      borderRadius: finalRadius,
      transform: finalTransform,
      overflow: (transitionPhase === 'expanded' && (gesture.y < 10 || gesture.scale > 1)) ? 'visible' : 'hidden',
      transition: (gestureAnimating || transitionPhase === 'shrinking' || transitionPhase === 'expanding') ? 'all 0.35s cubic-bezier(0.32, 0.72, 0, 1)' : 'none'
    };
  }, [transitionPhase, sourceRect, getConsistentRatio, gesture.x, gesture.y, gesture.scale, gestureAnimating]);

  const isInteracting = (gesture.scale > 1 || isPinching || gesture.y > 10);
  const showUI = (transitionPhase === 'expanded' || transitionPhase === 'none') && !isInteracting;
  const uiOpacityClass = showUI ? 'opacity-100' : 'opacity-0 pointer-events-none';

  // Dynamic opacity for pull-to-close gesture
  const dragOpacity = useMemo(() => {
    if (transitionPhase !== 'expanded' || gesture.scale > 1 || isPinching || gesture.y <= 0) return 1;
    // Scale opacity from 1 down to 0 over 300px drag
    return Math.max(0, 1 - (gesture.y / 350));
  }, [gesture.y, gesture.scale, isPinching, transitionPhase]);

  const innerTransform = useMemo(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const imgRatio = getConsistentRatio();
    let tw, th;
    if (imgRatio >= 0.3) {
      tw = W;
      th = W / imgRatio;
    } else {
      th = H;
      tw = H * imgRatio;
      if (tw > W) {
        tw = W;
        th = W / imgRatio;
      }
    }

    const targetScaleX = sourceRect ? (sourceRect.width / tw) : 1;
    const targetScaleY = sourceRect ? (sourceRect.height / th) : 1;
    const targetZoom = Math.max(targetScaleX, targetScaleY); // This is the content zoom for 'cover' fit

    let progress = 0;
    if (transitionPhase === 'shrinking') {
      progress = 1;
    } else if (gesture.y > 0 && gesture.scale <= 1 && !isPinching) {
      progress = Math.min(1, gesture.y / 450);
    }

    const currentSX = 1 - (progress * (1 - targetScaleX));
    const currentSY = 1 - (progress * (1 - targetScaleY));
    const currentZoom = 1 - (progress * (1 - targetZoom));

    // Combine expansion/shrink scale with pinch-zoom scale + pan
    // Note: When progress > 0 (dragging), gesture.scale is 1.
    // When pinching/panning, progress is 0.
    const combinedScale = gesture.scale * (currentZoom / currentSX);
    const combinedScaleY = gesture.scale * (currentZoom / currentSY);

    // Only apply pan offsets if we are zoomed in. 
    // If scale=1, gesture.x/y are used for global swipe/drag which the containers already handle.
    const finalX = gesture.scale > 1 ? gesture.x : 0;
    const finalY = gesture.scale > 1 ? gesture.y : 0;

    return `translate3d(${finalX}px, ${finalY}px, 0) scale(${combinedScale}, ${combinedScaleY})`;
  }, [primaryBg, imageSizes, getConsistentRatio, sourceRect, transitionPhase, gesture.x, gesture.y, gesture.scale, isPinching]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col pointer-events-none"
      style={{ touchAction: 'none' }} // Triple lock for the main container
    >

      {/* 
         Absolute backdrop color for the modal expansion.
         Has pointer-events-auto to intercept phantom clicks blocking them from the feed behind.
      */}
      <div
        className={`absolute inset-0 w-full h-full bg-[#0B0C10] overflow-hidden transition-opacity duration-200 pointer-events-auto ${transitionPhase === 'init' || transitionPhase === 'shrinking' ? 'opacity-0' : 'opacity-100'}`}
        style={{ opacity: (transitionPhase === 'init' || transitionPhase === 'shrinking' ? 0 : 1) * dragOpacity }}
      ></div>

      {/* The isolated translating image bounds wrapper */}
      <div
        style={wrapperStyle}
        className="pointer-events-none relative"
      >
        {/* Layer 1: The Continuous Swiping Track (Primary Interaction) */}
        {primaryBg && transitionPhase === 'expanded' && (
          <div
            className="absolute inset-0 w-full h-full bg-[#0B0C10] overflow-visible"
            style={{ zIndex: 10 }}
          >
            <div
              className="absolute inset-y-0 flex items-center"
              style={{
                left: '50%',
                top: '50%',
                width: `${allImages.length * 100}vw`,
                height: '100vh',
                transform: `translate3d(${-50 - (activeIndex * 100) + (gesture.x / window.innerWidth) * 100}vw, -50%, 0)`,
                transition: gestureAnimating ? 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)' : 'none'
              }}
            >
              {allImages.map((url, i) => {
                const ratio = getRatioForUrl(url);
                return (
                  <div key={`${url}-${i}`} className="h-full flex items-center justify-center flex-shrink-0" style={{ width: '100vw' }}>
                    <img
                      src={url}
                      alt={`Track ${url}`}
                      className={`pointer-events-none ${ratio >= 0.3 ? 'w-full h-auto' : 'h-full w-auto max-w-none'}`}
                      style={{ imageOrientation: 'from-image' }}
                      // Bridge the gap for the first image
                      decoding={i === activeIndex ? "sync" : "async"}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Layer 2: The Shared-Element Hero (Visual Bridge for fly-in/out) */}
        {primaryBg && (transitionPhase !== 'expanded' || (gesture.scale > 1 || gesture.y > 0) || !hasStableExpanded) && (
          <div
            className={`absolute inset-0 w-full h-full bg-[#0B0C10] ${transitionPhase === 'expanded' ? 'overflow-visible' : 'overflow-hidden'} transition-opacity duration-300`}
            style={{
              zIndex: 20,
              opacity: (transitionPhase === 'expanded' && !isInteracting) ? 0 : 1
            }}
          >
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: innerTransform,
                transition: (gestureAnimating || transitionPhase === 'shrinking' || transitionPhase === 'expanding')
                  ? 'all 0.35s cubic-bezier(0.32, 0.72, 0, 1)'
                  : 'none',
                transformOrigin: 'center center'
              }}
            >
              <img
                src={(imageSizes[primaryBg || ''] || transitionPhase === 'expanded') ? (primaryBg || '') : (transitionUrl || primaryBg || '')}
                alt="Transition Hero"
                className="absolute inset-0 w-full h-full object-cover"
                // @ts-ignore
                decoding="sync"
                style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', imageOrientation: 'from-image' }}
              />
            </div>
          </div>
        )}

        {!primaryBg && (
          <div className="absolute inset-0 w-full h-full bg-[#1A1B22] flex items-center justify-center">
            <ImageIcon className="text-gray-600 w-16 h-16" />
          </div>
        )}
      </div>

      {/* Touch Interceptor Overlay */}
      {transitionPhase === 'expanded' && (
        <div
          className="absolute inset-0 z-[10005] pointer-events-auto"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}

      <TopControls
        onBack={handleBackAnimated}
        onEdit={handleEdit}
        onDelete={handleDelete}
        title={isEditing ? editTitle : (selectedPhoto.title || selectedPhoto.filename || "Memory")}
        date={isEditing ? editDate : (photoDate ? photoDate.split('T')[0].replace(/-/g, ' ') : 'Unknown date')}
        locationTxt={(() => {
          if (isEditing) return "Edit location..."
          const memory = selectedPhoto as any
          
          const parts = []
          if (memory.country?.name) parts.push(memory.country.name)
          if (memory.admin1?.name) parts.push(memory.admin1.name)
          if (memory.city?.name) parts.push(memory.city.name)
          
          if (parts.length > 0) return parts.join(' · ')
          return memory.locationTxt || 'Unknown place'
        })()}
        uiOpacityClass={uiOpacityClass}
        loveDays={selectedPhoto.loveDays}
        tags={selectedPhoto.memoryTags}
        isEditing={isEditing}
        onCancel={handleCancel}
        onSave={handleSave}
        isSaving={isSaving}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDate={editDate}
        setEditDate={setEditDate}
        editCountry={editCountry}
        setEditCountry={setEditCountry}
        editAdmin1={editAdmin1}
        setEditAdmin1={setEditAdmin1}
        editCity={editCity}
        setEditCity={setEditCity}
        countries={countries}
        admin1s={admin1s}
        cities={cities}
        loadAdmin1s={loadAdmin1s}
        loadCities={loadCities}
        clearAdmin1s={clearAdmin1s}
        clearCities={clearCities}
        editTagId={editTagId}
        setEditTagId={setEditTagId}
        availableTags={availableTags}
      />

      <BottomControls
        description={selectedPhoto.description}
        allImages={allImages}
        activeIndex={activeIndex}
        onImageClick={handleImageClick}
        thumbnailContainerRef={thumbnailContainerRef}
        uiOpacityClass={uiOpacityClass}
        isEditing={isEditing}
        uploads={uploads}
        setUploads={setUploads}
        fileInputRef={fileInputRef}
      />

      {/* Hidden File Input for Image Management */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const newUploads = newFiles.map(file => ({
              id: `new-${Date.now()}-${Math.random()}`,
              file,
              preview: URL.createObjectURL(file),
              progress: 0,
              status: 'pending' as const
            }));
            setUploads(prev => [...prev, ...newUploads]);
          }
        }}
      />
    </div>
  )
}
