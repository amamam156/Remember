import type { Request, Response } from 'express';
import * as mapDataService from '../services/mapDataService.js';

/**
 * GET /api/map/world
 * 获取世界地图的统计数据
 */
export const getWorldMapData = async (req: Request, res: Response) => {
  try {
    const statistics = await mapDataService.getWorldMapStatistics();

    return res.json({
      statistics: {
        countries: statistics
      }
    });
  } catch (error) {
    console.error('获取世界地图数据错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

/**
 * GET /api/map/country/:code
 * 获取国家地图的统计数据
 */
export const getCountryMapData = async (req: Request, res: Response) => {
  const { code } = req.params;
  
  try {
    if (!code) {
      return res.status(400).json({ error: '缺少国家代码参数' });
    }

    const data = await mapDataService.getCountryMapStatistics(code.toUpperCase());
    
    if (!data || !data.country) {
      return res.status(404).json({ 
        error: 'No data found for this country',
        countryCode: code 
      });
    }

    return res.json(data);
  } catch (error: any) {
    console.error('获取国家地图数据错误:', error);
    if (error.message === '国家不存在') {
      return res.status(404).json({ error: '国家不存在', countryCode: code });
    }
    return res.status(500).json({ 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/map/memories/:regionId?isCountry=false
 * 获取区域的回忆数据
 */
export const getRegionMemories = async (req: Request, res: Response) => {
  const { regionId } = req.params;
  
  try {
    const isCountryLevel = req.query.isCountry === 'true';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    
    if (!regionId) {
      return res.status(400).json({ error: '缺少区域ID参数' });
    }

    const data = await mapDataService.getRegionMemories(regionId, isCountryLevel, page, limit);

    return res.json(data);
  } catch (error: any) {
    console.error('获取区域回忆数据错误:', error);
    if (error.message === '国家不存在' || error.message === '区域不存在') {
      return res.status(404).json({ 
        error: error.message,
        regionId 
      });
    }
    return res.status(500).json({ 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
