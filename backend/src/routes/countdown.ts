import express from 'express'
import { getCountdown } from '../controllers/countdownController'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/countdown - 获取倒计时
router.get('/', getCountdown)

export default router
