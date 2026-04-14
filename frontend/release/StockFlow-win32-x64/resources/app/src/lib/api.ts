import axios, { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api: AxiosInstance = axios.create({ baseURL: BASE_URL });

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokens = {
  getAccess: () => localStorage.getItem('accessToken'),
  getRefresh: () => localStorage.getItem('refreshToken'),
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
  const token = tokens.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

function processQueue(err: any, token: string | null) {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token!)));
  queue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = tokens.getRefresh();
      if (!refreshToken) {
        tokens.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        tokens.set(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        tokens.clear();
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    if (error.response?.status === 401 && !original._retry) {
      tokens.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Types ────────────────────────────────────────────────────────────────────
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

export interface ManufacturingBatch {
  batch_id: string;
  batch_number: string;
  raw_materials: { product_code: string; name: string; quantity: number }[];
  output: { product_code: string; name: string; quantity: number }[];
  status: 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  start_date: string;
  end_date: string | null;
  last_updated: string;
}

export interface Customer {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Supplier {
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
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

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmt = {
  currency: (n: number) =>
    '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  date: (s: string) =>
    s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  datetime: (s: string) =>
    s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
  qty: (n: number) => Number(n || 0).toLocaleString('en-IN'),
};

// ─── Status maps ─────────────────────────────────────────────────────────────
export const saleStatuses = ['quotation', 'packing', 'dispatched', 'completed'];
export const purchaseStatuses = ['quotation_received', 'unpaid', 'paid', 'completed'];

export const statusLabel: Record<string, string> = {
  quotation: 'Quotation',
  packing: 'Packing',
  dispatched: 'Dispatched',
  completed: 'Completed',
  quotation_received: 'Quotation Received',
  unpaid: 'Unpaid',
  paid: 'Paid',
  in_progress: 'In Progress',
  cancelled: 'Cancelled',
};

export const statusBadge: Record<string, string> = {
  quotation: 'badge-blue',
  packing: 'badge-yellow',
  dispatched: 'badge-orange',
  completed: 'badge-green',
  quotation_received: 'badge-blue',
  unpaid: 'badge-red',
  paid: 'badge-purple',
  in_progress: 'badge-orange',
  cancelled: 'badge-gray',
};
