import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from './routes/auth.js';
import memoryRoutes from './routes/memories.js';
import uploadRoutes from './routes/upload.js';
import locationRoutes from './routes/locations.js';
import tagRoutes from './routes/tags.js';
import geoRoutes from './routes/geo.js';
import statsRoutes from './routes/stats.js';
import mapRoutes from './routes/map.js';
import hotelRoutes from './routes/hotels.js';
import hardTimeRoutes from './routes/hardTimes.js';
import countdownRoutes from './routes/countdown.js';

// 加载环境变量
dotenv.config();

const app = express();

// 安全中间件 - 配置helmet允许跨域资源访问
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // 允许跨域访问资源（图片等）
  contentSecurityPolicy: process.env.NODE_ENV === 'production', // 生产环境启用CSP
}));

// CORS配置 - 根据环境变量配置
const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : true; // 开发环境允许所有来源

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Content-Disposition'],
  maxAge: 86400 // 预检请求缓存24小时
}));

// 请求日志
app.use(morgan('combined'));

// 静态文件服务（用于访问上传的图片）
// 添加缓存策略，图片缓存 1 天
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1d',
  immutable: true,
  setHeaders: (res, filePath) => {
    // 为图片设置缓存控制
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    }
  }
}));

// 速率限制已完全移除，提升用户体验

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由 - 统一使用 /api 前缀
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/hard-times', hardTimeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/countdown', countdownRoutes);

// 健康检查端点
app.get('/api/health', (_req, res) => {
  return res.json({ ok: true });
});

// 404处理
app.use('*', (_req, res) => {
  return res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: '文件大小超出限制'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: '不支持的文件类型'
    });
  }

  return res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default app;
