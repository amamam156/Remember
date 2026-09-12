import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import type { 
  CreateMemoryRequest, 
  UpdateMemoryRequest, 
  MemoryFilters, 
  PaginatedMemories 
} from '../models/Memory.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// 计算相恋天数
const RELATIONSHIP_START_DATE = '2018-05-19';
const calculateLoveDays = (dateString: string): number => {
  try {
    // 处理日期字符串（可能包含或省略时间部分）
    const datePart = dateString.split('T')[0].split(' ')[0]; // 取日期部分
    const [year, month, day] = datePart.split('-').map(Number);
    const [startYear, startMonth, startDay] = RELATIONSHIP_START_DATE.split('-').map(Number);
    
    // 使用 UTC 日期避免时区问题
    const date1 = new Date(Date.UTC(year, month - 1, day));
    const date2 = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    const diffTime = date1.getTime() - date2.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 返回实际天数（可以是负数，表示相恋之前）
    return days;
  } catch (error) {
    console.error('计算相恋天数时出错:', error, 'dateString:', dateString);
    return 0;
  }
};

// 将可能包含域名的完整URL转换为相对路径，确保数据库存储一致性
const toRelativePath = (url: string): string => {
  if (!url) return url;
  // 如果是完整URL，提取 /uploads/ 之后的内容（包含 /uploads/）
  const match = url.match(/\/uploads\/.*$/);
  if (match) {
    return match[0];
  }
  // 如果已经是相对路径但没有前面的斜杠，补充上
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return '/' + url;
  }
  return url;
};

