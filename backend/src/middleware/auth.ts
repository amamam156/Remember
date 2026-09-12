import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false, 
      message: '访问令牌缺失' 
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 未配置');
    }

    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });

    if (typeof decoded === 'string' || typeof decoded.userId !== 'string') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    
    // 签名、算法和载荷均验证通过后写入请求上下文。
    req.user = { id: decoded.userId };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false, 
      message: '无效的访问令牌' 
    });
  }
};
