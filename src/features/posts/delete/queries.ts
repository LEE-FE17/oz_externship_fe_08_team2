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
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] })
      queryClient.removeQueries({
        queryKey: ['posts', 'detail', postId],
      })
    },
  })
}
