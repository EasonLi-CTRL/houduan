import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/leads
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const intentionLevel = req.query.intentionLevel as string;
    const communityId = req.query.communityId ? parseInt(req.query.communityId as string) : undefined;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (intentionLevel) where.intentionLevel = intentionLevel;
    if (communityId) where.communityId = communityId;

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { community: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    const data = {
      items: items.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        communityId: l.communityId,
        communityName: l.community?.name || '',
        layout: l.houseType,
        area: l.area,
        interestedProduct: l.intendedProduct,
        budget: l.budget,
        level: l.intentionLevel,
        status: l.status,
        source: l.source,
        nextFollowUp: l.nextFollowUpAt?.toISOString() || '',
        notes: l.remark,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
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

// GET /api/leads/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        community: true,
        followUps: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      res.status(404).json({ code: 404, data: null, message: '未找到该业主线索' });
      return;
    }

    const data = {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      communityId: lead.communityId,
      communityName: lead.community?.name || '',
      layout: lead.houseType,
      area: lead.area,
      interestedProduct: lead.intendedProduct,
      budget: lead.budget,
      level: lead.intentionLevel,
      status: lead.status,
      source: lead.source,
      nextFollowUp: lead.nextFollowUpAt?.toISOString() || '',
      notes: lead.remark,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      followUps: lead.followUps.map((f) => ({
        id: f.id,
        leadId: f.leadId,
        type: f.type,
        content: f.content,
        createdAt: f.createdAt.toISOString(),
      })),
    };

    res.json({ code: 0, data, message: 'success' });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /api/leads
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      name, phone, communityId, layout, area, interestedProduct,
      budget, level, status, source, nextFollowUp, notes,
    } = req.body;

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        communityId,
        houseType: layout || '',
        area: area || 0,
        intendedProduct: interestedProduct || '',
        budget: budget || 0,
        intentionLevel: level || 'C',
        status: status || 'new',
        source: source || '门店进店',
        nextFollowUpAt: nextFollowUp ? new Date(nextFollowUp) : null,
        remark: notes || '',
        creatorId: userId,
      },
      include: { community: true },
    });

    res.json({
      code: 0,
      data: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        communityId: lead.communityId,
        communityName: lead.community?.name || '',
        layout: lead.houseType,
        area: lead.area,
        interestedProduct: lead.intendedProduct,
        budget: lead.budget,
        level: lead.intentionLevel,
        status: lead.status,
        source: lead.source,
        nextFollowUp: lead.nextFollowUpAt?.toISOString() || '',
        notes: lead.remark,
        createdAt: lead.createdAt.toISOString(),
      },
      message: '创建成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// PUT /api/leads/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name, phone, communityId, layout, area, interestedProduct,
      budget, level, status, source, nextFollowUp, notes,
    } = req.body;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ code: 404, data: null, message: '未找到该业主线索' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (communityId !== undefined) updateData.communityId = communityId;
    if (layout !== undefined) updateData.houseType = layout;
    if (area !== undefined) updateData.area = area;
    if (interestedProduct !== undefined) updateData.intendedProduct = interestedProduct;
    if (budget !== undefined) updateData.budget = budget;
    if (level !== undefined) updateData.intentionLevel = level;
    if (status !== undefined) updateData.status = status;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.remark = notes;
    if (nextFollowUp !== undefined) {
      updateData.nextFollowUpAt = nextFollowUp ? new Date(nextFollowUp) : null;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: { community: true },
    });

    res.json({
      code: 0,
      data: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        communityId: lead.communityId,
        communityName: lead.community?.name || '',
        layout: lead.houseType,
        area: lead.area,
        interestedProduct: lead.intendedProduct,
        budget: lead.budget,
        level: lead.intentionLevel,
        status: lead.status,
        source: lead.source,
        nextFollowUp: lead.nextFollowUpAt?.toISOString() || '',
        notes: lead.remark,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      },
      message: '更新成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /api/leads/:id/followups
router.post('/:id/followups', async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const { type, content } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      res.status(404).json({ code: 404, data: null, message: '未找到该业主线索' });
      return;
    }

    const followUp = await prisma.followUp.create({
      data: { leadId, type, content, followerId: userId },
    });

    // Update lead status to contacted if it's new
    if (lead.status === 'new') {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'contacted' },
      });
    }

    res.json({
      code: 0,
      data: {
        id: followUp.id,
        leadId: followUp.leadId,
        type: followUp.type,
        content: followUp.content,
        createdAt: followUp.createdAt.toISOString(),
      },
      message: '添加成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

export default router;