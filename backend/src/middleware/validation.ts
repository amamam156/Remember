import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

export const validateLogin = [
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 1 })
    .withMessage('密码格式不正确'),
];

export const validateMemory = [
  body('happenedAt')
    .notEmpty()
    .withMessage('时间不能为空')
    .isISO8601()
    .withMessage('时间格式不正确'),
  body('title')
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度应在1-200字符之间'),
  body('topic')
    .optional()
    .isLength({ max: 100 })
    .withMessage('主题长度不能超过100字符'),
  body('locationTxt')
    .optional()
    .isLength({ max: 200 })
    .withMessage('位置描述长度不能超过200字符'),
  body('countryId')
    .notEmpty()
    .withMessage('国家ID不能为空'),
  body('admin1Id')
    .optional(),
  body('cityId')
    .optional(),
  body('imageUrl')
    .optional()
    .custom((value) => {
      // 允许相对路径、完整URL、或URL数组
      if (!value) return true;
      
      // 如果是数组，验证每个URL
      if (Array.isArray(value)) {
        return value.every(url => 
          typeof url === 'string' && 
          (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'))
        );
      }
      
      // 单个URL
      return typeof value === 'string' && 
        (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://'));
    })
    .withMessage('图片URL格式不正确'),
  body('tagIds')
    .optional()
    .isArray()
    .withMessage('标签ID必须是数组格式'),
  body('tagIds.*')
    .optional()
    .isUUID()
    .withMessage('标签ID格式不正确'),
];

export const validateHotel = [
  body('name')
    .notEmpty()
    .withMessage('酒店名称不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('酒店名称长度应在1-200字符之间'),
  body('checkInDate')
    .notEmpty()
    .withMessage('入住日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('入住日期格式不正确，应为 YYYY-MM-DD'),
  body('checkOutDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('离开日期格式不正确，应为 YYYY-MM-DD'),
  body('locationTxt')
    .optional()
    .isLength({ max: 200 })
    .withMessage('地点描述长度不能超过200字符'),
  body('countryId')
    .notEmpty()
    .withMessage('国家ID不能为空'),
  body('admin1Id')
    .optional(),
  body('cityId')
    .optional(),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('备注长度不能超过1000字符'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('星级评分必须在1-5之间'),
  body('hotelImages')
    .optional()
    .isArray()
    .withMessage('酒店图片必须是数组格式'),
  body('hotelImages.*')
    .optional()
    .isString()
    .withMessage('酒店图片URL必须是字符串'),
  body('roomCardImages')
    .optional()
    .isArray()
    .withMessage('房卡图片必须是数组格式'),
  body('roomCardImages.*')
    .optional()
    .isString()
    .withMessage('房卡图片URL必须是字符串'),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array()
    });
    return;
  }
  next();
};
