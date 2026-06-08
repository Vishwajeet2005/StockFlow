import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Loader2, Lock } from 'lucide-react';
import api, { fmt } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/layout/PageHeader';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const { role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'admin') {
      api.get('/analytics')
        .then(r => {
          setData(r.data);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [role]);

  if (role !== 'admin') {
    return (
      <div className="h-full flex flex-col p-6 items-center justify-center">
        <Lock size={48} className="text-ink-300 mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Access Denied</h2>
        <p className="text-ink-500">Only administrators can access Reports & Analytics.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    );
  }

  const { totalRevenue, totalCost, netProfit, salesTrend, topProducts } = data;

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Reports & Analytics" subtitle="Overview of your business performance" />

      <div className="p-6 max-w-6xl space-y-6 animate-fade-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-900 text-sm">Total Revenue</h3>
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-ink-900">{fmt.currency(totalRevenue)}</div>
            <p className="text-xs text-blue-600 mt-2">All completed sales</p>
          </div>
          
          <div className="card p-5 bg-gradient-to-br from-red-50 to-white border-red-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-red-900 text-sm">Total Cost</h3>
              <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600">
                <TrendingDown size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-ink-900">{fmt.currency(totalCost)}</div>
            <p className="text-xs text-red-600 mt-2">All completed purchases</p>
          </div>

          <div className="card p-5 bg-gradient-to-br from-green-50 to-white border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-900 text-sm">Net Profit</h3>
              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-ink-900">{fmt.currency(netProfit)}</div>
            <p className="text-xs text-green-600 mt-2">Revenue - Cost</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend Chart */}
          <div className="card p-5 lg:col-span-2 flex flex-col h-96">
            <h3 className="font-semibold text-ink-900 mb-6">Sales Trend (Last 6 Months)</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [fmt.currency(val), 'Sales']}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Pie Chart */}
          <div className="card p-5 flex flex-col h-96">
            <h3 className="font-semibold text-ink-900 mb-2">Top Selling Products</h3>
            <p className="text-xs text-ink-400 mb-6">By revenue all time</p>
            {topProducts.length > 0 ? (
              <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="name"
                      stroke="none"
                    >
                      {topProducts.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [fmt.currency(val), 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="absolute bottom-0 left-0 right-0 max-h-24 overflow-y-auto pr-2">
                  <div className="space-y-2">
                    {topProducts.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-ink-700 truncate">{p.name}</span>
                        </div>
                        <span className="font-medium text-ink-900 ml-2">{fmt.currency(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-ink-400 border border-dashed border-surface-3 rounded-lg bg-surface-1">
                No sales data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
