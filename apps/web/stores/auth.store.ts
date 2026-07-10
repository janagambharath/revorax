'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
  avatarUrl?: string;
}

interface Org {
  id: string;
  name: string;
  businessType: string;
  slug: string;
  plan: string;
  logoUrl?: string;
}

interface AuthState {
  user: User | null;
  org: Org | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOrg: (org: Org | null) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      org: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setOrg: (org) => set({ org }),

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const data = await authApi.me() as unknown as { user: User; org: Org };
          set({ user: data.user, org: data.org });
        } catch {
          set({ user: null, org: null });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        set({ user: null, org: null });
        window.location.href = '/login';
      },
    }),
    {
      name: 'revorax-auth',
      partialize: (state) => ({ user: state.user, org: state.org }),
    },
  ),
);
