import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        iso2: true,
        name: true,
        latitude: true,
        longitude: true
      }
    });

    // 将中国和美国排在最前面
    const china = countries.find(c => c.iso2 === 'CN');
    const usa = countries.find(c => c.iso2 === 'US');
    const others = countries.filter(c => c.iso2 !== 'CN' && c.iso2 !== 'US');

    const result = [
      ...(china ? [china] : []),
      ...(usa ? [usa] : []),
      ...others
    ];

    return res.json(result);
  } catch (error) {
    console.error('获取国家列表错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const getAdmin1s = async (req: Request, res: Response) => {
  try {
    const { country } = req.query;
    
    if (!country) {
      return res.status(400).json({ error: '缺少country参数' });
    }

    const admin1s = await prisma.admin1.findMany({
      where: {
        OR: [
          { countryId: country as string },
          { country: { iso2: country as string } }
        ]
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });

    return res.json(admin1s);
  } catch (error) {
    console.error('获取省份/州列表错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const getCities = async (req: Request, res: Response) => {
  try {
    const { country, admin1 } = req.query;
    
    if (!country) {
      return res.status(400).json({ error: '缺少country参数' });
    }

    const where: any = {
      OR: [
        { countryId: country as string },
        { country: { iso2: country as string } }
      ]
    };

    if (admin1) {
      where.OR = [
        { 
          countryId: country as string,
          admin1Id: admin1 as string
        },
        {
          countryId: country as string,
          admin1: { name: admin1 as string }
        },
        {
          country: { iso2: country as string },
          admin1Id: admin1 as string
        },
        {
          country: { iso2: country as string },
          admin1: { name: admin1 as string }
        }
      ];
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        isMunicipality: true,
        latitude: true,
        longitude: true
      }
    });

    return res.json(cities);
  } catch (error) {
    console.error('获取城市列表错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

// 全局搜索地点（国家、省份、城市）
export const searchLocations = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ error: '缺少搜索关键词' });
    }

    const query = q.trim();
    const results: any[] = [];
    const searchPattern = `%${query}%`;

    // 搜索国家
    const countries = await prisma.$queryRaw<Array<{
      id: string;
      iso2: string;
      name: string;
      latitude: number | null;
      longitude: number | null;
    }>>`
      SELECT id, iso2, name, latitude, longitude
      FROM countries
      WHERE LOWER(name) LIKE LOWER(${searchPattern})
      LIMIT 20
    `;

    countries.forEach(country => {
      results.push({
        type: 'country',
        id: country.id,
        name: country.name,
        iso2: country.iso2, // 新增
        fullPath: country.name,
        country: { id: country.id, name: country.name, iso2: country.iso2 }
      });
    });

    // 搜索省份
    const admin1sRaw = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      countryId: string;
      country_name: string;
      country_iso2: string; // 新增
    }>>`
      SELECT 
        a.id, a.name, a."countryId",
        c.name as country_name,
        c.iso2 as country_iso2
      FROM admin1s a
      INNER JOIN countries c ON a."countryId" = c.id
      WHERE LOWER(a.name) LIKE LOWER(${searchPattern})
      LIMIT 30
    `;

    admin1sRaw.forEach(admin1 => {
      results.push({
        type: 'admin1',
        id: admin1.id,
        name: admin1.name,
        fullPath: `${admin1.country_name} > ${admin1.name}`,
        country: { id: admin1.countryId, name: admin1.country_name, iso2: admin1.country_iso2 },
        admin1: { id: admin1.id, name: admin1.name }
      });
    });

    // 搜索城市
    const citiesRaw = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      countryId: string;
      admin1Id: string | null;
      country_name: string;
      country_iso2: string; // 新增
      admin1_name: string | null;
    }>>`
      SELECT 
        ci.id, ci.name, ci."countryId", ci."admin1Id",
        c.name as country_name,
        c.iso2 as country_iso2,
        a.name as admin1_name
      FROM cities ci
      INNER JOIN countries c ON ci."countryId" = c.id
      LEFT JOIN admin1s a ON ci."admin1Id" = a.id
      WHERE LOWER(ci.name) LIKE LOWER(${searchPattern})
      LIMIT 50
    `;

    citiesRaw.forEach(city => {
      const fullPath = city.admin1_name 
        ? `${city.country_name} > ${city.admin1_name} > ${city.name}`
        : `${city.country_name} > ${city.name}`;

      results.push({
        type: 'city',
        id: city.id,
        name: city.name,
        fullPath,
        country: { id: city.countryId, name: city.country_name, iso2: city.country_iso2 },
        admin1: city.admin1Id ? { id: city.admin1Id, name: city.admin1_name } : undefined
      });
    });

    // 按相关性排序
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const typeOrder: Record<string, number> = { country: 0, admin1: 1, city: 2 };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      if (typeDiff !== 0) return typeDiff;
      
      return a.name.length - b.name.length;
    });

    return res.json(results.slice(0, 50));
  } catch (error) {
    console.error('搜索地点错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const createCountry = async (req: Request, res: Response) => {
  try {
    const { iso2, name } = req.body;

    if (!iso2 || !name) {
      return res.status(400).json({ error: '缺少必填字段：iso2, name' });
    }

    const existing = await prisma.country.findUnique({ where: { iso2 } });
    if (existing) {
      return res.status(409).json({ error: '该国家已存在', data: existing });
    }

    const country = await prisma.country.create({
      data: {
        iso2,
        name
      }
    });

    return res.status(201).json({ success: true, data: country });
  } catch (error: any) {
    console.error('创建国家错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const createAdmin1 = async (req: Request, res: Response) => {
  try {
    const { countryId, name, latitude, longitude } = req.body;

    if (!countryId || !name) {
      return res.status(400).json({ error: '缺少必填字段：countryId, name' });
    }

    let country = await prisma.country.findUnique({ where: { id: countryId } });
    if (!country) {
      country = await prisma.country.findUnique({ where: { iso2: countryId } });
    }

    if (!country) {
      return res.status(404).json({ error: '找不到指定的国家' });
    }

    const admin1 = await prisma.admin1.create({
      data: {
        countryId: country.id,
        name,
        latitude: latitude || null,
        longitude: longitude || null
      }
    });

    return res.status(201).json({ success: true, data: admin1 });
  } catch (error: any) {
    console.error('创建省份/州/地区错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const createCity = async (req: Request, res: Response) => {
  try {
    const { countryId, admin1Id, name, isMunicipality } = req.body;

    if (!countryId || !name) {
      return res.status(400).json({ error: '缺少必填字段：countryId, name' });
    }

    let country = await prisma.country.findUnique({ where: { id: countryId } });
    if (!country) {
      country = await prisma.country.findUnique({ where: { iso2: countryId } });
    }

    if (!country) {
      return res.status(404).json({ error: '找不到指定的国家' });
    }

    let admin1 = null;
    if (admin1Id) {
      admin1 = await prisma.admin1.findUnique({ where: { id: admin1Id } });
      if (!admin1) {
        admin1 = await prisma.admin1.findFirst({
          where: { name: admin1Id, countryId: country.id }
        });
      }
    }

    // 规范化查重逻辑：针对中国城市，防止“长春”和“长春市”重复
    const isChinese = country.iso2 === 'CN';
    if (isChinese) {
      const baseName = name.replace(/[市县区镇村]$/, '');
      const existingCity = await prisma.city.findFirst({
        where: {
          countryId: country.id,
          admin1Id: admin1?.id || null,
          OR: [
            { name: baseName },
            { name: `${baseName}市` },
            { name: `${baseName}县` },
            { name: `${baseName}区` }
          ]
        }
      });

      if (existingCity) {
        return res.status(409).json({ 
          error: `城市 '${name}' 已存在 (匹配到: ${existingCity.name})`, 
          data: existingCity 
        });
      }
    } else {
      // 非中国城市，执行普通查重
      const existingCity = await prisma.city.findFirst({
        where: {
          countryId: country.id,
          admin1Id: admin1?.id || null,
          name: name
        }
      });
      if (existingCity) {
        return res.status(409).json({ error: '该城市已存在', data: existingCity });
      }
    }

    const city = await prisma.city.create({
      data: {
        countryId: country.id,
        admin1Id: admin1?.id || null,
        name,
        isMunicipality: isMunicipality || false,
        latitude: req.body.latitude || null,
        longitude: req.body.longitude || null
      }
    });

    return res.status(201).json({ success: true, data: city });
  } catch (error: any) {
    console.error('创建城市错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const updateCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isMunicipality, latitude, longitude, admin1Id } = req.body;

    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        isMunicipality,
        latitude,
        longitude,
        admin1Id: admin1Id || null
      }
    });

    return res.json({ success: true, data: city });
  } catch (error: any) {
    console.error('更新城市错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const deleteCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.city.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('删除城市错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const updateAdmin1 = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude } = req.body;

    const admin1 = await prisma.admin1.update({
      where: { id },
      data: {
        name,
        latitude,
        longitude
      }
    });

    return res.json({ success: true, data: admin1 });
  } catch (error: any) {
    console.error('更新省份错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const deleteAdmin1 = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.admin1.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('删除省份错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const updateCountry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, iso2, latitude, longitude } = req.body;

    const country = await prisma.country.update({
      where: { id },
      data: {
        name,
        iso2,
        latitude,
        longitude
      }
    });

    return res.json({ success: true, data: country });
  } catch (error: any) {
    console.error('更新国家错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

export const deleteCountry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.country.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('删除国家错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};
