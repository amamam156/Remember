import type { Request, Response } from 'express';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const imageUrl = (req.file as any).imageUrl || `/uploads/${req.file.filename}`;
    const thumbnailUrl = (req.file as any).thumbnailUrl || imageUrl;

    return res.json({
      success: true,
      data: {
        imageUrl,
        thumbnailUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: '图片上传成功'
    });
  } catch (error) {
    console.error('图片上传错误:', error);
    return res.status(500).json({
      success: false,
      message: '图片上传失败'
    });
  }
};
