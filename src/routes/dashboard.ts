import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newLeadsThisMonth, followingUp, dealCount, referralCount] = await Promise.all([
      prisma.lead.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.lead.count({
        where: { status: { in: ['contacted', 'measuring', 'quoted'] } },
      }),
      prisma.lead.count({
        where: { status: 'deal' },
      }),
      prisma.referral.count(),
    ]);

    res.json({
      code: 0,
      data: { newLeadsThisMonth, followingUp, dealCount, referralCount },
      message: 'success',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /api/dashboard/tasks
router.get('/tasks', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.lead.findMany({
      where: {
        nextFollowUpAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { notIn: ['deal', 'lost'] },
      },
      include: { community: true },
      orderBy: { nextFollowUpAt: 'asc' },
    });

    const data = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      communityName: t.community?.name || '',
      interestedProduct: t.intendedProduct,
      status: t.status,
      notes: t.remark,
    }));

    res.json({ code: 0, data, message: 'success' });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

export default router;