import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { upload, processImage } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 上传图片（需要认证）
router.post('/',
  authenticateToken,
  upload.single('image'),
  processImage,
  uploadImage
);

export default router;
