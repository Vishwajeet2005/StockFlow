import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Package, Edit2, Trash2, X, Save } from 'lucide-react';
import api, { Product, fmt } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import ConfirmDialog from '../components/layout/ConfirmDialog';

const empty: Omit<Product, 'last_updated'> = {
  product_code: '', name: '', description: '', weight: 0, price: 0, quantity: 0
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search: search || undefined } });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSelect = (p: Product) => {
    setSelected(p); setEditing(false); setShowAdd(false);
    setForm({ product_code: p.product_code, name: p.name, description: p.description, weight: p.weight, price: p.price, quantity: p.quantity });
  };

  const handleAdd = () => {
    setShowAdd(true); setSelected(null); setEditing(false);
    setForm(empty);
  };

  const handleSaveNew = async () => {
    if (!form.product_code || !form.name) return toast.error('Product code and name are required');
    setSaving(true);
    try {
      const { data } = await api.post('/products', form);
      setProducts(prev => [...prev, data]);
      setSelected(data); setShowAdd(false);
      toast.success('Product added');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to add product');
    } finally { setSaving(false); }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/products/${selected.product_code}`, form);
      setProducts(prev => prev.map(p => p.product_code === data.product_code ? data : p));
      setSelected(data); setEditing(false);
      toast.success('Product updated');
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/products/${selected.product_code}`);
      setProducts(prev => prev.filter(p => p.product_code !== selected.product_code));
      setSelected(null); setConfirmDelete(false);
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="label">{label}</label>{children}</div>
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Products"
        subtitle={`${products.length} items`}
        actions={<button className="btn btn-primary btn-sm" onClick={handleAdd}><Plus size={15} /> Add Product</button>}
      />

      <div className="list-detail flex-1">
        {/* List panel */}
        <div className="list-panel flex flex-col">
          <div className="p-3 border-b border-surface-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input className="input pl-8 text-sm" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-ink-300">Loading…</div>
            ) : products.length === 0 ? (
              <div className="empty-state"><Package size={28} /><p>No products found</p></div>
            ) : products.map(p => (
              <div key={p.product_code} className={`list-item ${selected?.product_code === p.product_code ? 'selected' : ''}`} onClick={() => handleSelect(p)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{p.name}</div>
                    <div className="text-xs text-ink-400 font-mono mt-0.5">{p.product_code}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-ink-900">{fmt.currency(p.price)}</div>
                    <div className={`text-xs mt-0.5 font-medium ${p.quantity <= 10 ? 'text-red-500' : 'text-ink-400'}`}>{fmt.qty(p.quantity)} units</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="detail-panel">
          {showAdd ? (
            <div className="p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-ink-900">New Product</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}><X size={15} /></button>
              </div>
              <div className="card p-5 space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Product Code *"><input className="input" placeholder="PRD006" value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value.toUpperCase() }))} /></Field>
                  <Field label="Name *"><input className="input" placeholder="Product name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                </div>
                <Field label="Description"><textarea className="input" rows={2} placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Weight (kg)"><input className="input" type="number" step="0.01" min="0" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 0 }))} /></Field>
                  <Field label="Price (₹) *"><input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></Field>
                  <Field label="Quantity"><input className="input" type="number" step="0.01" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} /></Field>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="btn btn-primary btn-sm" onClick={handleSaveNew} disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save Product'}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
                </div>
              </div>
            </div>
          ) : selected ? (
            <div className="p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-ink-900">{selected.name}</h2>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selected.product_code}</p>
                </div>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving}><Save size={14} />{saving ? 'Saving…' : 'Save'}</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setForm({ product_code: selected.product_code, name: selected.name, description: selected.description, weight: selected.weight, price: selected.price, quantity: selected.quantity }); }}><X size={14} />Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit2 size={14} />Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}><Trash2 size={14} />Delete</button>
                    </>
                  )}
                </div>
              </div>

              <div className="card p-5 max-w-lg space-y-4">
                {editing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Product Code"><input className="input" value={form.product_code} disabled /></Field>
                      <Field label="Name *"><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                    </div>
                    <Field label="Description"><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Weight (kg)"><input className="input" type="number" step="0.01" min="0" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 0 }))} /></Field>
                      <Field label="Price (₹)"><input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></Field>
                      <Field label="Quantity"><input className="input" type="number" step="0.01" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} /></Field>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <div><div className="text-ink-400 text-xs mb-0.5">Product Code</div><div className="font-mono font-medium text-ink-900">{selected.product_code}</div></div>
                      <div><div className="text-ink-400 text-xs mb-0.5">Name</div><div className="font-medium text-ink-900">{selected.name}</div></div>
                      <div><div className="text-ink-400 text-xs mb-0.5">Price</div><div className="font-semibold text-ink-900 text-base">{fmt.currency(selected.price)}</div></div>
                      <div><div className="text-ink-400 text-xs mb-0.5">Stock</div><div className={`font-semibold text-base ${selected.quantity <= 10 ? 'text-red-600' : 'text-ink-900'}`}>{fmt.qty(selected.quantity)} units</div></div>
                      <div><div className="text-ink-400 text-xs mb-0.5">Weight</div><div className="text-ink-900">{selected.weight} kg</div></div>
                      <div><div className="text-ink-400 text-xs mb-0.5">Last Updated</div><div className="text-ink-900">{fmt.datetime(selected.last_updated)}</div></div>
                    </div>
                    {selected.description && (
                      <div className="border-t border-surface-2 pt-4">
                        <div className="text-ink-400 text-xs mb-1">Description</div>
                        <p className="text-sm text-ink-700">{selected.description}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state h-full">
              <Package size={36} />
              <h3 className="text-sm font-medium text-ink-500 mt-2">Select a product</h3>
              <p>Click a product from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Product"
          message={`Are you sure you want to delete "${selected?.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