export const createMemory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memoryData: CreateMemoryRequest = req.body;
    
    // 验证国家是否存在
    const country = await prisma.country.findUnique({
      where: { id: memoryData.countryId }
    });
    
    if (!country) {
      return res.status(400).json({
        success: false,
        message: '指定的国家不存在'
      });
    }

    // 验证省份/州（如果提供）
    if (memoryData.admin1Id) {
      const admin1 = await prisma.admin1.findUnique({
        where: { id: memoryData.admin1Id }
      });
      
      if (!admin1 || admin1.countryId !== memoryData.countryId) {
        return res.status(400).json({
          success: false,
          message: '指定的省份/州不存在或不属于该国家'
        });
      }
    }

    // 验证城市（如果提供）
    if (memoryData.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: memoryData.cityId }
      });
      
      if (!city || city.countryId !== memoryData.countryId) {
        return res.status(400).json({
          success: false,
          message: '指定的城市不存在或不属于该国家'
        });
      }

      // 如果城市有admin1，验证是否匹配
      if (city.admin1Id && memoryData.admin1Id && city.admin1Id !== memoryData.admin1Id) {
        return res.status(400).json({
          success: false,
          message: '城市与指定的省份/州不匹配'
        });
      }
    }

    // 验证标签（如果提供）
    if (memoryData.tagIds && memoryData.tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: memoryData.tagIds } }
      });
      
      if (tags.length !== memoryData.tagIds.length) {
        return res.status(400).json({
          success: false,
          message: '部分标签不存在'
        });
      }
    }

    // 支持多图片上传，并规范化为相对路径
    const imageUrls = (Array.isArray(memoryData.imageUrl) 
      ? memoryData.imageUrl 
      : memoryData.imageUrl 
        ? [memoryData.imageUrl] 
        : []).map(toRelativePath);

    // 如果没有提供经纬度，尝试从城市、省份或国家获取
    let { latitude, longitude } = memoryData;
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      if (memoryData.cityId) {
        const city = await prisma.city.findUnique({ where: { id: memoryData.cityId } });
        if (city?.latitude && city?.longitude) {
          latitude = city.latitude;
          longitude = city.longitude;
        }
      }
      
      if ((latitude === undefined || longitude === undefined || latitude === null || longitude === null) && memoryData.admin1Id) {
        const admin1 = await prisma.admin1.findUnique({ where: { id: memoryData.admin1Id } });
        if (admin1?.latitude && admin1?.longitude) {
          latitude = admin1.latitude;
          longitude = admin1.longitude;
        }
      }

      if ((latitude === undefined || longitude === undefined || latitude === null || longitude === null) && memoryData.countryId) {
        const country = await prisma.country.findUnique({ where: { id: memoryData.countryId } });
        if (country?.latitude && country?.longitude) {
          latitude = country.latitude;
          longitude = country.longitude;
        }
      }
    }

    // 创建回忆
    const memory = await prisma.memory.create({
      data: {
        createdById: req.user!.id,
        happenedAt: memoryData.happenedAt, // 直接存储日期字符串
        title: memoryData.title,
        topic: memoryData.topic,
        locationTxt: memoryData.locationTxt,
        countryId: memoryData.countryId,
        admin1Id: memoryData.admin1Id,
        cityId: memoryData.cityId,
        latitude,
        longitude,
        imageUrl: imageUrls[0] || null, // 主图（第一张）
        memoryTags: memoryData.tagIds ? {
          create: memoryData.tagIds.map(tagId => ({
            tagId
          }))
        } : undefined,
        images: imageUrls.length > 0 ? {
          create: imageUrls.map((url, index) => ({
            imageUrl: url,
            thumbnailUrl: url.replace('_processed.', '_thumb.'), // 自动生成缩略图URL
            order: index
          }))
        } : undefined
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        country: true,
        admin1: true,
        city: true,
        memoryTags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: memory,
      message: '回忆创建成功'
    });
  } catch (error) {
    console.error('创建回忆错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getMemories = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      countryId,
      admin1Id,
      cityId,
      tagIds,
      startDate,
      endDate,
      sortOrder = 'desc' // 新增：排序参数，默认倒序
    }: MemoryFilters & { sortOrder?: 'asc' | 'desc' } = req.query;

    const safePage = Math.max(1, Number.isFinite(Number(page)) ? Math.floor(Number(page)) : 1);
    const safeLimit = Math.min(100, Math.max(1, Number.isFinite(Number(limit)) ? Math.floor(Number(limit)) : 20));
    const skip = (safePage - 1) * safeLimit;
    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    
    // 构建查询条件
    const where: any = {};

    if (countryId) {
      where.countryId = countryId;
    }

    if (admin1Id) {
      where.admin1Id = admin1Id;
    }

    if (cityId) {
      where.cityId = cityId;
    }

    if (startDate || endDate) {
      where.happenedAt = {};
      if (startDate) {
        where.happenedAt.gte = startDate; // 字符串直接比较
      }
      if (endDate) {
        where.happenedAt.lte = endDate; // 字符串直接比较
      }
    }

    // 处理 tagIds：确保是数组格式
    let tagIdsArray: string[] = [];
    if (tagIds) {
      if (Array.isArray(tagIds)) {
        tagIdsArray = tagIds;
      } else if (typeof tagIds === 'string') {
        // 如果只有一个值，Express 会解析为字符串
        tagIdsArray = [tagIds];
      }
    }
    
    if (tagIdsArray.length > 0) {
      where.memoryTags = {
        some: {
          tagId: { in: tagIdsArray }
        }
      };
    }

    // 查询回忆
    const [memories, total] = await Promise.all([
      prisma.memory.findMany({
        where,
        skip,
          take: safeLimit,
          orderBy: { happenedAt: safeSortOrder },
        include: {
          createdBy: { select: { id: true, name: true, username: true } },
          country: true,
          admin1: true,
          city: true,
          memoryTags: {
            include: {
              tag: true
            }
          },
          images: {
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.memory.count({ where })
    ]);

    // 处理图片URL，转换为完整URL，并添加相恋天数
    // 不再拼接完整URL，让前端根据当前协议自动处理相对路径（避免 Mixed Content）
    const memoriesWithFullUrl = memories.map(memory => ({
      ...memory,
      loveDays: calculateLoveDays(memory.happenedAt)
      // imageUrl 和 images 数组保持原样（相对路径），由前端处理
    }));

    const result: PaginatedMemories = {
      memories: memoriesWithFullUrl as any,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    };

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取回忆列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getMemoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const memory = await prisma.memory.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        country: true,
        admin1: true,
        city: true,
        memoryTags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: '回忆不存在'
      });
    }

    // 处理图片URL，转换为完整URL，并添加相恋天数
    // 不再拼接完整URL，让前端根据当前协议自动处理相对路径（避免 Mixed Content）
    const memoryWithFullUrl = {
      ...memory,
      loveDays: calculateLoveDays(memory.happenedAt)
      // imageUrl 和 images 数组保持原样（相对路径），由前端处理
    };

    return res.json({
      success: true,
      data: memoryWithFullUrl
    });
  } catch (error) {
    console.error('获取回忆详情错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const updateMemory = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const updateData: UpdateMemoryRequest = req.body;
    
    // 检查回忆是否存在
    const existingMemory = await prisma.memory.findUnique({
      where: { id }
    });

    if (!existingMemory) {
      return res.status(404).json({
        success: false,
        message: '回忆不存在'
      });
    }

    if (existingMemory.createdById !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: '无权修改此回忆'
      });
    }

    // 验证国家（如果更新）
    if (updateData.countryId) {
      const country = await prisma.country.findUnique({
        where: { id: updateData.countryId }
      });
      
      if (!country) {
        return res.status(400).json({
          success: false,
          message: '指定的国家不存在'
        });
      }
    }

    // 验证省份/州（如果更新）
    if (updateData.admin1Id) {
      const admin1 = await prisma.admin1.findUnique({
        where: { id: updateData.admin1Id }
      });
      
      if (!admin1) {
        return res.status(400).json({
          success: false,
          message: '指定的省份/州不存在'
        });
      }
    }

    // 验证城市（如果更新）
    if (updateData.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: updateData.cityId }
      });
      
      if (!city) {
        return res.status(400).json({
          success: false,
          message: '指定的城市不存在'
        });
      }
    }

    // 验证标签（如果更新）
    if (updateData.tagIds && updateData.tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: updateData.tagIds } }
      });
      
      if (tags.length !== updateData.tagIds.length) {
        return res.status(400).json({
          success: false,
          message: '部分标签不存在'
        });
      }
    }

    // 处理图片数据（支持多图片），并规范化为相对路径
    const imageUrls = updateData.imageUrl 
      ? (Array.isArray(updateData.imageUrl) 
          ? updateData.imageUrl 
          : [updateData.imageUrl]).map(toRelativePath)
      : null;

    // 如果要更新图片，只删除不再使用的图片文件
    if (imageUrls) {
      const oldMemory = await prisma.memory.findUnique({
        where: { id },
        include: { images: true }
      });

      if (oldMemory) {
        const fs = require('fs').promises;
        const path = require('path');
        const oldImagePaths: string[] = [];
        const newImageSet = new Set(imageUrls); // 新图片URL集合

        // 收集旧图片路径
        if (oldMemory.images && oldMemory.images.length > 0) {
          for (const image of oldMemory.images) {
            const normalizedOldPath = toRelativePath(image.imageUrl); // 规范化DB中的路径
            // 只收集不在新列表中的图片
            if (image.imageUrl && !newImageSet.has(normalizedOldPath)) {
              oldImagePaths.push(image.imageUrl);
              if (image.thumbnailUrl) {
                oldImagePaths.push(image.thumbnailUrl);
              }
            }
          }
        }

        // 只删除真正不再使用的图片文件
        for (const imgPath of oldImagePaths) {
          try {
            const filePath = path.join(process.cwd(), imgPath.replace(/^\//, ''));
            await fs.unlink(filePath);
            console.log(`已删除不再使用的图片: ${filePath}`);
          } catch (err) {
            console.error(`删除图片失败: ${imgPath}`, err);
          }
        }
      }
    }

    // 如果有地理位置变更且没有提供经纬度，尝试重新获取
    let { latitude, longitude } = updateData;
    const isLocationChanged = updateData.cityId || updateData.admin1Id || updateData.countryId;
    
    if (isLocationChanged && (latitude === undefined || longitude === undefined || latitude === null || longitude === null)) {
      const cityId = updateData.cityId || existingMemory.cityId;
      const admin1Id = updateData.admin1Id || existingMemory.admin1Id;
      const countryId = updateData.countryId || existingMemory.countryId;

      if (cityId) {
        const city = await prisma.city.findUnique({ where: { id: cityId } });
        if (city?.latitude && city?.longitude) {
          latitude = city.latitude;
          longitude = city.longitude;
        }
      }
      
      if ((latitude === undefined || longitude === undefined || latitude === null || longitude === null) && admin1Id) {
        const admin1 = await prisma.admin1.findUnique({ where: { id: admin1Id } });
        if (admin1?.latitude && admin1?.longitude) {
          latitude = admin1.latitude;
          longitude = admin1.longitude;
        }
      }

      if ((latitude === undefined || longitude === undefined || latitude === null || longitude === null) && countryId) {
        const country = await prisma.country.findUnique({ where: { id: countryId } });
        if (country?.latitude && country?.longitude) {
          latitude = country.latitude;
          longitude = country.longitude;
        }
      }
    }

    // 更新回忆
    const updatedMemory = await prisma.memory.update({
      where: { id },
      data: {
        ...(updateData.happenedAt && { happenedAt: updateData.happenedAt }), // 直接存储日期字符串
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.topic !== undefined && { topic: updateData.topic }),
        ...(updateData.locationTxt !== undefined && { locationTxt: updateData.locationTxt }),
        ...(updateData.countryId && { countryId: updateData.countryId }),
        ...(updateData.admin1Id !== undefined && { admin1Id: updateData.admin1Id }),
        ...(updateData.cityId !== undefined && { cityId: updateData.cityId }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(imageUrls && { imageUrl: imageUrls[0] }), // 更新主图
        ...(updateData.tagIds && {
          memoryTags: {
            deleteMany: {},
            create: updateData.tagIds.map(tagId => ({
              tagId
            }))
          }
        }),
        ...(imageUrls && {
          images: {
            deleteMany: {}, // 删除旧图片记录
            create: imageUrls.map((url, index) => ({
              imageUrl: url,
              thumbnailUrl: url.replace('_processed.', '_thumb.'), // 自动生成缩略图URL
              order: index
            }))
          }
        })
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        country: true,
        admin1: true,
        city: true,
        memoryTags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return res.json({
      success: true,
      data: updatedMemory,
      message: '回忆更新成功'
    });
  } catch (error) {
    console.error('更新回忆错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const deleteMemory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // 检查回忆是否存在，并获取所有图片
    const existingMemory = await prisma.memory.findUnique({
      where: { id },
      include: {
        images: true
      }
    });

    if (!existingMemory) {
      return res.status(404).json({
        success: false,
        message: '回忆不存在'
      });
    }

    if (existingMemory.createdById !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除此回忆'
      });
    }

    // 删除图片文件
    const fs = require('fs').promises;
    const path = require('path');
    
    // 收集所有需要删除的图片路径
    const imagePaths: string[] = [];
    
    // 从 images 数组中收集图片
    if (existingMemory.images && existingMemory.images.length > 0) {
      for (const image of existingMemory.images) {
        if (image.imageUrl) {
          imagePaths.push(image.imageUrl);
        }
        if (image.thumbnailUrl) {
          imagePaths.push(image.thumbnailUrl);
        }
      }
    }
    
    // 也检查主图（向后兼容）
    if (existingMemory.imageUrl && !imagePaths.includes(existingMemory.imageUrl)) {
      imagePaths.push(existingMemory.imageUrl);
    }
    
    // 删除文件
    for (const imgPath of imagePaths) {
      try {
        // 将 URL 路径转换为文件系统路径
        const filePath = path.join(process.cwd(), imgPath.replace(/^\//, ''));
        await fs.unlink(filePath);
        console.log(`已删除图片文件: ${filePath}`);
      } catch (err) {
        console.error(`删除图片文件失败: ${imgPath}`, err);
        // 继续删除其他文件，不中断流程
      }
    }

    // 删除回忆（级联删除相关标签关联和图片记录）
    await prisma.memory.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: '回忆删除成功'
    });
  } catch (error) {
    console.error('删除回忆错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};
