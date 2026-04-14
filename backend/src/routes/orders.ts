import { Router, Response } from 'express';
import { runSQL, queryAll, queryOne } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const SALE_STATUSES = ['quotation', 'packing', 'dispatched', 'completed'];
const PURCHASE_STATUSES = ['quotation_received', 'unpaid', 'paid', 'completed'];

router.get('/', (req: AuthRequest, res: Response) => {
  const { type, status, search } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];
  if (type) { sql += ' AND type=?'; params.push(type); }
  if (status) { sql += ' AND status=?'; params.push(status); }
  if (search) { sql += ' AND (order_id LIKE ? OR party_name LIKE ? OR party_id LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
  sql += ' ORDER BY last_updated DESC';
  const rows = queryAll(sql, params);
  res.json(rows.map((o: any) => ({ ...o, products: JSON.parse(o.products || '[]') })));
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const o = queryOne('SELECT * FROM orders WHERE order_id=?', [req.params.id]);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...o, products: JSON.parse(o.products || '[]') });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { type, party_id, party_name, products, notes } = req.body;
  if (!type || !products || !Array.isArray(products)) return res.status(400).json({ error: 'type and products array required' });
  const total = products.reduce((s: number, p: any) => s + (p.price * p.quantity), 0);
  const order_id = `${type === 'sale' ? 'SO' : 'PO'}-${Date.now().toString(36).toUpperCase()}`;
  const status = type === 'sale' ? 'quotation' : 'quotation_received';
  runSQL(`INSERT INTO orders (order_id,type,party_id,party_name,products,status,notes,total_amount,date,last_updated) VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
    [order_id, type, party_id || '', party_name || '', JSON.stringify(products), status, notes || '', total]);
  const o = queryOne('SELECT * FROM orders WHERE order_id=?', [order_id]);
  res.status(201).json({ ...o, products: JSON.parse(o.products) });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const existing = queryOne('SELECT * FROM orders WHERE order_id=?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Order not found' });
  const { party_id, party_name, products, notes } = req.body;
  const updatedProducts = products || JSON.parse(existing.products);
  const total = updatedProducts.reduce((s: number, p: any) => s + (p.price * p.quantity), 0);
  runSQL(`UPDATE orders SET party_id=?,party_name=?,products=?,notes=?,total_amount=?,last_updated=datetime('now') WHERE order_id=?`,
    [party_id ?? existing.party_id, party_name ?? existing.party_name, JSON.stringify(updatedProducts), notes ?? existing.notes, total, req.params.id]);
  const o = queryOne('SELECT * FROM orders WHERE order_id=?', [req.params.id]);
  res.json({ ...o, products: JSON.parse(o.products) });
});

router.patch('/:id/status', (req: AuthRequest, res: Response) => {
  const order = queryOne('SELECT * FROM orders WHERE order_id=?', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const products = JSON.parse(order.products || '[]');
  const statuses = order.type === 'sale' ? SALE_STATUSES : PURCHASE_STATUSES;
  const currentIdx = statuses.indexOf(order.status);
  const newStatus = req.body.status || statuses[Math.min(currentIdx + 1, statuses.length - 1)];

  try {
    // Inventory update on dispatch (sale) or completion (purchase)
    if (order.type === 'sale' && newStatus === 'dispatched' && order.status !== 'dispatched') {
      for (const p of products) {
        runSQL(`UPDATE products SET quantity=quantity-?,last_updated=datetime('now') WHERE product_code=?`, [p.quantity, p.product_code]);
      }
    }
    if (order.type === 'purchase' && newStatus === 'completed' && order.status !== 'completed') {
      for (const p of products) {
        runSQL(`UPDATE products SET quantity=quantity+?,last_updated=datetime('now') WHERE product_code=?`, [p.quantity, p.product_code]);
      }
    }
    runSQL(`UPDATE orders SET status=?,last_updated=datetime('now') WHERE order_id=?`, [newStatus, req.params.id]);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  const o = queryOne('SELECT * FROM orders WHERE order_id=?', [req.params.id]);
  res.json({ ...o, products: JSON.parse(o.products) });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (!queryOne('SELECT order_id FROM orders WHERE order_id=?', [req.params.id])) return res.status(404).json({ error: 'Not found' });
  runSQL('DELETE FROM orders WHERE order_id=?', [req.params.id]);
  res.json({ success: true });
});

export default router;
