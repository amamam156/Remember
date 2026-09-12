import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '../services/api'

interface User {
  id: string
  name: string
  role: 'user'
}

interface AuthContextType {
  user: User | null
  login: (password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查本地存储的认证信息
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    // 必须同时存在 user 和 token 才认为是登录状态
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('解析用户数据失败:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    } else {
      // 如果缺少任何一个，清除所有登录信息
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
    setIsLoading(false)
  }, [])

  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ password })
      if (response.success && response.token) {
        // 保存token到localStorage
        localStorage.setItem('token', response.token)
        
        // 使用后端返回的用户数据
        const userData = {
          id: response.user?.id || 'unknown',
          name: response.user?.name || 'User',
          role: 'user' as const
        }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
