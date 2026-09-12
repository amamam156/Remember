import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Eye, EyeOff, Heart, Sparkles } from 'lucide-react'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // 防止页面滚动
  useEffect(() => {
    document.body.classList.add('login-page-active')
    return () => {
      document.body.classList.remove('login-page-active')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(password)
      if (success) {
        navigate('/')
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch (err) {
      setError('Sign-in failed. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 relative overflow-hidden" style={{ paddingTop: 0, marginTop: 0 }}>
      {/* 背景装饰 - 动态渐变球 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 渐变球 1 */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-br from-pink-400/30 to-purple-400/30 dark:from-pink-500/20 dark:to-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob"></div>
        {/* 渐变球 2 */}
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-br from-purple-400/30 to-blue-400/30 dark:from-purple-500/20 dark:to-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        {/* 渐变球 3 */}
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-pink-400/30 dark:from-blue-500/20 dark:to-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* 浮动的心形和星星 */}
        <div className="absolute top-20 left-10 text-pink-400/20 dark:text-pink-400/10 animate-float">
          <Heart className="w-8 h-8" fill="currentColor" />
        </div>
        <div className="absolute top-40 right-16 text-purple-400/20 dark:text-purple-400/10 animate-float animation-delay-1000">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="absolute bottom-32 left-16 text-blue-400/20 dark:text-blue-400/10 animate-float animation-delay-2000">
          <Heart className="w-6 h-6" fill="currentColor" />
        </div>
        <div className="absolute bottom-20 right-20 text-pink-400/20 dark:text-pink-400/10 animate-float animation-delay-3000">
          <Sparkles className="w-8 h-8" />
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 py-8" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)' }}>
        <div className="w-full max-w-md mx-auto">
          {/* Logo 和标题区域 - Liquid Glass 效果 */}
          <div className="text-center mb-8">
            {/* Logo 容器 */}
            <div className="relative inline-block mb-6">
              <div className="relative w-24 h-24 mx-auto">
                {/* 毛玻璃背景 */}
                <div className="absolute inset-0 bg-white/20 dark:bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl overflow-hidden">
                  {/* 内部光泽 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/20 opacity-50" />
                  {/* 底部光泽线 */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/30 to-transparent" />
                </div>
                {/* Logo 图标 */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img 
                    src="/remember-mark.svg"
                    alt="Remember logo"
                    className="w-full h-full object-contain animate-pulse-slow"
                  />
                </div>
              </div>
              {/* 光晕效果 */}
              <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 dark:from-pink-500 dark:via-purple-500 dark:to-blue-500"></div>
            </div>
            
            {/* 标题 */}
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Remember
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Keep the days that matter within reach.
            </p>
          </div>

          {/* 登录卡片 - Liquid Glass 效果 */}
          <div className="relative">
            {/* 毛玻璃背景 */}
            <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
              {/* 内部光泽 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/10 opacity-50" />
              {/* 底部光泽线 */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-gray-600/60 to-transparent" />
            </div>

            {/* 卡片内容 */}
            <div className="relative p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 密码输入框 */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    Password
                  </label>
                  <div className="relative group">
                    {/* 输入框毛玻璃背景 */}
                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-700/50 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-600/60 group-focus-within:border-pink-400 dark:group-focus-within:border-pink-500 transition-all shadow-lg overflow-hidden">
                      {/* 内部光泽 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent dark:from-white/5 opacity-50" />
                    </div>
                    
                    {/* 图标 */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    
                    {/* 输入框 */}
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative w-full pl-12 pr-12 py-4 bg-transparent border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 text-base font-medium z-10"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    
                    {/* 显示/隐藏密码按钮 */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 group/btn"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover/btn:text-pink-500 dark:group-hover/btn:text-pink-400 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover/btn:text-pink-500 dark:group-hover/btn:text-pink-400 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-xl border border-red-200 dark:border-red-800/50"></div>
                    <div className="relative px-4 py-3 flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 登录按钮 */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full group overflow-hidden rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {/* 按钮背景 - 渐变 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 dark:from-pink-600 dark:via-purple-600 dark:to-blue-600"></div>
                  {/* 悬停光泽效果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {/* 按钮内容 */}
                  <div className="relative px-6 py-4 flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-200"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-400"></div>
                      </div>
                    ) : (
                      <span className="text-white font-semibold text-base flex items-center">
                        <Heart className="w-5 h-5 mr-2" fill="currentColor" />
                        Open Remember
                      </span>
                    )}
                  </div>
                </button>
              </form>
              
              {/* 提示文字 */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  <Lock className="w-4 h-4 mr-2" />
                  A private space for the moments you share
                </p>
              </div>
            </div>
          </div>

          {/* 底部装饰 */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Made with 💕 for us
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
