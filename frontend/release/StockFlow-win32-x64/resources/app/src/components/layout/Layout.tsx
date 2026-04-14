import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  Wrench, History, Users, LogOut, Menu, Building2, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/sales', icon: ShoppingCart, label: 'Sales Orders' },
  { to: '/purchases', icon: Truck, label: 'Purchase Orders' },
  { to: '/manufacturing', icon: Wrench, label: 'Manufacturing' },
  { to: '/history', icon: History, label: 'Order History' },
  { to: '/parties', icon: Users, label: 'Customers & Suppliers' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { username, twoFAEnabled, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const Sidebar = () => (
    <aside className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-3">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={16} color="#fff" />
        </div>
        <div>
          <div className="font-semibold text-ink-900 text-sm leading-tight">StockFlow</div>
          <div className="text-xs text-ink-300">Inventory Suite</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="pt-3 mt-2 border-t border-surface-2">
          <NavLink
            to="/security"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <ShieldCheck size={17} />
            <span>Security</span>
            {!twoFAEnabled && (
              <span className="ml-auto w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" title="2FA not enabled" />
            )}
          </NavLink>
        </div>
      </nav>

      <div className="p-3 border-t border-surface-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs font-semibold flex-shrink-0">
            {username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink-900 truncate">{username}</div>
            <div className="text-xs text-ink-300">{twoFAEnabled ? '2FA on' : 'No 2FA'}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm p-1.5 h-auto text-ink-400 hover:text-red-500" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-1">
      <div className="hidden md:flex w-56 flex-shrink-0 border-r border-surface-3 bg-white flex-col">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-56 bg-white border-r border-surface-3 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-3">
          <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-sm p-1.5 h-auto">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-ink-900">StockFlow</span>
        </div>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
