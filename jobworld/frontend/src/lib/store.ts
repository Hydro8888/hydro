import { create } from 'zustand'

interface User {
  id: number
  email: string
  name: string
  user_type: 'jobseeker' | 'employer' | 'admin'
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

const isBrowser = typeof window !== 'undefined'

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: isBrowser ? localStorage.getItem('access_token') : null,
  setAuth: (user, token) => {
    if (isBrowser) localStorage.setItem('access_token', token)
    set({ user, token })
  },
  logout: () => {
    if (isBrowser) localStorage.removeItem('access_token')
    set({ user: null, token: null })
  },
}))
