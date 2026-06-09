import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const parse = (b: any) => ({
  ...b,
  company_id: b.companyId,
  batch_id: b.batchId,
  batch_number: b.batchNumber,
  start_date: b.startDate,
  end_date: b.endDate,
  last_updated: b.lastUpdated,
  raw_materials: JSON.parse(b.rawMaterials || '[]'),
  output: JSON.parse(b.output || '[]')
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    
    let whereClause: any = { companyId: req.user!.company_id };
    if (status && typeof status === 'string') whereClause.status = status;
    
    const batches = await prisma.manufacturingBatch.findMany({
      where: whereClause,
      orderBy: { startDate: 'desc' }
    });
    
    res.json(batches.map(parse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const b = await prisma.manufacturingBatch.findUnique({
      where: {
        companyId_batchId: {
          companyId: req.user!.company_id,
          batchId: req.params.id
        }
      }
    });
    
    if (!b) return res.status(404).json({ error: 'Batch not found' });
    
    res.json(parse(b));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { batch_number, raw_materials, output, notes } = req.body;
    if (!batch_number || !raw_materials || !output) return res.status(400).json({ error: 'batch_number, raw_materials, and output required' });

    const batch_id = uuidv4();
    
    await prisma.$transaction(async (tx) => {
      // Deduct raw materials
      for (const rm of raw_materials) {
        const product = await tx.product.findUnique({
          where: {
            companyId_productCode: { companyId: req.user!.company_id, productCode: rm.product_code }
          }
        });
        
        if (!product) throw new Error(`Product ${rm.product_code} not found`);
        if (product.quantity < rm.quantity) throw new Error(`Insufficient stock for ${rm.product_code} (available: ${product.quantity})`);
        
        await tx.product.update({
          where: {
            companyId_productCode: { companyId: req.user!.company_id, productCode: rm.product_code }
          },
          data: {
            quantity: { decrement: rm.quantity },
            lastUpdated: new Date()
          }
        });
      }
      
      // Create batch
      await tx.manufacturingBatch.create({
        data: {
          companyId: req.user!.company_id,
          batchId: batch_id,
          batchNumber: batch_number,
          rawMaterials: JSON.stringify(raw_materials),
          output: JSON.stringify(output),
          status: 'in_progress',
          notes: notes || '',
        }
      });
    });

    const b = await prisma.manufacturingBatch.findUnique({
      where: {
        companyId_batchId: { companyId: req.user!.company_id, batchId: batch_id }
      }
    });
    
    res.status(201).json(parse(b));
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.manufacturingBatch.findUnique({
      where: {
        companyId_batchId: { companyId: req.user!.company_id, batchId: req.params.id }
      }
    });
    
    if (!existing) return res.status(404).json({ error: 'Batch not found' });
    
    const { batch_number, notes } = req.body;
    
    const b = await prisma.manufacturingBatch.update({
      where: {
        companyId_batchId: { companyId: req.user!.company_id, batchId: req.params.id }
      },
      data: {
        batchNumber: batch_number ?? existing.batchNumber,
        notes: notes ?? existing.notes,
        lastUpdated: new Date()
      }
    });
    
    res.json(parse(b));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const batch = await prisma.manufacturingBatch.findUnique({
      where: {
        companyId_batchId: { companyId: req.user!.company_id, batchId: req.params.id }
      }
    });
    
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    if (batch.status === 'completed') return res.status(400).json({ error: 'Already completed' });

    const output = JSON.parse(batch.output || '[]');
    
    await prisma.$transaction(async (tx) => {
      // Add outputs to inventory
      for (const op of output) {
        // In real world, we might upsert if product doesn't exist
        await tx.product.update({
          where: {
            companyId_productCode: { companyId: req.user!.company_id, productCode: op.product_code }
          },
          data: {
            quantity: { increment: op.quantity },
            lastUpdated: new Date()
          }
        });
      }
      
      // Update batch
      await tx.manufacturingBatch.update({
        where: {
          companyId_batchId: { companyId: req.user!.company_id, batchId: req.params.id }
        },
        data: {
          status: 'completed',
          endDate: new Date(),
          lastUpdated: new Date()
        }
      });
    });

    const b = await prisma.manufacturingBatch.findUnique({
      where: {
        companyId_batchId: { companyId: req.user!.company_id, batchId: req.params.id }
      }
    });
    
    res.json(parse(b));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.manufacturingBatch.findUnique({
      where: {
        companyId_batchId: { companyId: req.user!.company_id, batchId: req.params.id }
      }
    });
    
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    await prisma.manufacturingBatch.update({
      where: {
        companyId_batchId: { companyId: req.user!.company_id, batchId: req.params.id }
      },
      data: {
        status: 'cancelled',
        lastUpdated: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
