import { Router } from 'express';
import {
  getCountries,
  getAdmin1sByCountry,
  getCitiesByAdmin1,
  getCitiesByCountry,
  getLocationHierarchy
} from '../controllers/locationController.js';

const router = Router();

// 获取所有国家
router.get('/countries', getCountries);

// 根据国家获取省份/州
router.get('/countries/:countryId/admin1s', getAdmin1sByCountry);

// 根据省份/州获取城市
router.get('/admin1s/:admin1Id/cities', getCitiesByAdmin1);

// 根据国家获取城市
router.get('/countries/:countryId/cities', getCitiesByCountry);

// 获取位置层级信息
router.get('/hierarchy', getLocationHierarchy);

export default router;
