import { Router } from 'express';
import {
  createMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory
} from '../controllers/memoryController.js';
import { validateMemory, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 相册内容是私密数据，所有读取和写入都必须登录。
router.use(authenticateToken);

// 获取回忆列表（支持分页和筛选）
router.get('/', getMemories);

// 获取单个回忆详情
router.get('/:id', getMemoryById);

// 创建回忆（需要认证）
router.post('/', 
  validateMemory,
  handleValidationErrors,
  createMemory
);

// 更新回忆（需要认证）
router.put('/:id',
  validateMemory,
  handleValidationErrors,
  updateMemory
);

// 删除回忆（需要认证）
router.delete('/:id',
  deleteMemory
);

export default router;
