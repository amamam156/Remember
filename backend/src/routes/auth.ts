import { Router } from 'express';
import { login, logout } from '../controllers/authController.js';
import { validateLogin, handleValidationErrors } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: '登录尝试过于频繁，请稍后再试' }
});

// 登录
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, login);

// 登出
router.post('/logout', logout);

export default router;
