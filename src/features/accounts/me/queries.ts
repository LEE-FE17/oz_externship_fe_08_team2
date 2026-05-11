import { useQuery } from '@tanstack/react-query'
import api from '@/api/instance'
import type { MeResponse } from './types'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['accounts', 'me'],
    queryFn: () => api.get<MeResponse>('/api/v1/accounts/me/').then((r) => r.data),
    enabled: !!localStorage.getItem('accessToken'),
    staleTime: 60 * 1000,
    retry: 1,
  })
}
