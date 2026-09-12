import { Router } from 'express'
import {
  createRecord,
  getRecords,
  getRecordByDate,
  updateRecord,
  deleteRecord
} from '../controllers/hardTimeController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// 获取记录列表（支持日期范围筛选）
router.get('/', authenticateToken, getRecords)

// 获取指定日期的记录
router.get('/:date', authenticateToken, getRecordByDate)

// 创建记录（需要认证）
router.post('/', authenticateToken, createRecord)

// 更新记录（需要认证）
router.put('/:id', authenticateToken, updateRecord)

// 删除记录（需要认证）
router.delete('/:id', authenticateToken, deleteRecord)

export default router

