import { Router, Response } from 'express';
import { runSQL, queryAll, queryOne } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM products';
  const params: any[] = [];
  if (search) {
    sql += ' WHERE name LIKE ? OR product_code LIKE ? OR description LIKE ?';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  sql += ' ORDER BY name ASC';
  res.json(queryAll(sql, params));
});

router.get('/:code', (req: AuthRequest, res: Response) => {
  const p = queryOne('SELECT * FROM products WHERE product_code = ?', [req.params.code]);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { product_code, name, description, weight, price, quantity } = req.body;
  if (!product_code || !name || price === undefined) return res.status(400).json({ error: 'product_code, name, and price are required' });
  if (queryOne('SELECT product_code FROM products WHERE product_code=?', [product_code])) return res.status(409).json({ error: 'Product code already exists' });
  runSQL(`INSERT INTO products (product_code,name,description,weight,price,quantity,last_updated) VALUES (?,?,?,?,?,?,datetime('now'))`,
    [product_code, name, description || '', weight || 0, price, quantity || 0]);
  res.status(201).json(queryOne('SELECT * FROM products WHERE product_code=?', [product_code]));
});

router.put('/:code', (req: AuthRequest, res: Response) => {
  const existing = queryOne('SELECT * FROM products WHERE product_code=?', [req.params.code]);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const { name, description, weight, price, quantity } = req.body;
  runSQL(`UPDATE products SET name=?,description=?,weight=?,price=?,quantity=?,last_updated=datetime('now') WHERE product_code=?`,
    [name ?? existing.name, description ?? existing.description, weight ?? existing.weight, price ?? existing.price, quantity ?? existing.quantity, req.params.code]);
  res.json(queryOne('SELECT * FROM products WHERE product_code=?', [req.params.code]));
});

router.delete('/:code', (req: AuthRequest, res: Response) => {
  if (!queryOne('SELECT product_code FROM products WHERE product_code=?', [req.params.code])) return res.status(404).json({ error: 'Not found' });
  runSQL('DELETE FROM products WHERE product_code=?', [req.params.code]);
  res.json({ success: true });
});

export default router;
