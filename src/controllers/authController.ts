import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';

export const register = async (req: Request, res: Response) => {
  try {
    const { phone, password, storeName } = req.body;

    // 校验手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({ code: 400, data: null, message: '请输入正确的11位手机号' });
      return;
    }

    // 校验密码长度
    if (!password || password.length < 6) {
      res.status(400).json({ code: 400, data: null, message: '密码至少6位' });
      return;
    }

    // 校验门店名称
    if (!storeName || storeName.trim() === '') {
      res.status(400).json({ code: 400, data: null, message: '门店名称不能为空' });
      return;
    }

    // 检查手机号是否已注册
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      res.status(400).json({ code: 400, data: null, message: '该手机号已注册' });
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        storeName: storeName.trim(),
      },
    });

    res.json({
      code: 0,
      data: { id: user.id, phone: user.phone, storeName: user.storeName },
      message: '注册成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
};