import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Truck, Trash2, ArrowRight } from 'lucide-react';
import api, { Order, fmt, statusLabel, statusBadge, purchaseStatuses } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import OrderForm from '../components/modules/OrderForm';
import ConfirmDialog from '../components/layout/ConfirmDialog';

export default function PurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', { params: { type: 'purchase', search: search || undefined } });
      setOrders(data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleAdvance = async (order: Order) => {
    const idx = purchaseStatuses.indexOf(order.status);
    if (idx >= purchaseStatuses.length - 1) return toast('Order is already completed');
    try {
      const { data } = await api.patch(`/orders/${order.order_id}/status`, {});
      setOrders(prev => prev.map(o => o.order_id === data.order_id ? data : o));
      if (selected?.order_id === data.order_id) setSelected(data);
      toast.success(`Moved to ${statusLabel[data.status]}`);
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/orders/${selected.order_id}`);
      setOrders(prev => prev.filter(o => o.order_id !== selected.order_id));
      setSelected(null); setConfirmDelete(false);
      toast.success('Order deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const nextStatus = (o: Order) => {
    const idx = purchaseStatuses.indexOf(o.status);
    return idx < purchaseStatuses.length - 1 ? statusLabel[purchaseStatuses[idx + 1]] : null;
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Purchase Orders"
        subtitle={`${orders.length} orders`}
        actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={15} />New Order</button>}
      />

      <div className="list-detail flex-1">
        <div className="list-panel flex flex-col">
          <div className="p-3 border-b border-surface-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input className="input pl-8 text-sm" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4 text-center text-sm text-ink-300">Loading…</div>
              : orders.length === 0 ? <div className="empty-state"><Truck size={28} /><p>No purchase orders</p></div>
              : orders.map(o => (
                <div key={o.order_id} className={`list-item ${selected?.order_id === o.order_id ? 'selected' : ''}`} onClick={() => setSelected(o)}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-ink-900 font-mono">{o.order_id}</span>
                    <span className={`badge ${statusBadge[o.status] || 'badge-gray'}`}>{statusLabel[o.status] || o.status}</span>
                  </div>
                  <div className="text-sm text-ink-500 truncate">{o.party_name || 'No supplier'}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-ink-400">{fmt.date(o.date)}</span>
                    <span className="text-sm font-medium text-ink-900">{fmt.currency(o.total_amount)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="detail-panel">
          {selected ? (
            <div className="p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-ink-900 font-mono">{selected.order_id}</h2>
                  <p className="text-sm text-ink-400 mt-0.5">{selected.party_name || 'No supplier'} · {fmt.datetime(selected.date)}</p>
                </div>
                <div className="flex gap-2">
                  {nextStatus(selected) && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleAdvance(selected)}>
                      <ArrowRight size={14} />Move to {nextStatus(selected)}
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Status progress */}
              <div className="card p-4 mb-4">
                <div className="flex items-center gap-1">
                  {purchaseStatuses.map((s, i) => {
                    const current = purchaseStatuses.indexOf(selected.status);
                    const done = i <= current;
                    return (
                      <React.Fragment key={s}>
                        <div className={`flex items-center gap-1.5 ${done ? 'text-brand-500' : 'text-ink-300'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${done ? 'bg-brand-500 text-white' : 'bg-surface-3 text-ink-300'}`}>{i + 1}</div>
                          <span className="text-xs hidden sm:inline font-medium">{statusLabel[s]}</span>
                        </div>
                        {i < purchaseStatuses.length - 1 && <div className={`flex-1 h-0.5 ${i < current ? 'bg-brand-500' : 'bg-surface-3'}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="card p-4">
                  <div className="text-xs text-ink-400 mb-2 font-semibold uppercase tracking-wide">Order Info</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-ink-500">Supplier</span><span className="text-ink-900 font-medium">{selected.party_name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">Supplier ID</span><span className="text-ink-900 font-mono text-xs">{selected.party_id || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">Date</span><span className="text-ink-900">{fmt.date(selected.date)}</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">Status</span><span className={`badge ${statusBadge[selected.status]}`}>{statusLabel[selected.status]}</span></div>
                  </div>
                </div>
                <div className="card p-4">
                  <div className="text-xs text-ink-400 mb-2 font-semibold uppercase tracking-wide">Amount</div>
                  <div className="text-2xl font-semibold text-ink-900">{fmt.currency(selected.total_amount)}</div>
                  <div className="text-xs text-ink-400 mt-1">{selected.products.length} product line{selected.products.length !== 1 ? 's' : ''}</div>
                  {selected.notes && <div className="mt-3 text-xs text-ink-500 border-t border-surface-2 pt-3">{selected.notes}</div>}
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-2">
                  <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Products</span>
                </div>
                <table className="data-table">
                  <thead><tr><th>Product</th><th>Code</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead>
                  <tbody>
                    {selected.products.map((p, i) => (
                      <tr key={i}>
                        <td className="font-medium text-ink-900">{p.name}</td>
                        <td className="font-mono text-xs text-ink-400">{p.product_code}</td>
                        <td className="text-right">{fmt.qty(p.quantity)}</td>
                        <td className="text-right">{fmt.currency(p.price)}</td>
                        <td className="text-right font-semibold">{fmt.currency(p.total || p.price * p.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-surface-2 flex justify-end">
                  <div className="text-sm font-semibold text-ink-900">Total: {fmt.currency(selected.total_amount)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state h-full">
              <Truck size={36} />
              <h3 className="text-sm font-medium text-ink-500 mt-2">Select an order</h3>
              <p>Click an order from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <OrderForm type="purchase" onSave={o => { setOrders(prev => [o, ...prev]); setSelected(o); setShowForm(false); }} onClose={() => setShowForm(false)} />
      )}
      {confirmDelete && (
        <ConfirmDialog title="Delete Order" message={`Delete order ${selected?.order_id}?`} confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
      )}
    </div>
  );
}
