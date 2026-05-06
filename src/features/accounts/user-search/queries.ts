import { useQuery } from '@tanstack/react-query'
import api from '@/api/instance'
import type { UserSearchResponse } from './types'

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: async () => {
      const response = await api.get<UserSearchResponse>(
        '/api/v1/users/search',
        { params: { nickname: query } }
      )
      return response.data
    },
    enabled: query.length > 0,
    staleTime: 30_000,
  })
}
