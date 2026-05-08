import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/instance'
import type { UpdatePostRequest, UpdatePostResponse } from './types'

export function useUpdatePost(postId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdatePostRequest) => {
      const { data } = await api.put<UpdatePostResponse>(
        `/api/v1/posts/${postId}`,
        body
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['posts', 'detail', Number(postId)],
      })
    },
  })
}
