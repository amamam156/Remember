import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import type { 
  CreateHotelRequest, 
  UpdateHotelRequest, 
  HotelFilters, 
  PaginatedHotels,
  HotelWithRelations 
} from '../models/Hotel.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

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

export const createHotel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hotelData: CreateHotelRequest = req.body;
    
    // 验证国家是否存在
    const country = await prisma.country.findUnique({
      where: { id: hotelData.countryId }
    });
    
    if (!country) {
      return res.status(400).json({
        success: false,
        message: '指定的国家不存在'
      });
    }

    // 验证省份/州（如果提供）
    if (hotelData.admin1Id) {
      const admin1 = await prisma.admin1.findUnique({
        where: { id: hotelData.admin1Id }
      });
      
      if (!admin1 || admin1.countryId !== hotelData.countryId) {
        return res.status(400).json({
          success: false,
          message: '指定的省份/州不存在或不属于该国家'
        });
      }
    }

    // 验证城市（如果提供）
    if (hotelData.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: hotelData.cityId }
      });
      
      if (!city || city.countryId !== hotelData.countryId) {
        return res.status(400).json({
          success: false,
          message: '指定的城市不存在或不属于该国家'
        });
      }
    }

    // 验证日期
    if (hotelData.checkOutDate && hotelData.checkOutDate < hotelData.checkInDate) {
      return res.status(400).json({
        success: false,
        message: '离开日期必须晚于入住日期'
      });
    }

    // 验证星级评分
    if (hotelData.rating !== undefined && (hotelData.rating < 1 || hotelData.rating > 5)) {
      return res.status(400).json({
        success: false,
        message: '星级评分必须在1-5之间'
      });
    }

    // 处理图片URL，并规范化为相对路径
    const hotelImageUrls = (hotelData.hotelImages || []).map(toRelativePath);
    const roomCardImageUrls = (hotelData.roomCardImages || []).map(toRelativePath);

    // 创建酒店
    const hotel = await prisma.hotel.create({
      data: {
        createdById: req.user!.id,
        name: hotelData.name,
        checkInDate: hotelData.checkInDate,
        checkOutDate: hotelData.checkOutDate,
        locationTxt: hotelData.locationTxt,
        countryId: hotelData.countryId,
        admin1Id: hotelData.admin1Id || undefined,
        cityId: hotelData.cityId || undefined,
        notes: hotelData.notes,
        rating: hotelData.rating,
        hotelImages: hotelImageUrls.length > 0 ? {
          create: hotelImageUrls.map((url, index) => ({
            imageUrl: url,
            thumbnailUrl: url.replace('_processed.', '_thumb.'), // 自动生成缩略图URL
            order: index
          }))
        } : undefined,
        roomCardImages: roomCardImageUrls.length > 0 ? {
          create: roomCardImageUrls.map((url, index) => ({
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
        hotelImages: {
          orderBy: { order: 'asc' }
        },
        roomCardImages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: hotel,
      message: '酒店创建成功'
    });
  } catch (error) {
    console.error('创建酒店错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getHotels = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      countryId,
      admin1Id,
      cityId,
      startDate,
      endDate,
      rating,
      sortOrder = 'desc' // 默认倒序（最新在前）
    }: HotelFilters & { sortOrder?: 'asc' | 'desc'; rating?: number | string } = req.query;

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
      where.checkInDate = {};
      if (startDate) {
        where.checkInDate.gte = startDate;
      }
      if (endDate) {
        where.checkInDate.lte = endDate;
      }
    }

    if (rating !== undefined && rating !== null) {
      where.rating = Number(rating);
    }

    // 查询酒店（按入住日期排序）
    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip,
          take: safeLimit,
          orderBy: { checkInDate: safeSortOrder },
        include: {
          createdBy: { select: { id: true, name: true, username: true } },
          country: true,
          admin1: true,
          city: true,
          hotelImages: {
            orderBy: { order: 'asc' }
          },
          roomCardImages: {
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.hotel.count({ where })
    ]);

    // 不再拼接完整URL，让前端根据当前协议自动处理相对路径（避免 Mixed Content）
    const hotelsWithFullUrl = hotels;

    const totalPages = Math.ceil(total / safeLimit);

    return res.json({
      success: true,
      data: {
        hotels: hotelsWithFullUrl,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('获取酒店列表错误:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        country: true,
        admin1: true,
        city: true,
        hotelImages: {
          orderBy: { order: 'asc' }
        },
        roomCardImages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    // 不再拼接完整URL，让前端根据当前协议自动处理相对路径（避免 Mixed Content）
    return res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('获取酒店详情错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const updateHotel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateHotelRequest = req.body;

    // 检查酒店是否存在
    const existingHotel = await prisma.hotel.findUnique({
      where: { id }
    });

    if (!existingHotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    // 检查权限（只能修改自己创建的酒店）
    if (existingHotel.createdById !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: '无权修改此酒店'
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
      
      if (!admin1 || (updateData.countryId && admin1.countryId !== updateData.countryId)) {
        return res.status(400).json({
          success: false,
          message: '指定的省份/州不存在或不属于该国家'
        });
      }
    }

    // 验证城市（如果更新）
    if (updateData.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: updateData.cityId }
      });
      
      if (!city || (updateData.countryId && city.countryId !== updateData.countryId)) {
        return res.status(400).json({
          success: false,
          message: '指定的城市不存在或不属于该国家'
        });
      }
    }

    // 验证日期
    const checkInDate = updateData.checkInDate || existingHotel.checkInDate;
    const checkOutDate = updateData.checkOutDate !== undefined ? updateData.checkOutDate : existingHotel.checkOutDate;
    
    if (checkOutDate && checkOutDate < checkInDate) {
      return res.status(400).json({
        success: false,
        message: '离开日期必须晚于入住日期'
      });
    }

    // 验证星级评分
    if (updateData.rating !== undefined && (updateData.rating < 1 || updateData.rating > 5)) {
      return res.status(400).json({
        success: false,
        message: '星级评分必须在1-5之间'
      });
    }

    // 处理字段更新
    const updateFields: any = {
      ...(updateData.name !== undefined && { name: updateData.name }),
      ...(updateData.checkInDate !== undefined && { checkInDate: updateData.checkInDate }),
      ...(updateData.checkOutDate !== undefined && { checkOutDate: updateData.checkOutDate }),
      ...(updateData.locationTxt !== undefined && { locationTxt: updateData.locationTxt }),
      ...(updateData.countryId && { countryId: updateData.countryId }),
      ...(updateData.admin1Id !== undefined && { admin1Id: updateData.admin1Id || null }),
      ...(updateData.cityId !== undefined && { cityId: updateData.cityId || null }),
      ...(updateData.notes !== undefined && { notes: updateData.notes }),
      ...(updateData.rating !== undefined && { rating: updateData.rating })
    };

    // 规范化图片URL
    const newHotelUrls = updateData.hotelImages ? updateData.hotelImages.map(toRelativePath) : null;
    const newRoomCardUrls = updateData.roomCardImages ? updateData.roomCardImages.map(toRelativePath) : null;

    const fs = require('fs').promises;
    const path = require('path');

    // 更新酒店图片
    if (newHotelUrls) {
      // 获取旧图片记录
      const oldHotelImages = await prisma.hotelImage.findMany({
        where: { hotelId: id }
      });
      
      const newUrlSet = new Set(newHotelUrls);

      // 删除不再使用的物理文件
      for (const image of oldHotelImages) {
        const normalizedOldPath = toRelativePath(image.imageUrl);
        if (image.imageUrl && !newUrlSet.has(normalizedOldPath)) {
          try {
            const filePath = path.join(process.cwd(), image.imageUrl.replace(/^\//, ''));
            await fs.unlink(filePath);
            console.log(`已删除不再使用的酒店图片: ${filePath}`);
            if (image.thumbnailUrl) {
              const thumbPath = path.join(process.cwd(), image.thumbnailUrl.replace(/^\//, ''));
              await fs.unlink(thumbPath);
            }
          } catch (err) {
            console.error(`删除酒店图片失败:`, err);
          }
        }
      }

      // 删除旧记录并重新创建
      await prisma.hotelImage.deleteMany({
        where: { hotelId: id }
      });
      
      updateFields.hotelImages = {
        create: newHotelUrls.map((url, index) => ({
          imageUrl: url,
          thumbnailUrl: url.replace('_processed.', '_thumb.'),
          order: index
        }))
      };
    }

    // 更新房卡图片
    if (newRoomCardUrls) {
      // 获取旧图片记录
      const oldRoomCardImages = await prisma.roomCardImage.findMany({
        where: { hotelId: id }
      });
      
      const newUrlSet = new Set(newRoomCardUrls);

      // 删除不再使用的物理文件
      for (const image of oldRoomCardImages) {
        const normalizedOldPath = toRelativePath(image.imageUrl);
        if (image.imageUrl && !newUrlSet.has(normalizedOldPath)) {
          try {
            const filePath = path.join(process.cwd(), image.imageUrl.replace(/^\//, ''));
            await fs.unlink(filePath);
            console.log(`已删除不再使用的房卡图片: ${filePath}`);
            if (image.thumbnailUrl) {
              const thumbPath = path.join(process.cwd(), image.thumbnailUrl.replace(/^\//, ''));
              await fs.unlink(thumbPath);
            }
          } catch (err) {
            console.error(`删除房卡图片失败:`, err);
          }
        }
      }

      // 删除旧记录并重新创建
      await prisma.roomCardImage.deleteMany({
        where: { hotelId: id }
      });
      
      updateFields.roomCardImages = {
        create: newRoomCardUrls.map((url, index) => ({
          imageUrl: url,
          thumbnailUrl: url.replace('_processed.', '_thumb.'),
          order: index
        }))
      };
    }

    // 更新酒店
    const hotel = await prisma.hotel.update({
      where: { id },
      data: updateFields,
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        country: true,
        admin1: true,
        city: true,
        hotelImages: {
          orderBy: { order: 'asc' }
        },
        roomCardImages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // 不再拼接完整URL，让前端根据当前协议自动处理相对路径（避免 Mixed Content）
    return res.json({
      success: true,
      data: hotel,
      message: '酒店更新成功'
    });
  } catch (error) {
    console.error('更新酒店错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const deleteHotel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 检查酒店是否存在，并获取所有图片
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        hotelImages: true,
        roomCardImages: true
      }
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    // 检查权限（只能删除自己创建的酒店）
    if (hotel.createdById !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除此酒店'
      });
    }

    // 删除图片文件
    const fs = require('fs').promises;
    const path = require('path');
    
    // 收集所有需要删除的图片路径
    const imagePaths: string[] = [];
    
    // 从 hotelImages 收集图片
    if (hotel.hotelImages && hotel.hotelImages.length > 0) {
      for (const image of hotel.hotelImages) {
        if (image.imageUrl) {
          imagePaths.push(image.imageUrl);
        }
        if (image.thumbnailUrl) {
          imagePaths.push(image.thumbnailUrl);
        }
      }
    }
    
    // 从 roomCardImages 收集图片
    if (hotel.roomCardImages && hotel.roomCardImages.length > 0) {
      for (const image of hotel.roomCardImages) {
        if (image.imageUrl) {
          imagePaths.push(image.imageUrl);
        }
        if (image.thumbnailUrl) {
          imagePaths.push(image.thumbnailUrl);
        }
      }
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

    // 删除酒店（级联删除图片记录）
    await prisma.hotel.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: '酒店删除成功'
    });
  } catch (error) {
    console.error('删除酒店错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};
