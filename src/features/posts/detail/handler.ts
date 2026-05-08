import { delay, http, HttpResponse } from 'msw'
import type { PostDetailResponse } from './types'
import { likeMockStore, postMockStore } from '../mockStore'

const dummyPostBase = {
  author: {
    id: 1,
    nickname: 'testuser',
    profile_img_url: 'https://example.com/profile.png',
  },
  category_id: 3,
  category_name: '자유 게시판',
  title: '테스트 게시글',
  content: '게시글 내용입니다.',
  view_count: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  comment_count: 5,
}

export const postDetailHandlers = [
  http.get('/api/v1/posts/:post_id', async ({ params }) => {
    await delay(300)
    const postId = Number(params.post_id)

    // 새로 작성된 게시글은 postMockStore에서 실제 데이터를 반환
    const stored = postMockStore.get(postId)
    if (stored) {
      return HttpResponse.json({
        ...stored,
        // 유저가 좋아요 액션을 취한 경우에만 likeMockStore 우선, 아니면 저장된 값(0) 유지
        like_count: likeMockStore.likeCountMap.has(postId)
          ? likeMockStore.getLikeCount(postId)
          : stored.like_count,
        is_liked: likeMockStore.getIsLiked(postId),
      })
    }

    // 기존 mock 게시글은 dummyPostBase 반환
    const response: PostDetailResponse = {
      ...dummyPostBase,
      id: postId,
      like_count: likeMockStore.getLikeCount(postId),
      is_liked: likeMockStore.getIsLiked(postId),
    }
    return HttpResponse.json(response)
  }),
]
