import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validateData } from '../middleware/validate';
import { auditLog } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

const getProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional()
  })
});

router.get('/', validateData(getProductsSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    
    let whereClause: any = { companyId: req.user!.company_id };
    
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      })
    ]);
    
    res.json({
      data: products.map(p => ({
        ...p,
        product_code: p.productCode,
        company_id: p.companyId,
        min_stock_level: p.minStockLevel,
        last_updated: p.lastUpdated
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
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
      min_stock_level: p.minStockLevel,
      last_updated: p.lastUpdated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const createProductSchema = z.object({
  body: z.object({
    product_code: z.string().min(1, 'Product code is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    weight: z.number().nonnegative().optional(),
    price: z.number().nonnegative('Price must be non-negative'),
    quantity: z.number().int().nonnegative().optional(),
    min_stock_level: z.number().nonnegative().optional()
  })
});

router.post('/', validateData(createProductSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { product_code, name, description, weight, price, quantity, min_stock_level } = req.body;
    
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
        quantity: quantity || 0,
        minStockLevel: min_stock_level || 10
      }
    });
    
    res.status(201).json({
      ...p,
      product_code: p.productCode,
      company_id: p.companyId,
      min_stock_level: p.minStockLevel,
      last_updated: p.lastUpdated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    weight: z.number().nonnegative().optional(),
    price: z.number().nonnegative().optional(),
    quantity: z.number().int().nonnegative().optional(),
    min_stock_level: z.number().nonnegative().optional()
  })
});

router.put('/:code', validateData(updateProductSchema), async (req: AuthRequest, res: Response) => {
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
    
    const { name, description, weight, price, quantity, min_stock_level } = req.body;
    
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
        minStockLevel: min_stock_level ?? existing.minStockLevel,
        lastUpdated: new Date()
      }
    });
    
    res.json({
      ...p,
      product_code: p.productCode,
      company_id: p.companyId,
      min_stock_level: p.minStockLevel,
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
    
    await auditLog(
      req.user!.company_id,
      req.user!.id,
      'DELETE_PRODUCT',
      req.ip,
      { productCode: req.params.code }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
