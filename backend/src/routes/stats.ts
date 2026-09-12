import { Router } from 'express';
import {
  getCountryStats,
  getAdmin1Stats,
  getCityStats,
  getSummaryStats
} from '../controllers/statsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// 国家统计
router.get('/countries', getCountryStats);

// 省份/州统计
router.get('/admin1', getAdmin1Stats);

// 城市统计
router.get('/cities', getCityStats);

// 综合统计
router.get('/summary', getSummaryStats);

export default router;
