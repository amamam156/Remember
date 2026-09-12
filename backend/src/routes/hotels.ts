import { Router } from 'express';
import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel
} from '../controllers/hotelController.js';
import { validateHotel, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// 获取酒店列表（支持分页和筛选）
router.get('/', getHotels);

// 获取单个酒店详情
router.get('/:id', getHotelById);

// 创建酒店（需要认证）
router.post('/', 
  validateHotel,
  handleValidationErrors,
  createHotel
);

// 更新酒店（需要认证）
router.put('/:id',
  validateHotel,
  handleValidationErrors,
  updateHotel
);

// 删除酒店（需要认证）
router.delete('/:id',
  deleteHotel
);

export default router;
