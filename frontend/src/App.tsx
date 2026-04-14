import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import ManufacturingPage from './pages/ManufacturingPage';
import HistoryPage from './pages/HistoryPage';
import PartiesPage from './pages/PartiesPage';
import SecurityPage from './pages/SecurityPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/"            element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/products"    element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
      <Route path="/sales"       element={<PrivateRoute><SalesPage /></PrivateRoute>} />
      <Route path="/purchases"   element={<PrivateRoute><PurchasesPage /></PrivateRoute>} />
      <Route path="/manufacturing" element={<PrivateRoute><ManufacturingPage /></PrivateRoute>} />
      <Route path="/history"     element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
      <Route path="/parties"     element={<PrivateRoute><PartiesPage /></PrivateRoute>} />
      <Route path="/security"    element={<PrivateRoute><SecurityPage /></PrivateRoute>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  );
}
