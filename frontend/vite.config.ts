import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许局域网访问
    port: 3000,
    // 开发环境代理配置（可选，如果需要）
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  // 生产环境构建配置
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭sourcemap以减小体积
    // 优化配置
    rollupOptions: {
      output: {
        // 手动分包，优化缓存
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'lucide-vendor': ['lucide-react'],
        }
      }
    }
  }
})
