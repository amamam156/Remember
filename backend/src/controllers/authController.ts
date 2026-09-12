import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import type { LoginRequest, LoginResponse } from '../models/User.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { password }: LoginRequest = req.body;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: '服务器配置错误'
      });
    }

    // 查找匹配密码的用户
    const users = await prisma.user.findMany();
    let matchedUser = null;

    for (const user of users) {
      // 尝试bcrypt验证
      const isBcryptMatch = await bcrypt.compare(password, user.password);
      if (isBcryptMatch) {
        matchedUser = user;
        break;
      }
      
    }

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: matchedUser.id, username: matchedUser.username },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' } as jwt.SignOptions
    );

    const response: LoginResponse = {
      success: true,
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        username: matchedUser.username
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const logout = (req: Request, res: Response) => {
  // 简化：前端删除token即可，不需要后端黑名单
  return res.json({
    success: true,
    message: '登出成功'
  });
};
