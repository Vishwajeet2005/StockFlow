import { Router, Response } from 'express';
import { runSQL, queryAll, queryOne } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── Customers ───────────────────────────────────────────────────────────────
router.get('/customers', (_: AuthRequest, res: Response) => res.json(queryAll('SELECT * FROM customers ORDER BY name')));
router.get('/customers/:id', (req: AuthRequest, res: Response) => {
  const c = queryOne('SELECT * FROM customers WHERE customer_id=?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});
router.post('/customers', (req: AuthRequest, res: Response) => {
  const { customer_id, name, email, phone, address } = req.body;
  if (!customer_id || !name) return res.status(400).json({ error: 'customer_id and name required' });
  if (queryOne('SELECT customer_id FROM customers WHERE customer_id=?', [customer_id])) return res.status(409).json({ error: 'Customer ID already exists' });
  runSQL('INSERT INTO customers (customer_id,name,email,phone,address) VALUES (?,?,?,?,?)', [customer_id, name, email||'', phone||'', address||'']);
  res.status(201).json(queryOne('SELECT * FROM customers WHERE customer_id=?', [customer_id]));
});
router.put('/customers/:id', (req: AuthRequest, res: Response) => {
  const existing = queryOne('SELECT * FROM customers WHERE customer_id=?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, email, phone, address } = req.body;
  runSQL('UPDATE customers SET name=?,email=?,phone=?,address=? WHERE customer_id=?',
    [name??existing.name, email??existing.email, phone??existing.phone, address??existing.address, req.params.id]);
  res.json(queryOne('SELECT * FROM customers WHERE customer_id=?', [req.params.id]));
});
router.delete('/customers/:id', (req: AuthRequest, res: Response) => {
  runSQL('DELETE FROM customers WHERE customer_id=?', [req.params.id]);
  res.json({ success: true });
});

// ─── Suppliers ───────────────────────────────────────────────────────────────
router.get('/suppliers', (_: AuthRequest, res: Response) => res.json(queryAll('SELECT * FROM suppliers ORDER BY name')));
router.get('/suppliers/:id', (req: AuthRequest, res: Response) => {
  const s = queryOne('SELECT * FROM suppliers WHERE supplier_id=?', [req.params.id]);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});
router.post('/suppliers', (req: AuthRequest, res: Response) => {
  const { supplier_id, name, email, phone, address } = req.body;
  if (!supplier_id || !name) return res.status(400).json({ error: 'supplier_id and name required' });
  if (queryOne('SELECT supplier_id FROM suppliers WHERE supplier_id=?', [supplier_id])) return res.status(409).json({ error: 'Supplier ID already exists' });
  runSQL('INSERT INTO suppliers (supplier_id,name,email,phone,address) VALUES (?,?,?,?,?)', [supplier_id, name, email||'', phone||'', address||'']);
  res.status(201).json(queryOne('SELECT * FROM suppliers WHERE supplier_id=?', [supplier_id]));
});
router.put('/suppliers/:id', (req: AuthRequest, res: Response) => {
  const existing = queryOne('SELECT * FROM suppliers WHERE supplier_id=?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, email, phone, address } = req.body;
  runSQL('UPDATE suppliers SET name=?,email=?,phone=?,address=? WHERE supplier_id=?',
    [name??existing.name, email??existing.email, phone??existing.phone, address??existing.address, req.params.id]);
  res.json(queryOne('SELECT * FROM suppliers WHERE supplier_id=?', [req.params.id]));
});
router.delete('/suppliers/:id', (req: AuthRequest, res: Response) => {
  runSQL('DELETE FROM suppliers WHERE supplier_id=?', [req.params.id]);
  res.json({ success: true });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get('/dashboard', (_: AuthRequest, res: Response) => {
  const totalProducts = (queryOne('SELECT COUNT(*) as c FROM products') as any)?.c || 0;
  const totalInventoryValue = (queryOne('SELECT SUM(price*quantity) as v FROM products') as any)?.v || 0;
  const pendingSales = (queryOne("SELECT COUNT(*) as c FROM orders WHERE type='sale' AND status NOT IN ('completed')") as any)?.c || 0;
  const pendingPurchases = (queryOne("SELECT COUNT(*) as c FROM orders WHERE type='purchase' AND status NOT IN ('completed')") as any)?.c || 0;
  const wipBatches = (queryOne("SELECT COUNT(*) as c FROM manufacturing WHERE status='in_progress'") as any)?.c || 0;
  const lowStock = queryAll('SELECT * FROM products WHERE quantity <= 10 ORDER BY quantity ASC LIMIT 5');
  const recentOrders = queryAll('SELECT * FROM orders ORDER BY last_updated DESC LIMIT 5')
    .map((o: any) => ({ ...o, products: JSON.parse(o.products || '[]') }));
  res.json({ totalProducts, totalInventoryValue, pendingSales, pendingPurchases, wipBatches, lowStock, recentOrders });
});

export default router;
