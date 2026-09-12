import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Tag, X } from 'lucide-react'

interface TagOption {
  id: string
  name: string
}

interface TagSelectorProps {
  tags: TagOption[]
  selectedTagId: string
  onTagChange: (tagId: string) => void
  required?: boolean
  compact?: boolean
}

export default function TagSelector({
  tags,
  selectedTagId,
  onTagChange,
  required = false,
  compact = false
}: TagSelectorProps) {
  const [showModal, setShowModal] = useState(false)

  const handleTagSelect = (tagId: string) => {
    onTagChange(tagId)
    setShowModal(false)
  }

  const selectedTag = tags.find(t => t.id === selectedTagId)

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowModal(false)
  }

  const handleOpen = () => {
    setShowModal(true)
  }

  return (
    <>
      {/* 标签选择按钮 */}
      {compact ? (
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/90 hover:bg-white/20 transition-all active:scale-95"
        >
          <Tag className="h-3 w-3 text-pink-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {selectedTag?.name || 'Choose a tag'}
          </span>
        </button>
      ) : (
        <div className="tag-section">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
            <Tag className="h-4 w-4 mr-1 text-pink-500 dark:text-pink-400" />
            Tag {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button
            type="button"
            onClick={handleOpen}
            className="w-full px-4 py-3 border border-gray-300 dark:border-[#38383A] rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-[#2C2C2E] text-gray-800 dark:text-white flex items-center justify-between"
          >
            <span className={selectedTag ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-[#8E8E93]'}>
              {selectedTag?.name || 'Choose a tag'}
            </span>
            <Tag className="h-5 w-5 text-gray-400 dark:text-[#8E8E93]" />
          </button>
        </div>
      )}

      {/* 标签选择模态框 - 使用Portal渲染到body */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center animate-fadeIn pointer-events-auto"
          style={{ zIndex: 20000 }}
          onClick={handleClose}
        >
          <div
            className="bg-white dark:bg-[#1C1C1E] rounded-t-3xl w-full max-w-lg max-h-[80vh] flex flex-col animate-slideUp border-t border-white/20 dark:border-[#38383A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#38383A]">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Choose a tag</h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-3 -m-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors pointer-events-auto"
                aria-label="Close"
              >
                <X className="h-6 w-6 text-gray-500 dark:text-[#8E8E93]" />
              </button>
            </div>

            {/* 标签列表 */}
            <div className="flex-1 overflow-y-auto min-h-[300px] p-4">
              <div className="grid grid-cols-2 gap-3">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedTagId === tag.id
                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700 text-white shadow-lg shadow-pink-500/30 dark:shadow-pink-500/50'
                        : 'bg-gray-50 dark:bg-[#2C2C2E] text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#3A3A3C]'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {selectedTagId === tag.id && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>{tag.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

