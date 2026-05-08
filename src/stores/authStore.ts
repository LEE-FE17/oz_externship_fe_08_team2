import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface User {
  id: number
  nickname: string
  email: string
  profileImage?: string | null
  role?: 'user' | 'student' | 'admin'
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) =>
        set({ isAuthenticated: true, user }, undefined, 'auth/login'),
      logout: () =>
        set({ isAuthenticated: false, user: null }, undefined, 'auth/logout'),
    }),
    { name: 'AuthStore' }
  )
)
