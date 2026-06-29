import { Router } from 'express';
import { register } from '../controllers/authController';

const router = Router();

// POST /api/auth/register - 用户注册（无需 JWT 鉴权）
router.post('/register', register);

export default router;