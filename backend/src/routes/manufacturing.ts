import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runSQL, queryAll, queryOne } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const parse = (b: any) => ({ ...b, raw_materials: JSON.parse(b.raw_materials || '[]'), output: JSON.parse(b.output || '[]') });

router.get('/', (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM manufacturing WHERE 1=1';
  const params: any[] = [];
  if (status) { sql += ' AND status=?'; params.push(status); }
  sql += ' ORDER BY start_date DESC';
  res.json(queryAll(sql, params).map(parse));
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const b = queryOne('SELECT * FROM manufacturing WHERE batch_id=?', [req.params.id]);
  if (!b) return res.status(404).json({ error: 'Batch not found' });
  res.json(parse(b));
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { batch_number, raw_materials, output, notes } = req.body;
  if (!batch_number || !raw_materials || !output) return res.status(400).json({ error: 'batch_number, raw_materials, and output required' });

  const batch_id = uuidv4();
  try {
    for (const rm of raw_materials) {
      const product = queryOne('SELECT quantity FROM products WHERE product_code=?', [rm.product_code]);
      if (product && product.quantity < rm.quantity) throw new Error(`Insufficient stock for ${rm.product_code} (available: ${product.quantity})`);
      if (!product) throw new Error(`Product ${rm.product_code} not found`);
      runSQL(`UPDATE products SET quantity=quantity-?,last_updated=datetime('now') WHERE product_code=?`, [rm.quantity, rm.product_code]);
    }
    runSQL(`INSERT INTO manufacturing (batch_id,batch_number,raw_materials,output,status,notes,start_date,last_updated) VALUES (?,?,?,?,'in_progress',?,datetime('now'),datetime('now'))`,
      [batch_id, batch_number, JSON.stringify(raw_materials), JSON.stringify(output), notes || '']);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }

  const b = queryOne('SELECT * FROM manufacturing WHERE batch_id=?', [batch_id]);
  res.status(201).json(parse(b));
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const existing = queryOne('SELECT * FROM manufacturing WHERE batch_id=?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Batch not found' });
  const { batch_number, notes } = req.body;
  runSQL(`UPDATE manufacturing SET batch_number=?,notes=?,last_updated=datetime('now') WHERE batch_id=?`,
    [batch_number ?? existing.batch_number, notes ?? existing.notes, req.params.id]);
  res.json(parse(queryOne('SELECT * FROM manufacturing WHERE batch_id=?', [req.params.id])));
});

router.patch('/:id/complete', (req: AuthRequest, res: Response) => {
  const batch = queryOne('SELECT * FROM manufacturing WHERE batch_id=?', [req.params.id]);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  if (batch.status === 'completed') return res.status(400).json({ error: 'Already completed' });

  const output = JSON.parse(batch.output || '[]');
  try {
    for (const op of output) {
      runSQL(`UPDATE products SET quantity=quantity+?,last_updated=datetime('now') WHERE product_code=?`, [op.quantity, op.product_code]);
    }
    runSQL(`UPDATE manufacturing SET status='completed',end_date=datetime('now'),last_updated=datetime('now') WHERE batch_id=?`, [req.params.id]);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  res.json(parse(queryOne('SELECT * FROM manufacturing WHERE batch_id=?', [req.params.id])));
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (!queryOne('SELECT batch_id FROM manufacturing WHERE batch_id=?', [req.params.id])) return res.status(404).json({ error: 'Not found' });
  runSQL(`UPDATE manufacturing SET status='cancelled',last_updated=datetime('now') WHERE batch_id=?`, [req.params.id]);
  res.json({ success: true });
});

export default router;
