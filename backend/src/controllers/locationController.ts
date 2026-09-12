import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        admin1s: {
          orderBy: { name: 'asc' }
        },
        cities: {
          orderBy: { name: 'asc' }
        }
      }
    });

    return res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('获取国家列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getAdmin1sByCountry = async (req: Request, res: Response) => {
  try {
    const { countryId } = req.params;
    
    const admin1s = await prisma.admin1.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
      include: {
        country: true,
        cities: {
          orderBy: { name: 'asc' }
        }
      }
    });

    return res.json({
      success: true,
      data: admin1s
    });
  } catch (error) {
    console.error('获取省份/州列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getCitiesByAdmin1 = async (req: Request, res: Response) => {
  try {
    const { admin1Id } = req.params;
    
    const cities = await prisma.city.findMany({
      where: { admin1Id },
      orderBy: { name: 'asc' },
      include: {
        country: true,
        admin1: true
      }
    });

    return res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('获取城市列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getCitiesByCountry = async (req: Request, res: Response) => {
  try {
    const { countryId } = req.params;
    
    const cities = await prisma.city.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
      include: {
        country: true,
        admin1: true
      }
    });

    return res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('获取城市列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getLocationHierarchy = async (req: Request, res: Response) => {
  try {
    const { countryId, admin1Id, cityId } = req.query;
    
    const result: any = {};
    
    if (countryId) {
      result.country = await prisma.country.findUnique({
        where: { id: countryId as string }
      });
    }
    
    if (admin1Id) {
      result.admin1 = await prisma.admin1.findUnique({
        where: { id: admin1Id as string },
        include: { country: true }
      });
    }
    
    if (cityId) {
      result.city = await prisma.city.findUnique({
        where: { id: cityId as string },
        include: {
          country: true,
          admin1: true
        }
      });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取位置层级错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};
