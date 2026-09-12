import type { User } from '@prisma/client'

// Prisma 类型定义
export type HardTimeRecordPrisma = {
  id: string
  createdById: string
  date: string
  startTime: string
  endTime: string
  rating: number
  duration: string
  createdAt: Date
  updatedAt: Date
}

export interface HardTimeRecordWithRelations extends HardTimeRecordPrisma {
  createdBy: User
}

// 如果 Prisma 还没有生成，使用类型定义
export type HardTimeRecordType = {
  id: string
  createdById: string
  date: string
  startTime: string
  endTime: string
  rating: number
  duration: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateHardTimeRecordRequest {
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  rating: number // 1-10
}

export interface UpdateHardTimeRecordRequest {
  startTime?: string
  endTime?: string
  rating?: number
}

export interface HardTimeRecordFilters {
  startDate?: string
  endDate?: string
}

