import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, X, Save, Trash2, Star } from 'lucide-react'
import { apiService } from '../services/api'
import { getCache, setCache, removeCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache'
import { emitDataRefresh, onDataRefresh, DATA_REFRESH_EVENTS } from '../utils/dataEvents'

interface HardTimeRecord {
  id: string
  date: string
  startTime: string
  endTime: string
  rating: number
  duration: string
}

export default function HardTimes() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [records, setRecords] = useState<Map<string, HardTimeRecord>>(new Map())
  const [_isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [rating, setRating] = useState(5)
  const [currentRecord, setCurrentRecord] = useState<HardTimeRecord | null>(null)

  const monthScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (monthScrollRef.current) {
      const activeBtn = monthScrollRef.current.children[currentDate.getMonth()] as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentDate]);

  // 计算当前月份的开始和结束日期
  const monthRange = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    
    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = (date.getMonth() + 1).toString().padStart(2, '0')
      const d = date.getDate().toString().padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    return {
      start: formatDate(start),
      end: formatDate(end)
    }
  }, [currentDate])

  // 加载记录
  useEffect(() => {
    const loadRecords = async () => {
      // 生成基于月份的缓存键
      const cacheKey = `${CACHE_KEYS.HARD_TIMES_PREFIX}${monthRange.start.substring(0, 7)}`

      // 先尝试从缓存加载
      const cachedRecords = getCache<HardTimeRecord[]>(cacheKey)
      if (cachedRecords) {
        const recordsMap = new Map<string, HardTimeRecord>()
        cachedRecords.forEach((record: HardTimeRecord) => {
          recordsMap.set(record.date, record)
        })
        setRecords(recordsMap)
      }

      setIsLoading(true)
      try {
        const response = await apiService.getHardTimeRecords({
          startDate: monthRange.start,
          endDate: monthRange.end
        })
        if (response.success && response.data) {
          const recordsMap = new Map<string, HardTimeRecord>()
          response.data.forEach((record: HardTimeRecord) => {
            recordsMap.set(record.date, record)
          })
          setRecords(recordsMap)

          // 保存到缓存
          setCache(cacheKey, response.data, CACHE_TTL.HARD_TIMES)
        }
      } catch (error) {
        console.error('加载记录失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecords()
  }, [monthRange])

  // 监听数据更新事件
  useEffect(() => {
    const cleanup = onDataRefresh(DATA_REFRESH_EVENTS.HARD_TIMES_CHANGED, () => {
      // 清除当前月份的缓存
      const cacheKey = `${CACHE_KEYS.HARD_TIMES_PREFIX}${monthRange.start.substring(0, 7)}`
      removeCache(cacheKey)

      // 重新加载数据
      const loadRecords = async () => {
        setIsLoading(true)
        try {
          const response = await apiService.getHardTimeRecords({
            startDate: monthRange.start,
            endDate: monthRange.end
          })
          if (response.success && response.data) {
            const recordsMap = new Map<string, HardTimeRecord>()
            response.data.forEach((record: HardTimeRecord) => {
              recordsMap.set(record.date, record)
            })
            setRecords(recordsMap)

            // 保存到缓存
            setCache(cacheKey, response.data)
          }
        } catch (error) {
          console.error('加载记录失败:', error)
        } finally {
          setIsLoading(false)
        }
      }

      loadRecords()
    })

    return cleanup
  }, [monthRange])

  // 计算时长
  const calculateDuration = (start: string, end: string): string => {
    // 假设时间在同一天，创建一个基准日期
    const baseDate = '2000-01-01'
    const startDateTime = new Date(`${baseDate}T${start}:00`)
    const endDateTime = new Date(`${baseDate}T${end}:00`)

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
      return `${hours}h ${minutes}m ${seconds}s`
    } else {
      return `${minutes}m ${seconds}s`
    }
  }

  const getDurationMinutes = (start: string, end: string): number => {
    const baseDate = '2000-01-01'
    const startDateTime = new Date(`${baseDate}T${start}:00`)
    const endDateTime = new Date(`${baseDate}T${end}:00`)
    if (endDateTime < startDateTime) {
      endDateTime.setHours(endDateTime.getHours() + 24)
    }
    return Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 60000)
  }

  // 格式化时长用于日历显示（简化版本）
  const formatDurationForCalendar = (duration: string): string => {
    // 从 "2小时15分0秒" 提取数字
    const hoursMatch = duration.match(/(\d+)小时/)
    const minutesMatch = duration.match(/(\d+)分/)
    const secondsMatch = duration.match(/(\d+)秒/)

    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0

    if (hours > 0) {
      // 如果有小时，显示为 "2h15m"
      return `${hours}h${minutes}m`
    } else if (minutes > 0) {
      // 如果只有分钟，显示为 "15m"
      return `${minutes}m`
    } else {
      // 如果只有秒，显示为 "5s"
      return `${seconds}s`
    }
  }

  // 打开编辑弹窗
  const handleDateClick = (date: string) => {
    const record = records.get(date)
    if (record) {
      setCurrentRecord(record)
      setStartTime(record.startTime)
      setEndTime(record.endTime)
      setRating(record.rating)
    } else {
      const now = new Date()
      const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const prevHourDate = new Date(now.getTime() - 3600000)
      const prevHHMM = `${prevHourDate.getHours().toString().padStart(2, '0')}:${prevHourDate.getMinutes().toString().padStart(2, '0')}`

      setCurrentRecord(null)
      setStartTime(prevHHMM)
      setEndTime(currentHHMM)
      setRating(5)
    }
    setSelectedDate(date)
    setShowModal(true)
  }

  // 保存记录
  const handleSave = async () => {
    if (!selectedDate) return

    const duration = calculateDuration(startTime, endTime)

    try {
      if (currentRecord) {
        // 更新记录
        const response = await apiService.updateHardTimeRecord(currentRecord.id, {
          startTime,
          endTime,
          rating
        })
        if (response.success) {
          const updatedRecord = { ...currentRecord, startTime, endTime, rating, duration }
          setRecords(new Map(records.set(selectedDate, updatedRecord)))
          setShowModal(false)

          // 清除当前月份的缓存并发送事件
          const cacheKey = `${CACHE_KEYS.HARD_TIMES_PREFIX}${selectedDate.substring(0, 7)}`
          removeCache(cacheKey)
          emitDataRefresh(DATA_REFRESH_EVENTS.HARD_TIMES_CHANGED)
        }
      } else {
        // 创建记录
        const response = await apiService.createHardTimeRecord({
          date: selectedDate,
          startTime,
          endTime,
          rating
        })
        if (response.success && response.data) {
          setRecords(new Map(records.set(selectedDate, { ...response.data, duration })))
          setShowModal(false)

          // 清除当前月份的缓存并发送事件
          const cacheKey = `${CACHE_KEYS.HARD_TIMES_PREFIX}${selectedDate.substring(0, 7)}`
          removeCache(cacheKey)
          emitDataRefresh(DATA_REFRESH_EVENTS.HARD_TIMES_CHANGED)
        }
      }
    } catch (error) {
      console.error('保存记录失败:', error)
      alert('Unable to save. Please try again.')
    }
  }

  // 删除记录
  const handleDelete = async () => {
    if (!currentRecord || !selectedDate) return

    if (!window.confirm('确定要删除这条记录吗？')) return

    try {
      const response = await apiService.deleteHardTimeRecord(currentRecord.id)
      if (response.success) {
        const newRecords = new Map(records)
        newRecords.delete(selectedDate)
        setRecords(newRecords)
        setShowModal(false)

        // 清除当前月份的缓存并发送事件
        const cacheKey = `${CACHE_KEYS.HARD_TIMES_PREFIX}${selectedDate.substring(0, 7)}`
        removeCache(cacheKey)
        emitDataRefresh(DATA_REFRESH_EVENTS.HARD_TIMES_CHANGED)
      }
    } catch (error) {
      console.error('删除记录失败:', error)
      alert('Unable to delete. Please try again.')
    }
  }


  // 生成日历日期
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    let startingDayOfWeek = firstDay.getDay()
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

    const days: Array<{ date: string; day: number; isToday: boolean; record: HardTimeRecord | null }> = []

    // 填充空白
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: '', day: 0, isToday: false, record: null })
    }

    // 填充日期
    const today = new Date()
    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = (date.getMonth() + 1).toString().padStart(2, '0')
      const d = date.getDate().toString().padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    const todayStr = formatDate(today)

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = formatDate(date)
      const record = records.get(dateStr) || null
      const isToday = dateStr === todayStr

      days.push({ date: dateStr, day, isToday, record })
    }

    return days
  }, [currentDate, records])

  const formatDisplayDate = (dateStr: string) => {
    const [, m, d] = dateStr.split('-').map(Number)
    return `${m}/${d}`
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Calculate stats
  const recordsArray = Array.from(records.values())
  const totalRating = recordsArray.reduce((sum, r) => sum + r.rating, 0)
  const avg = recordsArray.length > 0 ? (totalRating / recordsArray.length) : 0
  const averageRating = avg === 0 ? '0' : (avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1))
  const ratingCount = recordsArray.length
  const totalDurationMinutes = recordsArray.reduce((sum, r) => sum + getDurationMinutes(r.startTime, r.endTime), 0)
  const formatTotalDuration = (totalMins: number) => {
    if (totalMins < 60) return `${totalMins} m`
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    return m === 0 ? `${h} h` : `${h} h ${m} m`
  }
  const avgDurationMinutes = recordsArray.length > 0 ? (totalDurationMinutes / recordsArray.length) : 0
  const formatAvgDuration = (avgMins: number) => {
    if (avgMins === 0) return '0m'
    const roundedMins = Math.round(avgMins)
    if (roundedMins < 60) return `${roundedMins}m`
    const h = Math.floor(roundedMins / 60)
    const m = roundedMins % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  return (
    <div className="fixed sm:static inset-0 bg-[#F2F2F7] dark:bg-black font-sans flex flex-col items-center p-0 sm:p-6 overflow-hidden overscroll-none z-[1000]">
      <div className="w-full h-full sm:h-auto sm:min-h-[850px] max-w-md mx-auto bg-white dark:bg-[#1C1C1E] sm:rounded-[3rem] shadow-xl overflow-hidden relative flex flex-col">

        {/* Top Controls Overlay matching Upload.tsx */}
        <div className="absolute top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,40px)] px-6 pointer-events-none">
          <div className="flex justify-between items-start w-full py-2 pointer-events-auto">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-black/5 dark:border-white/10 text-black dark:text-white shadow-sm active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
          </div>
        </div>

        {/* Fake Dynamic Island / Notch (only visible on large screens) */}
        <div className="hidden sm:flex absolute top-0 inset-x-0 justify-center pt-3">
          <div className="w-28 h-7 bg-gray-200 dark:bg-black rounded-full"></div>
        </div>

        <div className="px-6 pt-32 sm:pt-40 flex-1 flex flex-col h-full overflow-hidden pb-4">

          {/* Header */}
          <div className="flex justify-between items-start mb-6 shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold text-black dark:text-white leading-tight">Hard Times</h1>
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-full px-2 py-1 border border-black/5 dark:border-white/10 shadow-sm">
                  <button 
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 active:scale-75 transition-transform"
                  >
                    <span className="text-lg leading-none">‹</span>
                  </button>
                  <span className="text-[14px] font-black text-purple-600 dark:text-purple-400 tabular-nums px-1">
                    {currentDate.getFullYear()}
                  </span>
                  <button 
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 active:scale-75 transition-transform"
                  >
                    <span className="text-lg leading-none">›</span>
                  </button>
                </div>
              </div>
              <h2 className="text-[22px] font-bold text-gray-400 dark:text-gray-500">{formatTotalDuration(totalDurationMinutes)}</h2>
            </div>
            <div className="min-w-[44px] h-11 px-3 rounded-full border border-gray-100 dark:border-[#38383A] flex flex-col items-center justify-center bg-white dark:bg-[#2C2C2E] shadow-sm flex-shrink-0">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none mb-0.5">AVG</span>
              <span className="text-[13px] font-black text-purple-600 dark:text-purple-400 leading-none tabular-nums">
                {formatAvgDuration(avgDurationMinutes)}
              </span>
            </div>
          </div>

          {/* Month Selector (Moved from Bottom) */}
          <div className="mb-8 shrink-0">
            <div
              ref={monthScrollRef}
              className="flex gap-6 overflow-x-auto hide-scrollbar items-center px-0.5"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              {months.map((m, i) => {
                const isCurrent = currentDate.getMonth() === i;
                return (
                  <button
                    key={m}
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), i, 1))}
                    className={`
                      whitespace-nowrap transition-colors flex-shrink-0
                      ${isCurrent ? 'text-black dark:text-white font-bold text-[20px]' : 'text-gray-400 dark:text-gray-600 font-medium text-[18px]'}
                    `}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar */}
          <div className="mb-6 shrink-0">
            <div className="grid grid-cols-7 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-[15px] text-gray-800 dark:text-gray-200">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-4 gap-x-2">
              {calendarDays.map((dayItem, index) => {
                if (!dayItem.date) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>
                }

                const hasRecord = dayItem.record !== null
                const isSelected = selectedDate === dayItem.date && showModal
                const isToday = dayItem.isToday

                return (
                  <div key={dayItem.date} className="flex flex-col items-center min-h-[4rem]">
                    <button
                      onClick={() => handleDateClick(dayItem.date)}
                      className={`
                        aspect-square rounded-full flex items-center justify-center text-[17px] font-medium transition-all w-[2.5rem] shrink-0 relative
                        ${isToday ? 'border-2 border-purple-500 shadow-sm' : 'border-2 border-transparent'}
                        ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-black z-10' : ''}
                        ${hasRecord 
                          ? 'bg-black text-white dark:bg-white dark:text-black' 
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white'
                        }
                      `}
                    >
                      {dayItem.day}
                    </button>
                    {hasRecord && dayItem.record && (
                      <div className="flex flex-col items-center mt-1.5 gap-0.5 w-full">
                        <div className="flex items-center justify-center gap-1 bg-yellow-400/10 dark:bg-yellow-400/5 px-1.5 h-4 rounded-full w-fit">
                          <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 leading-none">{dayItem.record.rating}</span>
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 shrink-0 relative top-[-0.2px]" />
                        </div>
                        <div className="text-[9px] font-medium text-gray-400 dark:text-gray-500 leading-none whitespace-nowrap">
                          {formatDurationForCalendar(dayItem.record.duration)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between items-end mb-4 mt-auto shrink-0 px-2">
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[4rem] leading-none font-black text-black dark:text-white tracking-tighter">
                  {averageRating}
                </span>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mb-2" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[4rem] leading-none font-black text-black dark:text-white tracking-tighter">
                {ratingCount}
              </span>
              <span className="text-[14px] text-gray-400 dark:text-gray-500 font-medium">Times</span>
            </div>
          </div>


        </div>

        {/* 编辑弹窗 */}
        {showModal && selectedDate && (
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-fadeIn"
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) e.preventDefault()
            }}
          >
            <div className="bg-white dark:bg-[#1C1C1E] rounded-t-3xl w-full h-[65%] animate-slideUp overflow-hidden box-border border-t border-white/20 dark:border-[#38383A] p-6 pb-32">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white truncate flex-1">
                  {formatDisplayDate(selectedDate)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-[#8E8E93]" />
                </button>
              </div>

              {/* 时间选择 - 同行显示 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="relative">
                  <span className="absolute -top-2.5 left-3 px-1 bg-white dark:bg-[#1C1C1E] text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider z-10">Start</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-200 dark:border-[#38383A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50 dark:bg-[#2C2C2E] text-lg font-semibold text-gray-900 dark:text-white appearance-none"
                  />
                </div>
                <div className="relative">
                  <span className="absolute -top-2.5 left-3 px-1 bg-white dark:bg-[#1C1C1E] text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider z-10">End</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-200 dark:border-[#38383A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50 dark:bg-[#2C2C2E] text-lg font-semibold text-gray-900 dark:text-white appearance-none"
                  />
                </div>
              </div>

              {/* 时长Preview - 居中显眼 */}
              <div className="flex flex-col items-center mb-10">
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tighter">
                  {calculateDuration(startTime, endTime)}
                </p>
              </div>

              {/* 评分展示 - 图片+数字 */}
              <div className="flex flex-col items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full"></div>
                  <img 
                    src={`/ratings/R${rating}.png`} 
                    className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl transition-transform duration-300 transform hover:scale-105" 
                    alt="" 
                  />
                </div>
              </div>

              {/* 评分滑动条 */}
              <div className="px-1 mb-8">
                <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer rating-slider"
                      style={{
                        background: `linear-gradient(to right, #9333ea 0%, #9333ea ${((rating - 1) / 9) * 100}%, #e5e7eb ${((rating - 1) / 9) * 100}%, #e5e7eb 100%)`,
                        touchAction: 'pan-y'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-[#8E8E93] mt-1">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-black text-white dark:bg-white dark:text-black font-semibold py-3 px-6 rounded-xl shadow-lg hover:opacity-80 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save
                </button>
                {currentRecord && (
                  <button
                    onClick={handleDelete}
                    className="px-6 bg-red-500 dark:bg-red-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
