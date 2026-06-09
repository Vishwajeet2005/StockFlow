import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const c = req.user!.company_id;

    // 1. Get all completed orders for this company
    const orders = await prisma.order.findMany({
      where: {
        companyId: c,
        status: 'completed'
      }
    });

    // Aggregate stats
    let totalRevenue = 0;
    let totalCost = 0;

    // Monthly sales trend (last 6 months)
    const monthlySales: Record<string, number> = {};
    
    // Top selling products
    const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};

    // Initialize last 6 months to 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear();
      monthlySales[monthStr] = 0;
    }

    orders.forEach((o: any) => {
      const orderDate = new Date(o.date);
      const monthStr = orderDate.toLocaleString('en-US', { month: 'short' }) + ' ' + orderDate.getFullYear();

      if (o.type === 'sale') {
        totalRevenue += o.totalAmount;
        if (monthlySales[monthStr] !== undefined) {
          monthlySales[monthStr] += o.totalAmount;
        }

        // Parse products to calculate top sellers
        const products = JSON.parse(o.products || '[]');
        products.forEach((p: any) => {
          if (!productSales[p.product_code]) {
            productSales[p.product_code] = { name: p.name, quantity: 0, revenue: 0 };
          }
          productSales[p.product_code].quantity += Number(p.quantity) || 0;
          productSales[p.product_code].revenue += Number(p.total) || 0;
        });
      } else if (o.type === 'purchase') {
        totalCost += o.totalAmount;
      }
    });

    // Format charts data
    const salesTrend = Object.keys(monthlySales).map(month => ({
      month,
      sales: monthlySales[month]
    }));

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      salesTrend,
      topProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
