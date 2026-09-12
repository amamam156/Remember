import { useEffect, useState } from 'react'
import { usePhotos } from '../contexts/PhotoContext'
import GlobeMap from '../components/GlobeMap'
import { Heart } from 'lucide-react'

const LoveMemories = () => {
  const { photos, isLoading, loadPhotos } = usePhotos()
  const [hasInitiatedLoad, setHasInitiatedLoad] = useState(false)

  useEffect(() => {
    // If photos are empty and we haven't loaded yet, try to load
    if (!hasInitiatedLoad && photos.length === 0) {
      setHasInitiatedLoad(true)
      loadPhotos()
    }
  }, [hasInitiatedLoad, photos.length, loadPhotos])

  // Inform TopNav to hide the back button
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('love-memories-show-back', {
        detail: { show: false }
      }))
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading && photos.length === 0) {
    return (
      <div className="love-memories-page bg-[#0B0C10] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-white border-white/20 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Loading memory map...</p>
        </div>
      </div>
    )
  }

  if (!isLoading && photos.length === 0) {
    return (
      <div className="love-memories-page bg-[#0B0C10] min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-[#1A1B22]/80 backdrop-blur-md rounded-3xl border border-white/5">
          <Heart className="h-16 w-16 text-gray-300 dark:text-[#8E8E93] mx-auto mb-4" />
          <p className="text-gray-500 dark:text-[#8E8E93]">No memories yet</p>
          <p className="text-gray-400 dark:text-[#8E8E93]/70 text-sm mt-2">Add a memory to begin building your map.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="love-memories-page fixed inset-0 bg-[#0B0C10] overflow-hidden overscroll-none">
      <GlobeMap photos={photos} />
    </div>
  )
}

export default LoveMemories
