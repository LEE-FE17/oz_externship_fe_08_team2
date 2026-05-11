import { useMutation } from '@tanstack/react-query'
import api from '@/api/instance'
import type { LogoutResponse } from './types'

export function useLogout() {
  return useMutation({
    mutationFn: () =>
      api.post<LogoutResponse>('/api/v1/accounts/logout').then((r) => r.data),
  })
}
