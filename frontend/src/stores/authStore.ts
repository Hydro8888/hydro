import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  nickname: string;
  role: string;
  isAdultVerified: boolean;
  profileImage?: string | null;
  preferredRegions: string[];
  preferredJobTypes: string[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({ user: null, isLoading: false });
  },
}));
