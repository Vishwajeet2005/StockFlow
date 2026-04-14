import React, { useEffect, useState, useCallback } from 'react';
import { Search, History, ShoppingCart, Truck, Wrench, Download } from 'lucide-react';
import api, { Order, ManufacturingBatch, fmt, statusLabel, statusBadge } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';

type Tab = 'all' | 'sales' | 'purchases' | 'manufacturing';

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search: search || undefined };
      const [ordersRes, batchesRes] = await Promise.all([
        api.get('/orders', { params }),
        api.get('/manufacturing'),
      ]);
      setOrders(ordersRes.data);
      setBatches(batchesRes.data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const filteredOrders = orders.filter(o => {
    if (tab === 'sales') return o.type === 'sale';
    if (tab === 'purchases') return o.type === 'purchase';
    if (tab === 'manufacturing') return false;
    return true;
  });

  const showBatches = tab === 'all' || tab === 'manufacturing';

  const exportCSV = () => {
    const rows = [['ID', 'Type', 'Party', 'Status', 'Date', 'Amount']];
    filteredOrders.forEach(o => rows.push([o.order_id, o.type, o.party_name, o.status, fmt.date(o.date), fmt.currency(o.total_amount)]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orders-history-${Date.now()}.csv`;
    a.click();
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: History },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'manufacturing', label: 'Manufacturing', icon: Wrench },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Order History"
        subtitle="Complete transaction history"
        actions={
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} />Export CSV</button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 border-b border-surface-3 bg-white flex items-center gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-1 bg-surface-2 p-1 rounded-lg">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400 hover:text-ink-700'}`}>
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input className="input pl-8 text-sm" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="p-6 animate-fade-in space-y-6">
          {loading ? (
            <div className="text-center text-sm text-ink-300 py-10">Loading…</div>
          ) : (
            <>
              {/* Orders table */}
              {(tab === 'all' || tab === 'sales' || tab === 'purchases') && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">Orders</span>
                    <span className="text-xs text-ink-400">{filteredOrders.length} records</span>
                  </div>
                  {filteredOrders.length === 0 ? (
                    <div className="empty-state py-10"><History size={28} /><p>No orders found</p></div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Type</th>
                          <th>Party</th>
                          <th>Products</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(o => (
                          <tr key={o.order_id}>
                            <td className="font-mono text-xs font-semibold text-ink-900">{o.order_id}</td>
                            <td>
                              <span className={`badge ${o.type === 'sale' ? 'badge-green' : 'badge-orange'}`}>
                                {o.type === 'sale' ? 'Sale' : 'Purchase'}
                              </span>
                            </td>
                            <td className="text-ink-700">{o.party_name || '—'}</td>
                            <td className="text-ink-400 text-xs">{o.products.length} item{o.products.length !== 1 ? 's' : ''}</td>
                            <td><span className={`badge ${statusBadge[o.status] || 'badge-gray'}`}>{statusLabel[o.status] || o.status}</span></td>
                            <td className="text-ink-400 text-xs">{fmt.date(o.date)}</td>
                            <td className="text-right font-semibold text-ink-900">{fmt.currency(o.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Manufacturing table */}
              {showBatches && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">Manufacturing Batches</span>
                    <span className="text-xs text-ink-400">{batches.length} batches</span>
                  </div>
                  {batches.length === 0 ? (
                    <div className="empty-state py-10"><Wrench size={28} /><p>No batches found</p></div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Batch Number</th>
                          <th>Raw Materials</th>
                          <th>Output</th>
                          <th>Status</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map(b => (
                          <tr key={b.batch_id}>
                            <td className="font-mono text-xs font-semibold text-ink-900">{b.batch_number}</td>
                            <td className="text-xs text-ink-500">{b.raw_materials.map(m => m.name || m.product_code).join(', ')}</td>
                            <td className="text-xs text-ink-500">{b.output.map(m => m.name || m.product_code).join(', ')}</td>
                            <td><span className={`badge ${statusBadge[b.status] || 'badge-gray'}`}>{statusLabel[b.status] || b.status}</span></td>
                            <td className="text-xs text-ink-400">{fmt.date(b.start_date)}</td>
                            <td className="text-xs text-ink-400">{b.end_date ? fmt.date(b.end_date) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
