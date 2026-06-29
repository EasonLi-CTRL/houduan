import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from '../index';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/communities
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const where: any = {};
    if (search) where.name = { contains: search };

    const communities = await prisma.community.findMany({
      where,
      include: { _count: { select: { leads: true } } },
      orderBy: { name: 'asc' },
    });

    const data = communities.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      completionYear: c.deliveryYear,
      totalUnits: c.totalHouseholds,
      latitude: c.lat,
      longitude: c.lng,
      status: c.status,
      leadCount: c._count.leads,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.createdAt.toISOString(),
    }));

    res.json({ code: 0, data, message: 'success' });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /api/communities/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const community = await prisma.community.findUnique({
      where: { id },
      include: { _count: { select: { leads: true } } },
    });

    if (!community) {
      res.status(404).json({ code: 404, data: null, message: '未找到该小区' });
      return;
    }

    res.json({
      code: 0,
      data: {
        id: community.id,
        name: community.name,
        address: community.address,
        completionYear: community.deliveryYear,
        totalUnits: community.totalHouseholds,
        latitude: community.lat,
        longitude: community.lng,
        status: community.status,
        leadCount: community._count.leads,
        createdAt: community.createdAt.toISOString(),
        updatedAt: community.createdAt.toISOString(),
      },
      message: 'success',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /api/communities/import
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ code: 400, data: null, message: '请上传 CSV 文件' });
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
    });

    let count = 0;

    for (const record of records) {
      const name = record['名称'] || record['name'] || '';
      const address = record['地址'] || record['address'] || '';
      const deliveryYear = parseInt(record['交房年份'] || record['deliveryYear'] || '0');
      const totalHouseholds = parseInt(record['总户数'] || record['totalHouseholds'] || '0');
      const lat = parseFloat(record['纬度'] || record['lat'] || '0');
      const lng = parseFloat(record['经度'] || record['lng'] || '0');

      if (!name) continue;

      await prisma.community.create({
        data: { name, address, deliveryYear, totalHouseholds, lat, lng },
      });
      count++;
    }

    res.json({ code: 0, data: { count }, message: `成功导入 ${count} 个小区` });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

export default router;