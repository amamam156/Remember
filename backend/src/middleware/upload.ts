import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadPath = path.join(uploadDir, year.toString(), month);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const timestamp = now.getTime(); // Unix 时间戳（毫秒）
    const randomSuffix = Math.random().toString(36).substring(2, 8); // 6位随机字符
    const ext = path.extname(file.originalname).toLowerCase();
    // 格式: timestamp_randomSuffix.ext (例如: 1699142345678_a3f2k1.jpg)
    cb(null, `${timestamp}_${randomSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

// 创建multer实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  }
});

// 图片处理中间件
export const processImage = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // 生成处理后的主图路径（压缩优化）
  const baseName = path.basename(filePath, path.extname(filePath));
  const processedPath = path.join(path.dirname(filePath), `${baseName}_processed.jpg`);
  
  try {
    // 仅处理主图：最大1920px，质量85%
    await sharp(filePath, { limitInputPixels: 40_000_000 })
      .rotate() // 自动根据EXIF方向旋转图片
      .resize(1920, 1920, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toFile(processedPath);

    // 验证文件已成功创建
    if (!fs.existsSync(processedPath)) {
      console.error('图片处理失败:输出文件不存在');
      throw new Error('图片处理失败:输出文件未生成');
    }

    // 只有在处理成功后才删除原始文件
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.warn('删除原始文件失败:', unlinkError);
      // 不影响主流程,继续执行
    }
    
    // 更新文件信息
    req.file.path = processedPath;
    req.file.filename = path.basename(processedPath);
    req.file.imageUrl = `/uploads/${year}/${month}/${req.file.filename}`;
    // 现在 thumbnailUrl 直接指向 processedPath，不再单独生成缩略图，避免模糊
    req.file.thumbnailUrl = req.file.imageUrl;

    next();
  } catch (error) {
    console.error('图片处理失败:', error);
    // 处理失败时,确保清理可能的部分文件
    try {
      if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
    } catch (cleanupError) {
      console.error('清理失败文件时出错:', cleanupError);
    }
    return res.status(500).json({
      success: false,
      message: '图片处理失败,请重试'
    });
  }
};
