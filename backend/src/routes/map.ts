import express from 'express';
import * as mapController from '../controllers/mapController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/map/world?lang=zh - 获取世界地图统计
router.get('/world', mapController.getWorldMapData);

// GET /api/map/country/:code?lang=zh - 获取国家地图统计
router.get('/country/:code', mapController.getCountryMapData);

// GET /api/map/memories/:regionId?lang=zh&isCountry=false - 获取区域回忆
router.get('/memories/:regionId', mapController.getRegionMemories);

export default router;
