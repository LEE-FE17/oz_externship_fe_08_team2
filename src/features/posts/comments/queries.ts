import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/api/instance'
import type { Comment, CommentsResponse, CommentSubmitRequest } from './types'

const PAGE_SIZE = 10

export function useCommentsInfiniteQuery(
  postId: number,
  ordering: 'latest' | 'oldest' = 'latest',
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: ['posts', postId, 'comments', ordering],
    queryFn: async ({ pageParam }) => {
      const response = await api.get<CommentsResponse>(
        `/api/v1/posts/${postId}/comments`,
        {
          params: {
            page: pageParam,
            page_size: PAGE_SIZE,
            ordering: ordering === 'latest' ? '-created_at' : 'created_at',
          },
        }
      )
      return response.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined
      const url = new URL(lastPage.next)
      const nextPage = url.searchParams.get('page')
      return nextPage ? Number(nextPage) : undefined
    },
    enabled,
  })
}

export function useSubmitComment(postId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CommentSubmitRequest) => {
      const response = await api.post<Comment>(
        `/api/v1/posts/${postId}/comments`,
        body
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId, 'comments'] })
    },
  })
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/api/v1/posts/${postId}/comments/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId, 'comments'] })
    },
  })
}
