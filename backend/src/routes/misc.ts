import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── Customers ───────────────────────────────────────────────────────────────
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { companyId: req.user!.company_id },
      orderBy: { name: 'asc' }
    });
    res.json(customers.map(c => ({
      ...c,
      customer_id: c.customerId,
      company_id: c.companyId,
      created_at: c.createdAt
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const c = await prisma.customer.findUnique({
      where: {
        companyId_customerId: { companyId: req.user!.company_id, customerId: req.params.id }
      }
    });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...c,
      customer_id: c.customerId,
      company_id: c.companyId,
      created_at: c.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, name, email, phone, address } = req.body;
    if (!customer_id || !name) return res.status(400).json({ error: 'customer_id and name required' });
    
    const existing = await prisma.customer.findUnique({
      where: {
        companyId_customerId: { companyId: req.user!.company_id, customerId: customer_id }
      }
    });
    if (existing) return res.status(409).json({ error: 'Customer ID already exists' });
    
    const c = await prisma.customer.create({
      data: {
        companyId: req.user!.company_id,
        customerId: customer_id,
        name,
        email: email || '',
        phone: phone || '',
        address: address || ''
      }
    });
    
    res.status(201).json({
      ...c,
      customer_id: c.customerId,
      company_id: c.companyId,
      created_at: c.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.customer.findUnique({
      where: {
        companyId_customerId: { companyId: req.user!.company_id, customerId: req.params.id }
      }
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    const { name, email, phone, address } = req.body;
    const c = await prisma.customer.update({
      where: {
        companyId_customerId: { companyId: req.user!.company_id, customerId: req.params.id }
      },
      data: {
        name: name ?? existing.name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        address: address ?? existing.address
      }
    });
    
    res.json({
      ...c,
      customer_id: c.customerId,
      company_id: c.companyId,
      created_at: c.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.customer.delete({
      where: {
        companyId_customerId: { companyId: req.user!.company_id, customerId: req.params.id }
      }
    });
    res.json({ success: true });
  } catch (err) {
    // If it fails to delete, it might not exist
    res.json({ success: true }); 
  }
});

// ─── Suppliers ───────────────────────────────────────────────────────────────
router.get('/suppliers', async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: req.user!.company_id },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers.map(s => ({
      ...s,
      supplier_id: s.supplierId,
      company_id: s.companyId,
      created_at: s.createdAt
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/suppliers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const s = await prisma.supplier.findUnique({
      where: {
        companyId_supplierId: { companyId: req.user!.company_id, supplierId: req.params.id }
      }
    });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...s,
      supplier_id: s.supplierId,
      company_id: s.companyId,
      created_at: s.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/suppliers', async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, name, email, phone, address } = req.body;
    if (!supplier_id || !name) return res.status(400).json({ error: 'supplier_id and name required' });
    
    const existing = await prisma.supplier.findUnique({
      where: {
        companyId_supplierId: { companyId: req.user!.company_id, supplierId: supplier_id }
      }
    });
    if (existing) return res.status(409).json({ error: 'Supplier ID already exists' });
    
    const s = await prisma.supplier.create({
      data: {
        companyId: req.user!.company_id,
        supplierId: supplier_id,
        name,
        email: email || '',
        phone: phone || '',
        address: address || ''
      }
    });
    
    res.status(201).json({
      ...s,
      supplier_id: s.supplierId,
      company_id: s.companyId,
      created_at: s.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/suppliers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.supplier.findUnique({
      where: {
        companyId_supplierId: { companyId: req.user!.company_id, supplierId: req.params.id }
      }
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    const { name, email, phone, address } = req.body;
    const s = await prisma.supplier.update({
      where: {
        companyId_supplierId: { companyId: req.user!.company_id, supplierId: req.params.id }
      },
      data: {
        name: name ?? existing.name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        address: address ?? existing.address
      }
    });
    
    res.json({
      ...s,
      supplier_id: s.supplierId,
      company_id: s.companyId,
      created_at: s.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/suppliers/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.supplier.delete({
      where: {
        companyId_supplierId: { companyId: req.user!.company_id, supplierId: req.params.id }
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const c = req.user!.company_id;
    
    const [
      totalProducts,
      pendingSales,
      pendingPurchases,
      wipBatches,
      lowStockProducts,
      recentOrdersList
    ] = await Promise.all([
      prisma.product.count({ where: { companyId: c } }),
      prisma.order.count({ where: { companyId: c, type: 'sale', status: { not: 'completed' } } }),
      prisma.order.count({ where: { companyId: c, type: 'purchase', status: { not: 'completed' } } }),
      prisma.manufacturingBatch.count({ where: { companyId: c, status: 'in_progress' } }),
      prisma.product.findMany({ where: { companyId: c, quantity: { lte: 10 } }, orderBy: { quantity: 'asc' }, take: 5 }),
      prisma.order.findMany({ where: { companyId: c }, orderBy: { lastUpdated: 'desc' }, take: 5 })
    ]);
    
    // Calculate total inventory value
    const valResult = await prisma.product.aggregate({
      where: { companyId: c },
      _sum: { price: true, quantity: true } // Prisma can't easily do SUM(price*quantity) out of the box in simple aggregations.
    });
    
    // We actually need to do price * quantity per product, so we fetch them or do a raw query
    // Since prisma.product.aggregate doesn't support complex expressions directly without queryRaw,
    // let's just do a queryRaw since it's cleaner for SUM(col1 * col2)
    const rawVal: any = await prisma.$queryRaw`SELECT SUM(price * quantity) as v FROM products WHERE company_id=${c}`;
    const totalInventoryValue = rawVal[0]?.v ? Number(rawVal[0].v) : 0;
    
    const lowStock = lowStockProducts.map(p => ({
      ...p,
      product_code: p.productCode,
      company_id: p.companyId,
      last_updated: p.lastUpdated
    }));
    
    const recentOrders = recentOrdersList.map(o => ({
      ...o,
      order_id: o.orderId,
      company_id: o.companyId,
      party_id: o.partyId,
      party_name: o.partyName,
      total_amount: o.totalAmount,
      last_updated: o.lastUpdated,
      products: JSON.parse(o.products || '[]')
    }));

    res.json({ 
      totalProducts, 
      totalInventoryValue, 
      pendingSales, 
      pendingPurchases, 
      wipBatches, 
      lowStock, 
      recentOrders 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Audit Logs ──────────────────────────────────────────────────────────────
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    
    const logs = await prisma.auditLog.findMany({
      where: { companyId: req.user!.company_id },
      include: {
        user: {
          select: { username: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 for performance
    });
    
    res.json(logs);
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
