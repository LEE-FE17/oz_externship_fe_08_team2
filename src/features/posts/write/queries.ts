import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/instance'
import type {
  CreatePostRequest,
  CreatePostResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from './types'

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreatePostRequest) => {
      const { data } = await api.post<CreatePostResponse>('/api/v1/posts', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] })
    },
  })
}

export function usePresignedUrl() {
  return useMutation({
    mutationFn: async (body: PresignedUrlRequest) => {
      const { data } = await api.post<PresignedUrlResponse>(
        '/api/v1/posts/presigned-url',
        body
      )
      return data
    },
  })
}
