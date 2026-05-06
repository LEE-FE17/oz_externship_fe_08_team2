import { http, HttpResponse } from 'msw'
import { categoriesHandlers } from '@/features/posts/categories'
import { postListHandlers } from '@/features/posts/list'
import { postListHandlers } from '@/features/posts/list/handler'
import { writeHandlers } from '@/features/posts/write'
import { postDetailHandlers } from '@/features/posts/detail'
import { editHandlers } from '@/features/posts/edit'
import { postLikeHandlers } from '@/features/posts/like'
import { postDeleteHandlers } from '@/features/posts/delete'
import { commentsHandlers } from '@/features/posts/comments'
import { userSearchHandlers } from '@/features/accounts/user-search'

// categories → list → detail 순서: /posts/categories, /posts/가 /posts/:postId보다 먼저 매칭되어야 함
export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('/api/v1/accounts/me/', () => {
    return HttpResponse.json({
      id: 99,
      nickname: '테스트유저',
      email: 'test@example.com',
      profile_img_url: null,
    })
  }),
  ...categoriesHandlers,
  ...postListHandlers,
  ...writeHandlers,
  ...postDetailHandlers,
  ...editHandlers,
  ...commentsHandlers,
  ...postLikeHandlers,
  ...postDeleteHandlers,
  ...userSearchHandlers,
]
