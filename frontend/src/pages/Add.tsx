import { useNavigate } from 'react-router-dom'
import { Heart, Hotel, Plus } from 'lucide-react'

export default function Add() {
  const navigate = useNavigate()

  return (
    <div>
      {/* 主要内容区域 */}
      <div className="p-4 space-y-4">
          {/* Add memory按钮 */}
          <button
            onClick={() => navigate('/upload')}
            className="w-full bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl transition-all flex items-center justify-between group border-0 dark:border border-[#38383A]"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mr-4 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-colors">
                <Heart className="w-6 h-6 text-pink-500 dark:text-pink-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Add memory</h3>
                <p className="text-sm text-gray-500 dark:text-[#8E8E93]">Save the moments worth keeping</p>
              </div>
            </div>
            <Plus className="w-5 h-5 text-gray-400 dark:text-[#8E8E93] group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
          </button>

          {/* Add stay按钮 */}
          <button
            onClick={() => navigate('/hotel/upload')}
            className="w-full bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl transition-all flex items-center justify-between group border-0 dark:border border-[#38383A]"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <Hotel className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Add stay</h3>
                <p className="text-sm text-gray-500 dark:text-[#8E8E93]">Keep stays and travel notes together</p>
              </div>
            </div>
            <Plus className="w-5 h-5 text-gray-400 dark:text-[#8E8E93] group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
          </button>
      </div>
    </div>
  )
}

