import { Router } from 'express';
import {
  getCountries,
  getAdmin1s,
  getCities,
  searchLocations,
  createCountry,
  createAdmin1,
  createCity,
  updateCountry,
  deleteCountry,
  updateAdmin1,
  deleteAdmin1,
  updateCity,
  deleteCity
} from '../controllers/geoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 获取所有国家
router.get('/countries', getCountries);

// 根据国家获取省份/州
router.get('/admin1', getAdmin1s);

// 根据国家和省份/州获取城市
router.get('/cities', getCities);

// 全局搜索地点（国家、省份、城市）
router.get('/search', searchLocations);

// 管理地点（需要认证）
router.post('/countries', authenticateToken, createCountry);
router.put('/countries/:id', authenticateToken, updateCountry);
router.delete('/countries/:id', authenticateToken, deleteCountry);

router.post('/admin1', authenticateToken, createAdmin1);
router.put('/admin1/:id', authenticateToken, updateAdmin1);
router.delete('/admin1/:id', authenticateToken, deleteAdmin1);

router.post('/cities', authenticateToken, createCity);
router.put('/cities/:id', authenticateToken, updateCity);
router.delete('/cities/:id', authenticateToken, deleteCity);

export default router;
