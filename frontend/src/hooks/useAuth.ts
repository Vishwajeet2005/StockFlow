import { create } from 'zustand';
import api, { tokens } from '../lib/api';

interface AuthState {
  accessToken: string | null;
  username: string | null;
  role: string | null;
  companyName: string | null;
  twoFAEnabled: boolean;
  // Step-1 login returns a partial token pending TOTP
  partialToken: string | null;
  // login step 1: password
  login: (username: string, password: string) => Promise<{ requires2FA: boolean }>;
  // register a new company
  register: (company_name: string, username: string, password: string) => Promise<void>;
  // login step 2: TOTP code
  verify2FA: (code: string) => Promise<void>;
  // logout
  logout: () => Promise<void>;
  // update 2FA status after settings change
  set2FAEnabled: (v: boolean) => void;
  // refresh user info
  refreshMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: tokens.getAccess(),
  username: localStorage.getItem('username'),
  role: localStorage.getItem('role'),
  companyName: localStorage.getItem('companyName'),
  twoFAEnabled: localStorage.getItem('twoFAEnabled') === 'true',
  partialToken: null,

  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    if (data.requires2FA) {
      set({ partialToken: data.partialToken });
      return { requires2FA: true };
    }
    tokens.set(data.accessToken, data.refreshToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    localStorage.setItem('twoFAEnabled', String(data.twoFAEnabled));
    set({ accessToken: data.accessToken, username: data.username, role: data.role, twoFAEnabled: data.twoFAEnabled, partialToken: null });
    
    // Fetch company name
    try {
      const me = await api.get('/auth/me');
      localStorage.setItem('companyName', me.data.company_name);
      set({ companyName: me.data.company_name });
    } catch {}

    return { requires2FA: false };
  },

  register: async (company_name, username, password) => {
    const { data } = await api.post('/auth/register', { company_name, username, password });
    tokens.set(data.accessToken, data.refreshToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    localStorage.setItem('twoFAEnabled', String(data.twoFAEnabled));
    set({ accessToken: data.accessToken, username: data.username, role: data.role, twoFAEnabled: data.twoFAEnabled, partialToken: null });

    // Fetch company name
    try {
      const me = await api.get('/auth/me');
      localStorage.setItem('companyName', me.data.company_name);
      set({ companyName: me.data.company_name });
    } catch {}
  },

  verify2FA: async (code) => {
    const { partialToken } = get();
    if (!partialToken) throw new Error('No partial token. Please log in again.');
    const { data } = await api.post('/auth/verify-2fa', { partialToken, code });
    tokens.set(data.accessToken, data.refreshToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    localStorage.setItem('twoFAEnabled', String(data.twoFAEnabled));
    set({ accessToken: data.accessToken, username: data.username, role: data.role, twoFAEnabled: data.twoFAEnabled, partialToken: null });

    // Fetch company name
    try {
      const me = await api.get('/auth/me');
      localStorage.setItem('companyName', me.data.company_name);
      set({ companyName: me.data.company_name });
    } catch {}
  },

  logout: async () => {
    try { await api.post('/auth/logout', { refreshToken: tokens.getRefresh() }); } catch { /* ignore */ }
    tokens.clear();
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('companyName');
    localStorage.removeItem('twoFAEnabled');
    set({ accessToken: null, username: null, role: null, companyName: null, twoFAEnabled: false, partialToken: null });
  },

  set2FAEnabled: (v) => {
    localStorage.setItem('twoFAEnabled', String(v));
    set({ twoFAEnabled: v });
  },

  refreshMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('twoFAEnabled', String(data.twoFAEnabled));
      localStorage.setItem('role', data.role);
      localStorage.setItem('companyName', data.company_name);
      set({ twoFAEnabled: data.twoFAEnabled, role: data.role, companyName: data.company_name });
    } catch { /* ignore */ }
  },
}));
