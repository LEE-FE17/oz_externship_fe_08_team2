import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/instance'
import type { PostLikeResponse } from './types'
import type { PostDetailResponse } from '../detail/types'

export const useTogglePostLike = (postId: number) => {
  const queryClient = useQueryClient()
  const queryKey = ['posts', 'detail', postId]

  return useMutation({
    mutationFn: async (isCurrentlyLiked: boolean) => {
      const { data } = isCurrentlyLiked
        ? await api.delete<PostLikeResponse>(`/api/v1/posts/${postId}/like`)
        : await api.post<PostLikeResponse>(`/api/v1/posts/${postId}/like`)
      return data
    },
    onMutate: async (isCurrentlyLiked: boolean) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PostDetailResponse>(queryKey)
      queryClient.setQueryData<PostDetailResponse>(queryKey, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          is_liked: !isCurrentlyLiked,
          like_count: isCurrentlyLiked
            ? prev.like_count - 1
            : prev.like_count + 1,
        }
      })
      return { previous }
    },
    onError: (_err, _isCurrentlyLiked, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
