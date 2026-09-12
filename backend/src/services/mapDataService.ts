import { prisma } from '../database/prisma.js';
import { countryCodeToMapFolder } from '../config/mapIdMappings.js';

// 计算相恋天数
const RELATIONSHIP_START_DATE = '2018-05-19';
const calculateLoveDays = (dateString: string): number => {
  try {
    const datePart = dateString.split('T')[0].split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const [startYear, startMonth, startDay] = RELATIONSHIP_START_DATE.split('-').map(Number);
    
    const date1 = new Date(Date.UTC(year, month - 1, day));
    const date2 = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    const diffTime = date1.getTime() - date2.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return days;
  } catch (error) {
    console.error('计算相恋天数时出错:', error, 'dateString:', dateString);
    return 0;
  }
};

export interface CountryStatistic {
  id: string;           // 地图ID（小写）如 'cn', 'us'
  code: string;         // ISO2 代码
  name: string;         // 显示名称
  visitCount: number;
}

export interface RegionStatistic {
  id: string;          // 地图ID，如 'beijing', 'il'
  code: string;        // admin1Code，如 'CN-BJ', 'US-IL'
  name: string;        // 显示名称
  visitCount: number;
}

export interface MemoriesByCity {
  [cityName: string]: any[];
}

/**
 * 获取世界地图的统计数据
 */
export async function getWorldMapStatistics(): Promise<CountryStatistic[]> {
  const memories = await prisma.memory.findMany({
    select: {
      country: {
        select: {
          iso2: true,
          name: true
        }
      }
    }
  });

  const countryStats: Record<string, { count: number; name: string; code: string }> = {};
  
  memories.forEach(memory => {
    const countryCode = memory.country.iso2.toLowerCase();
    
    if (!countryStats[countryCode]) {
      countryStats[countryCode] = { 
        count: 0, 
        name: memory.country.name,
        code: memory.country.iso2
      };
    }
    countryStats[countryCode].count++;
  });

  return Object.entries(countryStats).map(([id, data]) => ({
    id,
    code: data.code,
    name: data.name,
    visitCount: data.count
  }));
}

/**
 * 获取国家地图的统计数据
 * @param countryCode 国家代码（如 'CN', 'US'）
 */
