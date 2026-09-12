import type { Request, Response } from 'express'

// 开始时间：2018年5月19日
const START_DATE = new Date('2018-05-19T00:00:00')

export const getCountdown = (req: Request, res: Response) => {
  try {
    const now = new Date()
    const diffMs = now.getTime() - START_DATE.getTime()
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const remainingMs = diffMs % (1000 * 60 * 60 * 24)
    const hours = Math.floor(remainingMs / (1000 * 60 * 60))
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
    
    return res.json({
      success: true,
      data: {
        days,
        hours,
        minutes,
        seconds,
        text: `第${days}天，${hours.toString().padStart(2, '0')}时，${minutes.toString().padStart(2, '0')}分，${seconds.toString().padStart(2, '0')}秒`
      }
    })
  } catch (error) {
    console.error('获取倒计时失败:', error)
    return res.status(500).json({
      success: false,
      message: '获取倒计时失败'
    })
  }
}

