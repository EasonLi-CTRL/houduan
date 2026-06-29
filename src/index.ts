import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import authRoutesNew from './routes/authRoutes';
import dashboardRoutes from './routes/dashboard';
import leadRoutes from './routes/leads';
import communityRoutes from './routes/communities';
import productRoutes from './routes/products';
import referralRoutes from './routes/referrals';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Public routes - authRoutesNew must come first so the new register controller takes precedence
app.use('/api/auth', authRoutesNew);
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/leads', authMiddleware, leadRoutes);
app.use('/api/communities', authMiddleware, communityRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/referrals', authMiddleware, referralRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', time: new Date().toISOString() }, message: 'success' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;