export async function getCountryMapStatistics(
  countryCode: string
): Promise<{
  country: { code: string; name: string; totalVisits: number; mapFolder: string };
  regions: RegionStatistic[];
  allRegionNames: Record<string, string>;
}> {
  let country = await prisma.country.findUnique({
    where: { iso2: countryCode.toUpperCase() }
  });

  if (!country) {
    country = await prisma.country.findFirst({
      where: { iso2: countryCode.toUpperCase() }
    });
  }

  let isVirtualCountry = false;
  if (!country) {
    const mapFolder = countryCodeToMapFolder[countryCode.toUpperCase()];
    if (!mapFolder) {
      throw new Error('国家不存在');
    }
    
    isVirtualCountry = true;
    country = {
      id: `virtual-${countryCode.toUpperCase()}`,
      iso2: countryCode.toUpperCase(),
      name: countryCode.toUpperCase()
    } as any;
  }

  const mapFolder = countryCodeToMapFolder[country!.iso2] || country!.iso2.toLowerCase();

  if (isVirtualCountry) {
    return {
      country: {
        code: country!.iso2,
        name: country!.name,
        totalVisits: 0,
        mapFolder
      },
      regions: [],
      allRegionNames: {}
    };
  }

  const allAdmin1s = await prisma.admin1.findMany({
    where: { countryId: country!.id },
    select: {
      id: true,
      name: true
    }
  });

  const allRegionNames: Record<string, string> = {};
  allAdmin1s.forEach(admin1 => {
    allRegionNames[admin1.id] = admin1.name;
  });

  const memories = await prisma.memory.findMany({
    where: { countryId: country!.id },
    select: {
      admin1: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  const regionStats: Record<string, { code: string; name: string; count: number }> = {};
  
  memories.forEach(memory => {
    if (memory.admin1) {
      const admin1Id = memory.admin1.id;
      const name = memory.admin1.name;
      
      if (!regionStats[admin1Id]) {
        regionStats[admin1Id] = { code: admin1Id, name, count: 0 };
      }
      regionStats[admin1Id].count++;
    }
  });

  return {
    country: {
      code: country!.iso2,
      name: country!.name,
      totalVisits: memories.length,
      mapFolder
    },
    regions: Object.entries(regionStats).map(([id, data]) => ({
      id,
      code: data.code,
      name: data.name,
      visitCount: data.count
    })),
    allRegionNames
  };
}

/**
 * 获取区域的回忆数据，按城市分组
 * @param regionId 区域ID（可以是国家代码或地图ID）
 * @param isCountryLevel 是否是国家层面
 */
export async function getRegionMemories(
  regionId: string,
  isCountryLevel: boolean = false,
  page?: number,
  limit?: number
): Promise<{
  region: { id: string; name: string };
  memoriesByCity?: MemoriesByCity;
  memories?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  let regionName = regionId;
  let memories: any[];

  if (isCountryLevel) {
    const country = await prisma.country.findFirst({
      where: {
        OR: [
          { iso2: regionId.toUpperCase() },
          { iso2: regionId.toLowerCase() }
        ]
      }
    });

    if (!country) {
      if (page !== undefined && limit !== undefined) {
        return {
          region: { id: regionId, name: regionId },
          memories: [],
          pagination: { page, limit, total: 0, pages: 0 }
        };
      }
      return { region: { id: regionId, name: regionId }, memoriesByCity: {} };
    }

    regionName = country.name;

    const total = await prisma.memory.count({ where: { countryId: country.id } });

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      memories = await prisma.memory.findMany({
        where: { countryId: country.id },
        skip,
        take: limit,
        orderBy: { happenedAt: 'desc' },
        include: {
          country: true,
          admin1: true,
          city: true,
          memoryTags: { include: { tag: true } },
          images: { orderBy: { order: 'asc' } }
        }
      });

      return {
        region: { id: regionId, name: regionName },
        memories: memories.map(m => ({ ...m, loveDays: calculateLoveDays(m.happenedAt) })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      };
    }

    memories = await prisma.memory.findMany({
      where: { countryId: country.id },
      include: {
        country: true,
        admin1: true,
        city: true,
        memoryTags: { include: { tag: true } },
        images: { orderBy: { order: 'asc' } }
      }
    });
  } else {
    const admin1 = await prisma.admin1.findFirst({
      where: {
        OR: [
          { id: regionId },
          { name: regionId }
        ]
      },
      include: { country: true }
    });

    if (!admin1) {
      if (page !== undefined && limit !== undefined) {
        return {
          region: { id: regionId, name: regionId },
          memories: [],
          pagination: { page, limit, total: 0, pages: 0 }
        };
      }
      return { region: { id: regionId, name: regionId }, memoriesByCity: {} };
    }

    regionName = admin1.name;

    const total = await prisma.memory.count({ where: { admin1Id: admin1.id } });

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      memories = await prisma.memory.findMany({
        where: { admin1Id: admin1.id },
        skip,
        take: limit,
        orderBy: { happenedAt: 'desc' },
        include: {
          country: true,
          admin1: true,
          city: true,
          memoryTags: { include: { tag: true } },
          images: { orderBy: { order: 'asc' } }
        }
      });

      return {
        region: { id: regionId, name: regionName },
        memories: memories.map(m => ({ ...m, loveDays: calculateLoveDays(m.happenedAt) })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      };
    }

    memories = await prisma.memory.findMany({
      where: { admin1Id: admin1.id },
      include: {
        country: true,
        admin1: true,
        city: true,
        memoryTags: { include: { tag: true } },
        images: { orderBy: { order: 'asc' } }
      }
    });
  }

  const memoriesWithFullData = memories.map(m => ({
    ...m,
    loveDays: calculateLoveDays(m.happenedAt)
  }));

  const memoriesByCity: MemoriesByCity = {};

  memoriesWithFullData.forEach(memory => {
    let groupKey: string;

    if (isCountryLevel) {
      groupKey = memory.admin1?.name || memory.city?.name || memory.locationTxt || '未知地点';
    } else {
      groupKey = memory.city?.name || memory.locationTxt || '未知地点';
    }

    if (!memoriesByCity[groupKey]) {
      memoriesByCity[groupKey] = [];
    }
    memoriesByCity[groupKey].push(memory);
  });

  return {
    region: { id: regionId, name: regionName },
    memoriesByCity
  };
}
