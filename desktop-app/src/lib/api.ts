import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Both the Desktop App and Website will now communicate with the centralized hosted database
const BASE_URL = import.meta.env?.VITE_API_URL || 'https://stockflow-obza.onrender.com/api';

const api: AxiosInstance = axios.create({ baseURL: BASE_URL });

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokens = {
  set: (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  },
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
  },
};

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// For simplicity in this demo, omitting the complex refresh token interceptor queue.

export default api;

export interface Product {
  product_code: string;
  name: string;
  description: string;
  weight: number;
  price: number;
  quantity: number;
  last_updated: string;
}

export interface OrderProduct {
  product_code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  order_id: string;
  type: 'sale' | 'purchase';
  party_id: string;
  party_name: string;
  products: OrderProduct[];
  status: string;
  date: string;
  notes: string;
  total_amount: number;
  last_updated: string;
}

export interface DashboardData {
  totalProducts: number;
  totalInventoryValue: number;
  pendingSales: number;
  pendingPurchases: number;
  wipBatches: number;
  lowStock: Product[];
  recentOrders: Order[];
}
