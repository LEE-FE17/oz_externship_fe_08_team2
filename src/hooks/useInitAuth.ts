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
  useEffect(() => {
    // URL 파라미터로 넘어온 토큰이 있으면 localStorage에 저장
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      localStorage.setItem('accessToken', urlToken)
      // URL에서 token 파라미터 제거
      params.delete('token')
      const newSearch = params.toString()
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : '')
      window.history.replaceState(null, '', newUrl)
    }

    api
      .get<MeResponse>('/api/v1/accounts/me')
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
