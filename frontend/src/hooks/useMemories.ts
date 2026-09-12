import { useState, useEffect } from 'react'
import { apiService, Memory, CreateMemoryRequest } from '../services/api'

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMemories = async (params?: {
    page?: number
    limit?: number
    countryId?: string
    admin1Id?: string
    cityId?: string
    tagIds?: string[]
    startDate?: string
    endDate?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.getMemories(params)
      if (response.success) {
        setMemories(response.data.memories)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载回忆失败')
    } finally {
      setIsLoading(false)
    }
  }

  const createMemory = async (memoryData: CreateMemoryRequest) => {
    try {
      const response = await apiService.createMemory(memoryData)
      if (response.success) {
        // 重新加载回忆列表
        await loadMemories()
        return response.data
      }
      throw new Error(response.message || '创建回忆失败')
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建回忆失败')
      throw err
    }
  }

  const updateMemory = async (id: string, memoryData: Partial<CreateMemoryRequest>) => {
    try {
      const response = await apiService.updateMemory(id, memoryData)
      if (response.success) {
        // 重新加载回忆列表
        await loadMemories()
        return response.data
      }
      throw new Error(response.message || '更新回忆失败')
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新回忆失败')
      throw err
    }
  }

  const deleteMemory = async (id: string) => {
    try {
      const response = await apiService.deleteMemory(id)
      if (response.success) {
        // 重新加载回忆列表
        await loadMemories()
        return true
      }
      throw new Error(response.message || '删除回忆失败')
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除回忆失败')
      throw err
    }
  }

  useEffect(() => {
    loadMemories()
  }, [])

  return {
    memories,
    isLoading,
    error,
    loadMemories,
    createMemory,
    updateMemory,
    deleteMemory
  }
}
