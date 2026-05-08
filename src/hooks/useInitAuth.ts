import { useEffect } from 'react'
import { refreshAccessToken } from '@/api/interceptors'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/instance'

interface MeResponse {
  nickname: string
  email: string
  profile_img_url?: string | null
  role?: 'user' | 'student' | 'admin'
}

export function useInitAuth() {
  const { login, logout } = useAuthStore()

  useEffect(() => {
    refreshAccessToken()
      .then(async () => {
        const { data } = await api.get<MeResponse>('/api/v1/accounts/me')
        login({
          nickname: data.nickname,
          email: data.email,
          profileImage: data.profile_img_url,
          role: data.role,
        })
      })
      .catch(() => {
        logout()
      })
  }, [login, logout])
}
