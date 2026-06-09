import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    
    let whereClause: any = { companyId: req.user!.company_id };
    
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
    
    // Convert camelCase to snake_case for frontend
    res.json(products.map(p => ({
      ...p,
      product_code: p.productCode,
      company_id: p.companyId,
      last_updated: p.lastUpdated
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:code', async (req: AuthRequest, res: Response) => {
  try {
    const p = await prisma.product.findUnique({
      where: {
        companyId_productCode: {
          companyId: req.user!.company_id,
          productCode: req.params.code
        }
      }
    });
    
    if (!p) return res.status(404).json({ error: 'Product not found' });
    
    res.json({
      ...p,
      product_code: p.productCode,
      company_id: p.companyId,
      last_updated: p.lastUpdated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { product_code, name, description, weight, price, quantity } = req.body;
    if (!product_code || !name || price === undefined) return res.status(400).json({ error: 'product_code, name, and price are required' });
    
    const existing = await prisma.product.findUnique({
      where: {
        companyId_productCode: {
          companyId: req.user!.company_id,
          productCode: product_code
        }
      }
    });
    
    if (existing) return res.status(409).json({ error: 'Product code already exists' });
    
    const p = await prisma.product.create({
      data: {
        companyId: req.user!.company_id,
        productCode: product_code,
        name,
        description: description || '',
        weight: weight || 0,
        price,
        quantity: quantity || 0
      }
    });
    
    res.status(201).json({
      ...p,
      product_code: p.productCode,
      company_id: p.companyId,
      last_updated: p.lastUpdated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:code', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.product.findUnique({
      where: {
        companyId_productCode: {
          companyId: req.user!.company_id,
          productCode: req.params.code
        }
      }
    });
    
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    
    const { name, description, weight, price, quantity } = req.body;
    
    const p = await prisma.product.update({
      where: {
        companyId_productCode: {
          companyId: req.user!.company_id,
          productCode: req.params.code
        }
      },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        weight: weight ?? existing.weight,
        price: price ?? existing.price,
        quantity: quantity ?? existing.quantity,
        lastUpdated: new Date()
      }
    });
    
    res.json({
      ...p,
      product_code: p.productCode,
      company_id: p.companyId,
      last_updated: p.lastUpdated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:code', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete products' });
    
    const existing = await prisma.product.findUnique({
      where: {
        companyId_productCode: {
          companyId: req.user!.company_id,
          productCode: req.params.code
        }
      }
    });
    
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    await prisma.product.delete({
      where: {
        companyId_productCode: {
          companyId: req.user!.company_id,
          productCode: req.params.code
        }
      }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
