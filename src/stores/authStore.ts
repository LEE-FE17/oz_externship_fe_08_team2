import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface User {
  id: number
  nickname: string
  email: string
  profileImage?: string | null
  role?: 'USER' | 'STUDENT' | 'ADMIN'
}

interface AuthState {
  isAuthenticated: boolean
  isInitialized: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
  setInitialized: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      isAuthenticated: false,
      isInitialized: false,
      user: null,
      login: (user) =>
        set(
          { isAuthenticated: true, isInitialized: true, user },
          undefined,
          'auth/login'
        ),
      logout: () =>
        set(
          { isAuthenticated: false, isInitialized: true, user: null },
          undefined,
          'auth/logout'
        ),
      setInitialized: () =>
        set({ isInitialized: true }, undefined, 'auth/setInitialized'),
    }),
    { name: 'AuthStore' }
  )
)
