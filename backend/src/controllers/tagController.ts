import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import type { CreateTagRequest, UpdateTagRequest } from '../models/Tag.js';

export const getTags = async (req: Request, res: Response) => {
  try {
    const { search, withCount } = req.query;
    
    const where = search ? {
      name: {
        contains: search as string
      }
    } : {};

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: withCount === 'true' ? {
        _count: {
          select: {
            memoryTags: true
          }
        }
      } : undefined
    });

    return res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('获取标签列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const getTagById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memoryTags: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    return res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('获取标签详情错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const tagData: CreateTagRequest = req.body;
    
    // 检查标签是否已存在
    const existingTag = await prisma.tag.findUnique({
      where: { name: tagData.name }
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: '标签已存在'
      });
    }

    const tag = await prisma.tag.create({
      data: tagData
    });

    return res.status(201).json({
      success: true,
      data: tag,
      message: '标签创建成功'
    });
  } catch (error) {
    console.error('创建标签错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const updateTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateTagRequest = req.body;
    
    // 检查标签是否存在
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 检查新名称是否已被其他标签使用
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        name: updateData.name,
        id: { not: id }
      }
    });

    if (duplicateTag) {
      return res.status(400).json({
        success: false,
        message: '标签名称已被使用'
      });
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData
    });

    return res.json({
      success: true,
      data: updatedTag,
      message: '标签更新成功'
    });
  } catch (error) {
    console.error('更新标签错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 检查标签是否存在
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memoryTags: true
          }
        }
      }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 检查是否有关联的回忆
    if (existingTag._count.memoryTags > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除有关联回忆的标签'
      });
    }

    await prisma.tag.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: '标签删除成功'
    });
  } catch (error) {
    console.error('删除标签错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};
