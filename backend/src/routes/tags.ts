import { Router } from 'express';
import {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag
} from '../controllers/tagController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// 获取标签列表
router.get('/', getTags);

// 获取单个标签
router.get('/:id', getTagById);

// 创建标签（需要认证）
router.post('/', createTag);

// 更新标签（需要认证）
router.put('/:id', updateTag);

// 删除标签（需要认证）
router.delete('/:id', deleteTag);

export default router;
