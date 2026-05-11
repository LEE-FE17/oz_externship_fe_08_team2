import { useQuery } from '@tanstack/react-query'
import api from '@/api/instance'
import type { PostListParams, PostListResponse } from './types'

export function usePostList(params: PostListParams = {}) {
  return useQuery({
    queryKey: ['posts', 'list', params],
    queryFn: async () => {
      const { data } = await api.get<PostListResponse>(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/posts/`,
        { params }
      )
      return data
    },
    staleTime: 60_000,
  })
}
