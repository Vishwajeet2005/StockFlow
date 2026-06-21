import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

const SALE_STATUSES = ['quotation', 'packing', 'dispatched', 'completed'];
const PURCHASE_STATUSES = ['quotation_received', 'unpaid', 'paid', 'completed'];

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, search } = req.query;
    
    let whereClause: any = { companyId: req.user!.company_id };
    
    if (type && typeof type === 'string') whereClause.type = type;
    if (status && typeof status === 'string') whereClause.status = status;
    
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { partyName: { contains: search, mode: 'insensitive' } },
        { partyId: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { lastUpdated: 'desc' }
    });
    
    res.json(orders.map(o => ({
      ...o,
      order_id: o.orderId,
      company_id: o.companyId,
      party_id: o.partyId,
      party_name: o.partyName,
      total_amount: o.totalAmount,
      last_updated: o.lastUpdated,
      products: JSON.parse(o.products || '[]')
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const o = await prisma.order.findUnique({
      where: {
        companyId_orderId: {
          companyId: req.user!.company_id,
          orderId: req.params.id
        }
      }
    });
    
    if (!o) return res.status(404).json({ error: 'Order not found' });
    
    res.json({
      ...o,
      order_id: o.orderId,
      company_id: o.companyId,
      party_id: o.partyId,
      party_name: o.partyName,
      total_amount: o.totalAmount,
      last_updated: o.lastUpdated,
      products: JSON.parse(o.products || '[]')
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, party_id, party_name, products, notes } = req.body;
    if (!type || !products || !Array.isArray(products)) return res.status(400).json({ error: 'type and products array required' });
    
    const totalAmount = products.reduce((s: number, p: any) => s + (p.price * p.quantity), 0);
    const orderId = `${type === 'sale' ? 'SO' : 'PO'}-${Date.now().toString(36).toUpperCase()}`;
    const status = type === 'sale' ? 'quotation' : 'quotation_received';
    
    const o = await prisma.order.create({
      data: {
        companyId: req.user!.company_id,
        orderId,
        type,
        partyId: party_id || '',
        partyName: party_name || '',
        products: JSON.stringify(products),
        status,
        notes: notes || '',
        totalAmount
      }
    });
    
    res.status(201).json({
      ...o,
      order_id: o.orderId,
      company_id: o.companyId,
      party_id: o.partyId,
      party_name: o.partyName,
      total_amount: o.totalAmount,
      last_updated: o.lastUpdated,
      products: JSON.parse(o.products)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.order.findUnique({
      where: {
        companyId_orderId: {
          companyId: req.user!.company_id,
          orderId: req.params.id
        }
      }
    });
    
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    
    const { party_id, party_name, products, notes } = req.body;
    const updatedProducts = products || JSON.parse(existing.products);
    const totalAmount = updatedProducts.reduce((s: number, p: any) => s + (p.price * p.quantity), 0);
    
    const o = await prisma.order.update({
      where: {
        companyId_orderId: {
          companyId: req.user!.company_id,
          orderId: req.params.id
        }
      },
      data: {
        partyId: party_id ?? existing.partyId,
        partyName: party_name ?? existing.partyName,
        products: JSON.stringify(updatedProducts),
        notes: notes ?? existing.notes,
        totalAmount,
        lastUpdated: new Date()
      }
    });
    
    res.json({
      ...o,
      order_id: o.orderId,
      company_id: o.companyId,
      party_id: o.partyId,
      party_name: o.partyName,
      total_amount: o.totalAmount,
      last_updated: o.lastUpdated,
      products: JSON.parse(o.products)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: {
        companyId_orderId: {
          companyId: req.user!.company_id,
          orderId: req.params.id
        }
      }
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const products = JSON.parse(order.products || '[]');
    const statuses = order.type === 'sale' ? SALE_STATUSES : PURCHASE_STATUSES;
    const currentIdx = statuses.indexOf(order.status);
    const newStatus = req.body.status || statuses[Math.min(currentIdx + 1, statuses.length - 1)];

    // Use a transaction for inventory updates
    await prisma.$transaction(async (tx) => {
      if (order.type === 'sale' && newStatus === 'dispatched' && order.status !== 'dispatched') {
        for (const p of products) {
          await tx.product.update({
            where: {
              companyId_productCode: { companyId: req.user!.company_id, productCode: p.product_code }
            },
            data: {
              quantity: { decrement: p.quantity },
              lastUpdated: new Date()
            }
          });
        }
      }
      
      if (order.type === 'purchase' && newStatus === 'completed' && order.status !== 'completed') {
        for (const p of products) {
          // Note: If product doesn't exist, this will throw an error and rollback
          // In a production system, we'd want to handle creating missing products via upsert
          await tx.product.update({
            where: {
              companyId_productCode: { companyId: req.user!.company_id, productCode: p.product_code }
            },
            data: {
              quantity: { increment: p.quantity },
              lastUpdated: new Date()
            }
          });
        }
      }
      
      await tx.order.update({
        where: {
          companyId_orderId: { companyId: req.user!.company_id, orderId: req.params.id }
        },
        data: {
          status: newStatus,
          lastUpdated: new Date()
        }
      });
    });

    const o = await prisma.order.findUnique({
      where: {
        companyId_orderId: {
          companyId: req.user!.company_id,
          orderId: req.params.id
        }
      }
    });
    
    res.json({
      ...o,
      order_id: o!.orderId,
      company_id: o!.companyId,
      party_id: o!.partyId,
      party_name: o!.partyName,
      total_amount: o!.totalAmount,
      last_updated: o!.lastUpdated,
      products: JSON.parse(o!.products)
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.order.findUnique({
      where: {
        companyId_orderId: {
          companyId: req.user!.company_id,
          orderId: req.params.id
        }
      }
    });
    
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    await prisma.order.delete({
      where: {
        companyId_orderId: {
          companyId: req.user!.company_id,
          orderId: req.params.id
        }
      }
    });

    await auditLog(
      req.user!.company_id,
      req.user!.id,
      'DELETE_ORDER',
      req.ip,
      { orderId: req.params.id }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
