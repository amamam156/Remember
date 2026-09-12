import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export const getCountryStats = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const where: any = {};
    
    if (from || to) {
      where.happenedAt = {};
      if (from) where.happenedAt.gte = from as string;
      if (to) where.happenedAt.lte = to as string;
    }

    const memories = await prisma.memory.findMany({
      where,
      select: {
        country: {
          select: { iso2: true }
        }
      }
    });

    const stats: Record<string, number> = {};
    memories.forEach(memory => {
      const countryCode = memory.country.iso2.toLowerCase();
      stats[countryCode] = (stats[countryCode] || 0) + 1;
    });

    return res.json(stats);
  } catch (error) {
    console.error('获取国家统计错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const getAdmin1Stats = async (req: Request, res: Response) => {
  try {
    const { country, from, to } = req.query;
    
    if (!country) {
      return res.status(400).json({ error: '缺少country参数' });
    }

    const where: any = {
      country: { iso2: country as string }
    };
    
    if (from || to) {
      where.happenedAt = {};
      if (from) where.happenedAt.gte = from as string;
      if (to) where.happenedAt.lte = to as string;
    }

    const memories = await prisma.memory.findMany({
      where,
      select: {
        admin1: {
          select: { name: true }
        }
      }
    });

    const stats: Record<string, number> = {};
    memories.forEach(memory => {
      if (memory.admin1) {
        const admin1Name = memory.admin1.name;
        stats[admin1Name] = (stats[admin1Name] || 0) + 1;
      }
    });

    return res.json(stats);
  } catch (error) {
    console.error('获取省份/州统计错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const getCityStats = async (req: Request, res: Response) => {
  try {
    const { country, admin1, from, to } = req.query;
    
    if (!country) {
      return res.status(400).json({ error: '缺少country参数' });
    }

    const where: any = {
      country: { iso2: country as string }
    };

    if (admin1) {
      where.admin1 = { name: admin1 as string };
    }
    
    if (from || to) {
      where.happenedAt = {};
      if (from) where.happenedAt.gte = from as string;
      if (to) where.happenedAt.lte = to as string;
    }

    const memories = await prisma.memory.findMany({
      where,
      select: {
        city: {
          select: { name: true }
        }
      }
    });

    const stats: Record<string, number> = {};
    memories.forEach(memory => {
      if (memory.city) {
        const cityName = memory.city.name;
        stats[cityName] = (stats[cityName] || 0) + 1;
      }
    });

    return res.json(stats);
  } catch (error) {
    console.error('获取城市统计错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const getSummaryStats = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const where: any = {};
    
    if (from || to) {
      where.happenedAt = {};
      if (from) where.happenedAt.gte = from as string;
      if (to) where.happenedAt.lte = to as string;
    }

    const memories = await prisma.memory.findMany({
      where,
      select: {
        country: {
          select: { iso2: true, name: true }
        },
        admin1: {
          select: { name: true }
        },
        city: {
          select: { name: true }
        }
      }
    });

    const countryStats: Record<string, number> = {};
    const admin1Stats: Record<string, Record<string, number>> = {};
    const cityStats: Record<string, Record<string, Record<string, number>>> = {};

    memories.forEach(memory => {
      const countryCode = memory.country.iso2.toLowerCase();
      
      countryStats[countryCode] = (countryStats[countryCode] || 0) + 1;

      if (memory.admin1) {
        const admin1Name = memory.admin1.name;
        
        if (!admin1Stats[countryCode]) admin1Stats[countryCode] = {};
        admin1Stats[countryCode][admin1Name] = (admin1Stats[countryCode][admin1Name] || 0) + 1;

        if (memory.city) {
          const cityName = memory.city.name;
          
          if (!cityStats[countryCode]) cityStats[countryCode] = {};
          if (!cityStats[countryCode][admin1Name]) cityStats[countryCode][admin1Name] = {};
          cityStats[countryCode][admin1Name][cityName] = (cityStats[countryCode][admin1Name][cityName] || 0) + 1;
        }
      }
    });

    return res.json({
      countries: countryStats,
      admin1s: admin1Stats,
      cities: cityStats
    });
  } catch (error) {
    console.error('获取综合统计错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};
