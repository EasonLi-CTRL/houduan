import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, storeName } = req.body;

    if (!phone || !password) {
      res.status(400).json({ code: 400, data: null, message: '手机号和密码不能为空' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      res.status(400).json({ code: 400, data: null, message: '该手机号已注册' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { phone, password: hashedPassword, storeName: storeName || '' },
    });

    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      data: { token, user: { id: user.id, phone: user.phone, storeName: user.storeName } },
      message: '注册成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ code: 400, data: null, message: '手机号和密码不能为空' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(401).json({ code: 401, data: null, message: '手机号或密码错误' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ code: 401, data: null, message: '手机号或密码错误' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      data: { token, user: { id: user.id, phone: user.phone, storeName: user.storeName, role: 'admin' } },
      message: '登录成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

export default router;