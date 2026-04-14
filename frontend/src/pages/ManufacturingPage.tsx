import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Wrench, CheckCircle, Trash2, X } from 'lucide-react';
import api, { ManufacturingBatch, Product, fmt, statusBadge, statusLabel } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import ConfirmDialog from '../components/layout/ConfirmDialog';

interface MaterialLine { product_code: string; name: string; quantity: number; }

function BatchForm({ onSave, onClose }: { onSave: (b: ManufacturingBatch) => void; onClose: () => void }) {
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [rawMaterials, setRawMaterials] = useState<MaterialLine[]>([{ product_code: '', name: '', quantity: 1 }]);
  const [output, setOutput] = useState<MaterialLine[]>([{ product_code: '', name: '', quantity: 1 }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/products').then(r => setProducts(r.data)); }, []);

  const updateLine = (arr: MaterialLine[], setArr: any, idx: number, field: string, val: string | number) => {
    const next = [...arr];
    next[idx] = { ...next[idx], [field]: val };
    if (field === 'product_code') {
      const p = products.find(p => p.product_code === val);
      if (p) next[idx].name = p.name;
    }
    setArr(next);
  };

  const removeLine = (arr: MaterialLine[], setArr: any, idx: number) => setArr(arr.filter((_, i) => i !== idx));
  const addLine = (arr: MaterialLine[], setArr: any) => setArr([...arr, { product_code: '', name: '', quantity: 1 }]);

  const MaterialTable = ({ title, lines, setLines }: { title: string; lines: MaterialLine[]; setLines: any }) => (
    <div>
      <label className="label">{title}</label>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Product</th><th>Name</th><th style={{ width: 100 }}>Quantity</th><th style={{ width: 40 }}></th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>
                  <input className="input text-sm" placeholder="Product code" value={l.product_code}
                    onChange={e => updateLine(lines, setLines, i, 'product_code', e.target.value.toUpperCase())}
                    list={`prod-list-${title}-${i}`} />
                  <datalist id={`prod-list-${title}-${i}`}>
                    {products.map(p => <option key={p.product_code} value={p.product_code}>{p.name}</option>)}
                  </datalist>
                </td>
                <td><input className="input text-sm" placeholder="Auto-filled" value={l.name} onChange={e => updateLine(lines, setLines, i, 'name', e.target.value)} /></td>
                <td><input className="input text-sm" type="number" min="0.01" step="0.01" value={l.quantity} onChange={e => updateLine(lines, setLines, i, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                <td><button className="btn btn-ghost btn-sm p-1 h-auto text-ink-300 hover:text-red-500" onClick={() => removeLine(lines, setLines, i)} disabled={lines.length === 1}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-surface-2">
          <button className="btn btn-ghost btn-sm text-brand-500" onClick={() => addLine(lines, setLines)}><Plus size={13} />Add Row</button>
        </div>
      </div>
    </div>
  );

  const handleSubmit = async () => {
    if (!batchNumber) return toast.error('Batch number is required');
    const validRM = rawMaterials.filter(l => l.product_code && l.quantity > 0);
    const validOut = output.filter(l => l.product_code && l.quantity > 0);
    if (validRM.length === 0) return toast.error('Add at least one raw material');
    if (validOut.length === 0) return toast.error('Add at least one output product');
    setSaving(true);
    try {
      const { data } = await api.post('/manufacturing', { batch_number: batchNumber, raw_materials: validRM, output: validOut, notes });
      onSave(data);
      toast.success('Manufacturing batch created');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create batch');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <h2 className="font-semibold text-ink-900">New Manufacturing Batch</h2>
          <button className="btn btn-ghost btn-sm p-1.5 h-auto" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Batch Number *</label><input className="input" placeholder="BATCH-001" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} /></div>
            <div><label className="label">Notes</label><input className="input" placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <MaterialTable title="Raw Materials (consumed from inventory)" lines={rawMaterials} setLines={setRawMaterials} />
          <MaterialTable title="Expected Output (added to inventory on completion)" lines={output} setLines={setOutput} />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Start Batch'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ManufacturingPage() {
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [selected, setSelected] = useState<ManufacturingBatch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/manufacturing'); setBatches(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async () => {
    if (!selected) return;
    try {
      const { data } = await api.patch(`/manufacturing/${selected.batch_id}/complete`, {});
      setBatches(prev => prev.map(b => b.batch_id === data.batch_id ? data : b));
      setSelected(data); setConfirmComplete(false);
      toast.success('Batch completed — output added to inventory');
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleCancel = async () => {
    if (!selected) return;
    try {
      await api.delete(`/manufacturing/${selected.batch_id}`);
      setBatches(prev => prev.map(b => b.batch_id === selected.batch_id ? { ...b, status: 'cancelled' } : b));
      setSelected(prev => prev ? { ...prev, status: 'cancelled' } : null);
      setConfirmCancel(false);
      toast.success('Batch cancelled');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Manufacturing (WIP)"
        subtitle={`${batches.filter(b => b.status === 'in_progress').length} active batches`}
        actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={15} />New Batch</button>}
      />
      <div className="list-detail flex-1">
        <div className="list-panel flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4 text-center text-sm text-ink-300">Loading…</div>
              : batches.length === 0 ? <div className="empty-state"><Wrench size={28} /><p>No batches yet</p></div>
              : batches.map(b => (
                <div key={b.batch_id} className={`list-item ${selected?.batch_id === b.batch_id ? 'selected' : ''}`} onClick={() => setSelected(b)}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-ink-900 font-mono">{b.batch_number}</span>
                    <span className={`badge ${statusBadge[b.status] || 'badge-gray'}`}>{statusLabel[b.status] || b.status}</span>
                  </div>
                  <div className="text-xs text-ink-400">{b.raw_materials.length} inputs · {b.output.length} outputs</div>
                  <div className="text-xs text-ink-400 mt-0.5">{fmt.date(b.start_date)}</div>
                </div>
              ))}
          </div>
        </div>
        <div className="detail-panel">
          {selected ? (
            <div className="p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-ink-900 font-mono">{selected.batch_number}</h2>
                  <p className="text-sm text-ink-400 mt-0.5">Started {fmt.datetime(selected.start_date)}</p>
                </div>
                {selected.status === 'in_progress' && (
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={() => setConfirmComplete(true)}><CheckCircle size={14} />Mark Complete</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmCancel(true)}><X size={14} />Cancel</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="card p-4">
                  <div className="text-xs text-ink-400 mb-2 font-semibold uppercase tracking-wide">Batch Info</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-ink-500">Status</span><span className={`badge ${statusBadge[selected.status]}`}>{statusLabel[selected.status]}</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">Start Date</span><span className="text-ink-900">{fmt.date(selected.start_date)}</span></div>
                    {selected.end_date && <div className="flex justify-between"><span className="text-ink-500">End Date</span><span className="text-ink-900">{fmt.date(selected.end_date)}</span></div>}
                    {selected.notes && <div className="flex justify-between"><span className="text-ink-500">Notes</span><span className="text-ink-700 text-right">{selected.notes}</span></div>}
                  </div>
                </div>
                <div className="card p-4 flex items-center justify-center flex-col gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selected.status === 'in_progress' ? 'bg-orange-100' : selected.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Wrench size={22} className={selected.status === 'in_progress' ? 'text-orange-600' : selected.status === 'completed' ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <div className="text-sm font-semibold text-ink-900">{selected.raw_materials.length} → {selected.output.length}</div>
                  <div className="text-xs text-ink-400">Input materials → Output products</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-2"><span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Raw Materials (Input)</span></div>
                  <table className="data-table">
                    <thead><tr><th>Code</th><th>Name</th><th className="text-right">Qty</th></tr></thead>
                    <tbody>
                      {selected.raw_materials.map((m, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs">{m.product_code}</td>
                          <td className="text-ink-900">{m.name}</td>
                          <td className="text-right">{fmt.qty(m.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-2"><span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Expected Output</span></div>
                  <table className="data-table">
                    <thead><tr><th>Code</th><th>Name</th><th className="text-right">Qty</th></tr></thead>
                    <tbody>
                      {selected.output.map((m, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs">{m.product_code}</td>
                          <td className="text-ink-900">{m.name}</td>
                          <td className="text-right">{fmt.qty(m.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state h-full"><Wrench size={36} /><h3 className="text-sm font-medium text-ink-500 mt-2">Select a batch</h3><p>Click a batch to view details</p></div>
          )}
        </div>
      </div>

      {showForm && <BatchForm onSave={b => { setBatches(prev => [b, ...prev]); setSelected(b); setShowForm(false); }} onClose={() => setShowForm(false)} />}
      {confirmComplete && <ConfirmDialog title="Complete Batch" message="Mark this batch as complete? Output products will be added to inventory." confirmLabel="Complete" onConfirm={handleComplete} onCancel={() => setConfirmComplete(false)} />}
      {confirmCancel && <ConfirmDialog title="Cancel Batch" message="Cancel this batch? This action cannot be undone." confirmLabel="Cancel Batch" danger onConfirm={handleCancel} onCancel={() => setConfirmCancel(false)} />}
    </div>
  );
}
