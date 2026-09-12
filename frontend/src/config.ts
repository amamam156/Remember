/**
 * 应用配置文件
 * 集中管理所有配置项，便于维护和迁移
 */

// 智能判断API地址：
// 1. 如果有环境变量且非空，使用环境变量
// 2. 如果是开发模式，根据当前访问的host自动判断
//    - localhost -> localhost:3001
//    - 10.0.0.3 -> 10.0.0.3:3001
//    - a public HTTPS host -> its own origin
// 3. 生产环境使用相对路径（如果环境变量为空）
const getApiBaseUrl = () => {
  // 安全访问 import.meta.env
  const meta = import.meta as any
  const envApiBase = meta.env?.VITE_API_BASE
  const isDev = meta.env?.DEV
  const isProd = meta.env?.PROD
  
  // 检查环境变量是否存在且非空
  if (envApiBase && envApiBase.trim() !== '') {
    console.log('🔗 使用环境变量API地址:', envApiBase)
    return envApiBase.trim()
  }
  
  if (isDev) {
    // 开发环境：根据当前host自动判断
    const currentHost = window.location.hostname
    let apiUrl: string
    
    // 如果是公网地址，使用HTTPS
    if (currentHost.includes('synology.me')) {
      apiUrl = `https://${currentHost}`
    } else {
      // 局域网地址，使用HTTP
      apiUrl = `http://${currentHost}:3001`
    }
    
    console.log('🔗 开发模式API地址:', apiUrl, '(host:', currentHost, ')')
    return apiUrl
  }
  
  if (isProd) {
    // 生产环境：如果当前是HTTPS，使用相对路径；否则使用当前域名
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    
    if (protocol === 'https:') {
      console.log('🔗 生产模式使用相对路径（HTTPS）')
      return '' // 使用相对路径
    } else {
      // 如果生产环境不是HTTPS，使用当前域名
      const apiUrl = `${protocol}//${hostname}:3001`
      console.log('🔗 生产模式API地址:', apiUrl)
      return apiUrl
    }
  }
  
  // 默认：使用相对路径
  console.log('🔗 使用相对路径')
  return ''
}

const apiBaseUrl = getApiBaseUrl()

// 开发模式下确保API地址正确
const meta = import.meta as any
if (meta.env?.DEV && (!apiBaseUrl || apiBaseUrl === '')) {
  console.warn('⚠️ API地址为空，使用默认开发地址: http://localhost:3001')
}

export const APP_CONFIG = {
  // API 基础URL
  // 如果 apiBaseUrl 为空字符串，表示使用相对路径（通过 Nginx 代理）
  // 只有在开发环境且没有配置时才使用 localhost
  // API 基础URL
  // 如果 apiBaseUrl 为空字符串，表示使用相对路径（通过 Nginx 或 Vite 代理）
  // 只有在明确配置了环境变量时才使用绝对地址
  apiBaseUrl: apiBaseUrl || '',
  
  // 分页配置
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // 访问量颜色分级阈值
  visitCountThresholds: {
    veryHigh: 10,
    high: 5,
    medium: 3,
  },
} as const

// 最终确认API地址
console.log('✅ API配置已加载:', APP_CONFIG.apiBaseUrl)

export type AppConfig = typeof APP_CONFIG
