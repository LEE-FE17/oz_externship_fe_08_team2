import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/instance'
import type { PostDeleteResponse } from './types'

export const useDeletePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (postId: number) => {
      const { data } = await api.delete<PostDeleteResponse>(
        `/api/v1/posts/${postId}`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] })
    },
  })
}
