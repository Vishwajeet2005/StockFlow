import { create } from 'zustand';
import api, { tokens } from '../lib/api';

interface AuthState {
  accessToken: string | null;
  username: string | null;
  twoFAEnabled: boolean;
  // Step-1 login returns a partial token pending TOTP
  partialToken: string | null;
  // login step 1: password
  login: (username: string, password: string) => Promise<{ requires2FA: boolean }>;
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
    localStorage.setItem('twoFAEnabled', String(data.twoFAEnabled));
    set({ accessToken: data.accessToken, username: data.username, twoFAEnabled: data.twoFAEnabled, partialToken: null });
    return { requires2FA: false };
  },

  verify2FA: async (code) => {
    const { partialToken } = get();
    if (!partialToken) throw new Error('No partial token. Please log in again.');
    const { data } = await api.post('/auth/verify-2fa', { partialToken, code });
    tokens.set(data.accessToken, data.refreshToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('twoFAEnabled', String(data.twoFAEnabled));
    set({ accessToken: data.accessToken, username: data.username, twoFAEnabled: data.twoFAEnabled, partialToken: null });
  },

  logout: async () => {
    try { await api.post('/auth/logout', { refreshToken: tokens.getRefresh() }); } catch { /* ignore */ }
    tokens.clear();
    localStorage.removeItem('username');
    localStorage.removeItem('twoFAEnabled');
    set({ accessToken: null, username: null, twoFAEnabled: false, partialToken: null });
  },

  set2FAEnabled: (v) => {
    localStorage.setItem('twoFAEnabled', String(v));
    set({ twoFAEnabled: v });
  },

  refreshMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('twoFAEnabled', String(data.twoFAEnabled));
      set({ twoFAEnabled: data.twoFAEnabled });
    } catch { /* ignore */ }
  },
}));
