import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/instance'

interface MeResponse {
  id: number
  nickname: string
  email: string
  profile_img_url?: string | null
  role?: 'user' | 'student' | 'admin'
}

export function useInitAuth() {
  const { login, logout } = useAuthStore()

  useEffect(() => {
    api
      .get<MeResponse>('/api/v1/accounts/me/')
      .then(({ data }) => {
        login({
          id: data.id,
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
