import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Truck, Wrench, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api, { DashboardData, fmt, statusLabel, statusBadge } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-surface-2 rounded-md ${className}`} />
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const renderSkeletons = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="card p-4">
            <Skeleton className="w-9 h-9 mb-3 rounded-lg" />
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5"><Skeleton className="h-6 w-32 mb-4" /><Skeleton className="h-10 w-full mb-3" /><Skeleton className="h-10 w-full" /></div>
        <div className="card p-5"><Skeleton className="h-6 w-32 mb-4" /><Skeleton className="h-10 w-full mb-3" /><Skeleton className="h-10 w-full" /></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <PageHeader title="Dashboard" subtitle="Loading your workspace..." />
        {renderSkeletons()}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: 'Total Inventory Value', value: fmt.currency(data.totalInventoryValue), icon: TrendingUp, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', link: '/products' },
    { label: 'Total Products', value: data.totalProducts.toString(), icon: Package, color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', link: '/products' },
    { label: 'Active Sales Orders', value: data.pendingSales.toString(), icon: ShoppingCart, color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400', link: '/sales' },
    { label: 'Active Purchase Orders', value: data.pendingPurchases.toString(), icon: Truck, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', link: '/purchases' },
    { label: 'WIP Batches', value: data.wipBatches.toString(), icon: Wrench, color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', link: '/manufacturing' },
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
            <div key={s.label} className="card p-4 cursor-pointer" onClick={() => navigate(s.link)}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform hover:scale-110 duration-200 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div className="text-xl font-semibold text-ink-900">{s.value}</div>
              <div className="text-xs text-ink-400 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {data.chartData && (
          <div className="card p-5">
            <h2 className="font-semibold text-ink-900 text-sm mb-6">Sales vs Purchases Overview</h2>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-400)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-400)' }} tickFormatter={(val) => \`₹\${val/1000}k\`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-0)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: 'var(--ink-900)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                    formatter={(val: number) => [fmt.currency(val)]}
                  />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

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
                  <div key={order.order_id} className="flex items-center gap-3 px-5 py-3 border-b border-surface-2 last:border-0 hover:bg-surface-1 cursor-pointer transition-colors"
                    onClick={() => navigate(order.type === 'sale' ? '/sales' : '/purchases')}>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${order.type === 'sale' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-orange-50 dark:bg-orange-900/30'}`}>
                      {order.type === 'sale' ? <ShoppingCart size={13} className="text-green-600 dark:text-green-400" /> : <Truck size={13} className="text-orange-600 dark:text-orange-400" />}
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
                    <div className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={13} className="text-red-500 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900 truncate">{p.name}</div>
                      <div className="text-xs text-ink-400 font-mono">{p.product_code}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${p.quantity <= 5 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{fmt.qty(p.quantity)} units</div>
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
