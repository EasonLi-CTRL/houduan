import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/referrals
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [items, total] = await Promise.all([
      prisma.referral.findMany({
        include: { lead: { select: { name: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.count(),
    ]);

    const data = {
      items: items.map((r) => ({
        id: r.id,
        referrerName: r.referrerName,
        referrerPhone: r.referrerPhone,
        referredName: r.lead?.name || '',
        status: r.status,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };

    res.json({ code: 0, data, message: 'success' });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /api/referrals
router.post('/', async (req: Request, res: Response) => {
  try {
    const { referrerName, referrerPhone, referredName, rewardAmount } = req.body;

    // Find or create a lead for the referred person
    let lead = await prisma.lead.findFirst({
      where: { name: referredName },
    });

    if (!lead) {
      // Create a minimal lead entry for referral tracking
      const defaultCommunity = await prisma.community.findFirst();
      if (!defaultCommunity) {
        res.status(400).json({ code: 400, data: null, message: '请先创建小区数据' });
        return;
      }
      lead = await prisma.lead.create({
        data: {
          name: referredName,
          phone: referrerPhone,
          communityId: defaultCommunity.id,
          creatorId: req.user!.userId,
          source: '转介绍',
        },
      });
    }

    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerPhone,
        leadId: lead.id,
        rewardAmount: rewardAmount || 0,
      },
      include: { lead: { select: { name: true } } },
    });

    res.json({
      code: 0,
      data: {
        id: referral.id,
        referrerName: referral.referrerName,
        referrerPhone: referral.referrerPhone,
        referredName: referral.lead?.name || '',
        status: referral.status,
        rewardAmount: referral.rewardAmount,
        createdAt: referral.createdAt.toISOString(),
      },
      message: '创建成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

export default router;