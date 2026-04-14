import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, Building, Trash2, X, Save } from 'lucide-react';
import api, { Customer, Supplier, fmt } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import ConfirmDialog from '../components/layout/ConfirmDialog';

type Tab = 'customers' | 'suppliers';

function PartyForm({ type, onSave, onClose }: { type: Tab; onSave: (p: any) => void; onClose: () => void }) {
  const isCustomer = type === 'customers';
  const [form, setForm] = useState({ id: '', name: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.id || !form.name) return toast.error('ID and name are required');
    setSaving(true);
    try {
      const payload = isCustomer
        ? { customer_id: form.id, name: form.name, email: form.email, phone: form.phone, address: form.address }
        : { supplier_id: form.id, name: form.name, email: form.email, phone: form.phone, address: form.address };
      const endpoint = isCustomer ? '/customers' : '/suppliers';
      const { data } = await api.post(endpoint, payload);
      onSave(data);
      toast.success(`${isCustomer ? 'Customer' : 'Supplier'} added`);
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <h2 className="font-semibold text-ink-900">New {isCustomer ? 'Customer' : 'Supplier'}</h2>
          <button className="btn btn-ghost btn-sm p-1.5 h-auto" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">{isCustomer ? 'Customer' : 'Supplier'} ID *</label><input className="input" placeholder={isCustomer ? 'CUST004' : 'SUPP003'} value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toUpperCase() }))} /></div>
            <div><label className="label">Name *</label><input className="input" placeholder="Company name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          </div>
          <div><label className="label">Email</label><input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div><label className="label">Phone</label><input className="input" placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><label className="label">Address</label><textarea className="input" rows={2} placeholder="City, State" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}><Save size={14} />{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function PartiesPage() {
  const [tab, setTab] = useState<Tab>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/customers'), api.get('/suppliers')])
      .then(([c, s]) => { setCustomers(c.data); setSuppliers(s.data); })
      .finally(() => setLoading(false));
  }, []);

  const list = tab === 'customers' ? customers : suppliers;

  const handleDelete = async () => {
    if (!selected) return;
    const id = selected.customer_id || selected.supplier_id;
    try {
      await api.delete(`/${tab === 'customers' ? 'customers' : 'suppliers'}/${id}`);
      if (tab === 'customers') setCustomers(prev => prev.filter(c => c.customer_id !== id));
      else setSuppliers(prev => prev.filter(s => s.supplier_id !== id));
      setSelected(null); setConfirmDelete(false);
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Customers & Suppliers"
        subtitle={`${customers.length} customers · ${suppliers.length} suppliers`}
        actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={15} />Add {tab === 'customers' ? 'Customer' : 'Supplier'}</button>}
      />

      {/* Tab bar */}
      <div className="px-6 py-3 border-b border-surface-3 bg-white flex gap-1">
        {(['customers', 'suppliers'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setSelected(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-brand-50 text-brand-600' : 'text-ink-400 hover:text-ink-700'}`}>
            {t === 'customers' ? <Users size={14} /> : <Building size={14} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="list-detail flex-1">
        <div className="list-panel flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4 text-center text-sm text-ink-300">Loading…</div>
              : list.length === 0 ? <div className="empty-state"><Users size={28} /><p>No {tab} yet</p></div>
              : list.map((p: any) => {
                const id = p.customer_id || p.supplier_id;
                return (
                  <div key={id} className={`list-item ${selected && (selected.customer_id || selected.supplier_id) === id ? 'selected' : ''}`} onClick={() => setSelected(p)}>
                    <div className="text-sm font-medium text-ink-900">{p.name}</div>
                    <div className="text-xs text-ink-400 font-mono mt-0.5">{id}</div>
                    {p.phone && <div className="text-xs text-ink-400 mt-0.5">{p.phone}</div>}
                  </div>
                );
              })}
          </div>
        </div>

        <div className="detail-panel">
          {selected ? (
            <div className="p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-ink-900">{selected.name}</h2>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selected.customer_id || selected.supplier_id}</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}><Trash2 size={14} />Delete</button>
              </div>
              <div className="card p-5 max-w-md space-y-3 text-sm">
                {[
                  ['ID', selected.customer_id || selected.supplier_id, true],
                  ['Name', selected.name, false],
                  ['Email', selected.email || '—', false],
                  ['Phone', selected.phone || '—', false],
                  ['Address', selected.address || '—', false],
                  ['Added', fmt.date(selected.created_at), false],
                ].map(([label, val, mono]) => (
                  <div key={label as string} className="flex justify-between border-b border-surface-2 pb-3 last:border-0 last:pb-0">
                    <span className="text-ink-400">{label}</span>
                    <span className={`text-ink-900 font-medium ${mono ? 'font-mono text-xs' : ''}`}>{val as string}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state h-full"><Users size={36} /><h3 className="text-sm font-medium text-ink-500 mt-2">Select a record</h3><p>Click from the list to view details</p></div>
          )}
        </div>
      </div>

      {showForm && <PartyForm type={tab} onSave={p => { if (tab === 'customers') setCustomers(prev => [...prev, p]); else setSuppliers(prev => [...prev, p]); setShowForm(false); }} onClose={() => setShowForm(false)} />}
      {confirmDelete && <ConfirmDialog title={`Delete ${tab === 'customers' ? 'Customer' : 'Supplier'}`} message={`Delete "${selected?.name}"?`} confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />}
    </div>
  );
}
