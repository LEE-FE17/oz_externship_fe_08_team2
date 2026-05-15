import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api, { baseApi } from '@/api/instance'

interface MeResponse {
  id: number
  nickname: string
  email: string
  profile_img_url?: string | null
  role?: 'USER' | 'STUDENT' | 'ADMIN'
}

interface RefreshResponse {
  access_token: string
}

export function useInitAuth() {
  useEffect(() => {
    baseApi
      .post<RefreshResponse>('/api/v1/accounts/me/refresh')
      .then(({ data }) => {
        localStorage.setItem('accessToken', data.access_token)
        return api.get<MeResponse>('/api/v1/accounts/me')
      })
      .then(({ data }) => {
        useAuthStore.getState().login({
          id: data.id,
          nickname: data.nickname,
          email: data.email,
          profileImage: data.profile_img_url,
          role: data.role,
        })
      })
      .catch(() => {
        useAuthStore.getState().setInitialized()
      })
  }, [])
}
