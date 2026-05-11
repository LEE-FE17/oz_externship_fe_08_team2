import { http, HttpResponse } from 'msw'
import { apiUrl } from '@/mocks/url'
import type { PostLikeResponse } from './types'
import { likeMockStore } from '../mockStore'

export const postLikeHandlers = [
  http.post(apiUrl('/api/v1/posts/:post_id/like'), ({ params }) => {
    const postId = Number(params.post_id)
    const newCount = likeMockStore.getLikeCount(postId) + 1
    likeMockStore.likeCountMap.set(postId, newCount)
    likeMockStore.isLikedMap.set(postId, true)
    const body: PostLikeResponse = {
      detail: '좋아요가 추가되었습니다.',
      post_id: postId,
      is_liked: true,
      like_count: newCount,
    }
    return HttpResponse.json(body)
  }),
  http.delete(apiUrl('/api/v1/posts/:post_id/like/cancel'), ({ params }) => {
    const postId = Number(params.post_id)
    const newCount = Math.max(0, likeMockStore.getLikeCount(postId) - 1)
    likeMockStore.likeCountMap.set(postId, newCount)
    likeMockStore.isLikedMap.set(postId, false)
    const body: PostLikeResponse = {
      detail: '좋아요가 취소되었습니다.',
      post_id: postId,
      is_liked: false,
      like_count: newCount,
    }
    return HttpResponse.json(body)
  }),
]
