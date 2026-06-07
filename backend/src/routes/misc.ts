import { Router, Response } from 'express';
import { runSQL, queryAll, queryOne } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── Customers ───────────────────────────────────────────────────────────────
router.get('/customers', (req: AuthRequest, res: Response) => res.json(queryAll('SELECT * FROM customers WHERE company_id=? ORDER BY name', [req.user!.company_id])));
router.get('/customers/:id', (req: AuthRequest, res: Response) => {
  const c = queryOne('SELECT * FROM customers WHERE company_id=? AND customer_id=?', [req.user!.company_id, req.params.id]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});
router.post('/customers', (req: AuthRequest, res: Response) => {
  const { customer_id, name, email, phone, address } = req.body;
  if (!customer_id || !name) return res.status(400).json({ error: 'customer_id and name required' });
  if (queryOne('SELECT customer_id FROM customers WHERE company_id=? AND customer_id=?', [req.user!.company_id, customer_id])) return res.status(409).json({ error: 'Customer ID already exists' });
  runSQL('INSERT INTO customers (company_id,customer_id,name,email,phone,address) VALUES (?,?,?,?,?,?)', [req.user!.company_id, customer_id, name, email||'', phone||'', address||'']);
  res.status(201).json(queryOne('SELECT * FROM customers WHERE company_id=? AND customer_id=?', [req.user!.company_id, customer_id]));
});
router.put('/customers/:id', (req: AuthRequest, res: Response) => {
  const existing = queryOne('SELECT * FROM customers WHERE company_id=? AND customer_id=?', [req.user!.company_id, req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, email, phone, address } = req.body;
  runSQL('UPDATE customers SET name=?,email=?,phone=?,address=? WHERE company_id=? AND customer_id=?',
    [name??existing.name, email??existing.email, phone??existing.phone, address??existing.address, req.user!.company_id, req.params.id]);
  res.json(queryOne('SELECT * FROM customers WHERE company_id=? AND customer_id=?', [req.user!.company_id, req.params.id]));
});
router.delete('/customers/:id', (req: AuthRequest, res: Response) => {
  runSQL('DELETE FROM customers WHERE company_id=? AND customer_id=?', [req.user!.company_id, req.params.id]);
  res.json({ success: true });
});

// ─── Suppliers ───────────────────────────────────────────────────────────────
router.get('/suppliers', (req: AuthRequest, res: Response) => res.json(queryAll('SELECT * FROM suppliers WHERE company_id=? ORDER BY name', [req.user!.company_id])));
router.get('/suppliers/:id', (req: AuthRequest, res: Response) => {
  const s = queryOne('SELECT * FROM suppliers WHERE company_id=? AND supplier_id=?', [req.user!.company_id, req.params.id]);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});
router.post('/suppliers', (req: AuthRequest, res: Response) => {
  const { supplier_id, name, email, phone, address } = req.body;
  if (!supplier_id || !name) return res.status(400).json({ error: 'supplier_id and name required' });
  if (queryOne('SELECT supplier_id FROM suppliers WHERE company_id=? AND supplier_id=?', [req.user!.company_id, supplier_id])) return res.status(409).json({ error: 'Supplier ID already exists' });
  runSQL('INSERT INTO suppliers (company_id,supplier_id,name,email,phone,address) VALUES (?,?,?,?,?,?)', [req.user!.company_id, supplier_id, name, email||'', phone||'', address||'']);
  res.status(201).json(queryOne('SELECT * FROM suppliers WHERE company_id=? AND supplier_id=?', [req.user!.company_id, supplier_id]));
});
router.put('/suppliers/:id', (req: AuthRequest, res: Response) => {
  const existing = queryOne('SELECT * FROM suppliers WHERE company_id=? AND supplier_id=?', [req.user!.company_id, req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, email, phone, address } = req.body;
  runSQL('UPDATE suppliers SET name=?,email=?,phone=?,address=? WHERE company_id=? AND supplier_id=?',
    [name??existing.name, email??existing.email, phone??existing.phone, address??existing.address, req.user!.company_id, req.params.id]);
  res.json(queryOne('SELECT * FROM suppliers WHERE company_id=? AND supplier_id=?', [req.user!.company_id, req.params.id]));
});
router.delete('/suppliers/:id', (req: AuthRequest, res: Response) => {
  runSQL('DELETE FROM suppliers WHERE company_id=? AND supplier_id=?', [req.user!.company_id, req.params.id]);
  res.json({ success: true });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get('/dashboard', (req: AuthRequest, res: Response) => {
  const c = req.user!.company_id;
  const totalProducts = (queryOne('SELECT COUNT(*) as c FROM products WHERE company_id=?', [c]) as any)?.c || 0;
  const totalInventoryValue = (queryOne('SELECT SUM(price*quantity) as v FROM products WHERE company_id=?', [c]) as any)?.v || 0;
  const pendingSales = (queryOne("SELECT COUNT(*) as c FROM orders WHERE company_id=? AND type='sale' AND status NOT IN ('completed')", [c]) as any)?.c || 0;
  const pendingPurchases = (queryOne("SELECT COUNT(*) as c FROM orders WHERE company_id=? AND type='purchase' AND status NOT IN ('completed')", [c]) as any)?.c || 0;
  const wipBatches = (queryOne("SELECT COUNT(*) as c FROM manufacturing WHERE company_id=? AND status='in_progress'", [c]) as any)?.c || 0;
  const lowStock = queryAll('SELECT * FROM products WHERE company_id=? AND quantity <= 10 ORDER BY quantity ASC LIMIT 5', [c]);
  const recentOrders = queryAll('SELECT * FROM orders WHERE company_id=? ORDER BY last_updated DESC LIMIT 5', [c])
    .map((o: any) => ({ ...o, products: JSON.parse(o.products || '[]') }));
  res.json({ totalProducts, totalInventoryValue, pendingSales, pendingPurchases, wipBatches, lowStock, recentOrders });
});

export default router;
