import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/products
router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model,
      priceRange: p.priceRange,
      description: p.description,
      image: p.imageUrl,
      createdAt: p.createdAt.toISOString(),
    }));
    res.json({ code: 0, data, message: 'success' });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, model, priceRange, description, image, category } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        model: model || '',
        priceRange: priceRange || '',
        description: description || '',
        imageUrl: image || '',
        category: category || '木门',
      },
    });
    res.json({
      code: 0,
      data: {
        id: product.id,
        name: product.name,
        model: product.model,
        priceRange: product.priceRange,
        description: product.description,
        image: product.imageUrl,
        createdAt: product.createdAt.toISOString(),
      },
      message: '创建成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

export default router;