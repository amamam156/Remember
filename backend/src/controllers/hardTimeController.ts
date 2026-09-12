import type { Response } from 'express'
import { prisma } from '../database/prisma.js'
import type { CreateHardTimeRecordRequest, UpdateHardTimeRecordRequest } from '../models/HardTimeRecord.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

// 计算时长
function calculateDuration(startTime: string, endTime: string): string {
  // 假设时间在同一天，创建一个基准日期
  const baseDate = '2000-01-01'
  const startDateTime = new Date(`${baseDate}T${startTime}:00`)
  const endDateTime = new Date(`${baseDate}T${endTime}:00`)
  
  // 如果结束时间早于开始时间，说明跨天了，加24小时
  if (endDateTime < startDateTime) {
    endDateTime.setHours(endDateTime.getHours() + 24)
  }
  
  const diffMs = endDateTime.getTime() - startDateTime.getTime()
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分${seconds}秒`
  } else {
    return `${minutes}分${seconds}秒`
  }
}

export const createRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const recordData: CreateHardTimeRecordRequest = req.body

    // 验证日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordData.date)) {
      return res.status(400).json({
        success: false,
        message: '日期格式不正确，应为 YYYY-MM-DD'
      })
    }

    // 验证时间格式
    if (!/^\d{2}:\d{2}$/.test(recordData.startTime) || !/^\d{2}:\d{2}$/.test(recordData.endTime)) {
      return res.status(400).json({
        success: false,
        message: '时间格式不正确，应为 HH:mm'
      })
    }

    // 验证评分
    if (recordData.rating < 1 || recordData.rating > 10) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-10之间'
      })
    }

    // 计算时长
    const duration = calculateDuration(recordData.startTime, recordData.endTime)

    // 检查该日期是否已有记录（全表检查，不分用户）
    const existingRecord = await prisma.hardTimeRecord.findFirst({
      where: {
        date: recordData.date
      }
    })

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: '该日期已有记录，请使用更新接口'
      })
    }

    // 创建记录
    const record = await prisma.hardTimeRecord.create({
      data: {
        createdById: userId,
        date: recordData.date,
        startTime: recordData.startTime,
        endTime: recordData.endTime,
        rating: recordData.rating,
        duration: duration
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true } }
      }
    })

    return res.status(201).json({
      success: true,
      data: record,
      message: '记录创建成功'
    })
  } catch (error) {
    console.error('创建记录错误:', error)
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

export const getRecords = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { startDate, endDate } = req.query

    const where: any = {}

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = startDate as string
      }
      if (endDate) {
        where.date.lte = endDate as string
      }
    }

    const records = await prisma.hardTimeRecord.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, username: true } }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return res.json({
      success: true,
      data: records
    })
  } catch (error) {
    console.error('获取记录错误:', error)
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

export const getRecordByDate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.params

    const record = await prisma.hardTimeRecord.findFirst({
      where: {
        date: date
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true } }
      }
    })

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      })
    }

    return res.json({
      success: true,
      data: record
    })
  } catch (error) {
    console.error('获取记录错误:', error)
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

export const updateRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const updateData: UpdateHardTimeRecordRequest = req.body

    // 查找记录
    const existingRecord = await prisma.hardTimeRecord.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      })
    }

    // 任何人都可以修改任何人的记录

    // 构建更新数据
    const data: any = {}
    if (updateData.startTime) {
      data.startTime = updateData.startTime
    }
    if (updateData.endTime) {
      data.endTime = updateData.endTime
    }
    if (updateData.rating !== undefined) {
      if (updateData.rating < 1 || updateData.rating > 10) {
        return res.status(400).json({
          success: false,
          message: '评分必须在1-10之间'
        })
      }
      data.rating = updateData.rating
    }

    // 如果时间有变化，重新计算时长
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || existingRecord.startTime
      const endTime = updateData.endTime || existingRecord.endTime
      data.duration = calculateDuration(startTime, endTime)
    }

    // 更新记录
    const record = await prisma.hardTimeRecord.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, username: true } }
      }
    })

    return res.json({
      success: true,
      data: record,
      message: '记录更新成功'
    })
  } catch (error) {
    console.error('更新记录错误:', error)
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

export const deleteRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // 查找记录
    const existingRecord = await prisma.hardTimeRecord.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      })
    }

    // 任何人都可以删除任何人的记录

    // 删除记录
    await prisma.hardTimeRecord.delete({
      where: { id }
    })

    return res.json({
      success: true,
      message: '记录删除成功'
    })
  } catch (error) {
    console.error('删除记录错误:', error)
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}
