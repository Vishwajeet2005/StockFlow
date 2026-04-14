import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, FileText, LogOut, TrendingUp, AlertTriangle, IndianRupee, Command, User, Lock } from 'lucide-react';
import api, { tokens } from './lib/api';
import type { Product, Order, DashboardData } from './lib/api';

// --- COMPONENTS ---
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`glass-panel p-6 rounded-xl border-t-4 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start gap-4`} style={{ borderTopColor: color }}>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-wide">{title}</h3>
        <p className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// --- SCREENS ---

function LoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      tokens.set(response.data.accessToken, response.data.refreshToken);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Login failed. Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4 drag-region">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm -z-10" />
      <div className="glass-panel w-full max-w-md p-10 rounded-2xl no-drag animate-[fadeIn_0.5s_ease-out]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/10">
            <Package size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white text-center">StockFlow</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium tracking-wide">Enterprise Desktop Client</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            {loading ? <Command className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (e) {
      navigate('/');
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!data) return <div className="flex-1 flex items-center justify-center"><Command className="animate-spin text-blue-500 size-10" /></div>;

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Overview</h2>
          <p className="text-slate-500 mt-1">Real-time inventory insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Value" value={`₹${data.totalInventoryValue.toLocaleString()}`} icon={<IndianRupee size={28} className="text-emerald-500" />} color="#10b981" />
        <StatCard title="Total Products" value={data.totalProducts} icon={<Package size={28} className="text-blue-500" />} color="#3b82f6" />
        <StatCard title="Pending Sales" value={data.pendingSales} icon={<TrendingUp size={28} className="text-amber-500" />} color="#f59e0b" />
        <StatCard title="Low Stock" value={data.lowStock.length} icon={<AlertTriangle size={28} className="text-rose-500" />} color="#f43f5e" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 glass-panel p-6 rounded-2xl">
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-blue-500"/> Recent Activity</h3>
           <div className="space-y-4">
             {data.recentOrders?.slice(0,5).map(o => (
               <div key={o.order_id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                 <div>
                   <p className="font-bold text-slate-900 dark:text-white">{o.party_name}</p>
                   <p className="text-sm text-slate-500">{new Date(o.date).toLocaleDateString()} · {o.type}</p>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-slate-900 dark:text-white">₹{o.total_amount}</p>
                   <span className={`text-xs px-2 py-1 rounded-md mt-1 inline-block ${o.type === 'sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30'}`}>
                     {o.status.replace('_', ' ')}
                   </span>
                 </div>
               </div>
             ))}
             {(!data.recentOrders || data.recentOrders.length === 0) && <p className="text-slate-500">No recent orders found.</p>}
           </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl bg-rose-500/5 border-rose-500/20">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-600 dark:text-rose-400"><AlertTriangle /> Needs Attention</h3>
          <div className="space-y-3">
            {data.lowStock.map(p => (
              <div key={p.product_code} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 shadow-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                <span className="font-bold text-rose-500 px-2 py-0.5 bg-rose-100 dark:bg-rose-950 rounded">Qty: {p.quantity}</span>
              </div>
            ))}
            {data.lowStock.length === 0 && <p className="text-slate-500 text-sm">All products are sufficiently stocked.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    const response = await api.get('/products');
    setProducts(response.data);
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Inventory</h2>
      <div className="glass-panel flex-1 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1 h-[0px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0 backdrop-blur-md z-10">
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Code</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Name</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Price</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Stock</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs whitespace-nowrap">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 h-full overflow-y-auto">
              {products.map((item) => (
                <tr key={item.product_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4"><span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-mono">{item.product_code}</span></td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td className="p-4 font-mono text-slate-600 dark:text-slate-300">₹{item.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`font-bold ${item.quantity < 10 ? 'text-rose-500' : 'text-emerald-500'}`}>{item.quantity}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-900 dark:text-white font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const response = await api.get('/orders');
    setOrders(response.data);
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Orders Pipeline</h2>
      <div className="glass-panel flex-1 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1 h-[0px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0 backdrop-blur-md z-10">
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Date</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Type</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Party</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {orders.map((item) => {
                const isSale = item.type === 'sale';
                return (
                  <tr key={item.order_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-slate-500 text-sm whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-md uppercase font-bold tracking-wider ${isSale ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{item.party_name}</td>
                    <td className="p-4 max-w-[150px]">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs truncate capitalize block w-fit">
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">₹{item.total_amount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- LAYOUT ---

function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    tokens.clear();
    navigate('/');
  };

  const menu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-[35px] drag-region z-50 flex items-center px-4">
        <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-16 no-drag">
          StockFlow Client
        </div>
      </div>
      
      <div className="w-64 flex flex-col bg-[#020617] text-slate-300 pt-10 flex-shrink-0 z-20 shadow-2xl relative border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 mt-4">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Package className="text-blue-500" size={24} />
          </div>
          <h1 className="text-xl font-black text-white">StockFlow</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 no-drag">
          {menu.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-100'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="font-medium">{item.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 no-drag">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
      
      <main className="flex-1 relative pt-[35px] overflow-hidden no-drag bg-slate-50 dark:bg-[#0b1120]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        
        <div className="h-full relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/dashboard" element={<AppLayout><DashboardScreen /></AppLayout>} />
        <Route path="/products" element={<AppLayout><ProductsScreen /></AppLayout>} />
        <Route path="/orders" element={<AppLayout><OrdersScreen /></AppLayout>} />
      </Routes>
    </Router>
  );
}
