import { useState, useEffect, useCallback } from 'react'
import { apiService, Country, Admin1, City } from '../services/api'

export function useGeoData() {
  const [countries, setCountries] = useState<Country[]>([])
  const [admin1s, setAdmin1s] = useState<Admin1[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCountries = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiService.getCountries()
      setCountries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载国家列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadAdmin1s = useCallback(async (country: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiService.getAdmin1s(country)
      setAdmin1s(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载省份列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadCities = useCallback(async (country: string, admin1?: string) => {
    // 如果country为空，不加载城市
    if (!country || country.trim() === '') {
      setCities([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiService.getCities(country, admin1)
      setCities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载城市列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearAdmin1s = useCallback(() => {
    setAdmin1s([])
  }, [])

  const clearCities = useCallback(() => {
    setCities([])
  }, [])

  useEffect(() => {
    loadCountries()
  }, [loadCountries])

  return {
    countries,
    admin1s,
    cities,
    isLoading,
    error,
    loadCountries,
    loadAdmin1s,
    loadCities,
    clearAdmin1s,
    clearCities
  }
}
