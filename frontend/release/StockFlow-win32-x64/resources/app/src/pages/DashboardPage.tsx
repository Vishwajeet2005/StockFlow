import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Truck, Wrench, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import api, { DashboardData, fmt, statusLabel, statusBadge } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-ink-300">
      <div className="text-sm">Loading dashboard…</div>
    </div>
  );
  if (!data) return null;

  const stats = [
    { label: 'Total Inventory Value', value: fmt.currency(data.totalInventoryValue), icon: TrendingUp, color: 'bg-blue-50 text-blue-600', link: '/products' },
    { label: 'Total Products', value: data.totalProducts.toString(), icon: Package, color: 'bg-violet-50 text-violet-600', link: '/products' },
    { label: 'Active Sales Orders', value: data.pendingSales.toString(), icon: ShoppingCart, color: 'bg-green-50 text-green-600', link: '/sales' },
    { label: 'Active Purchase Orders', value: data.pendingPurchases.toString(), icon: Truck, color: 'bg-orange-50 text-orange-600', link: '/purchases' },
    { label: 'WIP Batches', value: data.wipBatches.toString(), icon: Wrench, color: 'bg-yellow-50 text-yellow-600', link: '/manufacturing' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Dashboard"
        subtitle={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} — here's what's happening today`}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map(s => (
            <div key={s.label} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(s.link)}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div className="text-xl font-semibold text-ink-900">{s.value}</div>
              <div className="text-xs text-ink-400 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-2">
              <h2 className="font-semibold text-ink-900 text-sm">Recent Orders</h2>
              <button className="btn btn-ghost btn-sm gap-1 text-xs" onClick={() => navigate('/history')}>
                View all <ArrowRight size={13} />
              </button>
            </div>
            <div>
              {data.recentOrders.length === 0 ? (
                <div className="empty-state py-10">
                  <ShoppingCart size={28} />
                  <p>No orders yet</p>
                </div>
              ) : (
                data.recentOrders.map(order => (
                  <div key={order.order_id} className="flex items-center gap-3 px-5 py-3 border-b border-surface-2 last:border-0 hover:bg-surface-1 cursor-pointer"
                    onClick={() => navigate(order.type === 'sale' ? '/sales' : '/purchases')}>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${order.type === 'sale' ? 'bg-green-50' : 'bg-orange-50'}`}>
                      {order.type === 'sale' ? <ShoppingCart size={13} className="text-green-600" /> : <Truck size={13} className="text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900 truncate">{order.order_id}</div>
                      <div className="text-xs text-ink-400 truncate">{order.party_name || 'No party'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-ink-900">{fmt.currency(order.total_amount)}</div>
                      <span className={`badge text-xs ${statusBadge[order.status] || 'badge-gray'}`}>{statusLabel[order.status] || order.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-2">
              <h2 className="font-semibold text-ink-900 text-sm">Low Stock Alert</h2>
              <button className="btn btn-ghost btn-sm gap-1 text-xs" onClick={() => navigate('/products')}>
                Manage <ArrowRight size={13} />
              </button>
            </div>
            <div>
              {data.lowStock.length === 0 ? (
                <div className="empty-state py-10">
                  <AlertCircle size={28} />
                  <p>All products are adequately stocked</p>
                </div>
              ) : (
                data.lowStock.map(p => (
                  <div key={p.product_code} className="flex items-center gap-3 px-5 py-3 border-b border-surface-2 last:border-0">
                    <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={13} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900 truncate">{p.name}</div>
                      <div className="text-xs text-ink-400 font-mono">{p.product_code}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${p.quantity <= 5 ? 'text-red-600' : 'text-yellow-600'}`}>{fmt.qty(p.quantity)} units</div>
                      <div className="text-xs text-ink-400">{fmt.currency(p.price)}/unit</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
