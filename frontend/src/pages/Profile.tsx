import { useAuth } from '../contexts/AuthContext'
import { User, LogOut } from 'lucide-react'

export default function Profile() {
  const { logout } = useAuth()

  const handleLogout = () => {
    if (window.confirm('Sign out of Remember?')) {
      logout()
    }
  }

  return (
    <div>
      {/* 用户信息卡片 */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Remember user</h2>
              <p className="text-sm text-gray-500">Private journal member</p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-500">0</div>
              <div className="text-xs text-gray-500 mt-1">Memories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">0</div>
              <div className="text-xs text-gray-500 mt-1">Places</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">0</div>
              <div className="text-xs text-gray-500 mt-1">Photos</div>
            </div>
          </div>
        </div>

        {/* 功能列表 */}
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
        </div>

        {/* Sign out按钮 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </div>
  )
}

