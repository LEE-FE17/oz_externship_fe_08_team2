import { http, HttpResponse } from 'msw'
import { categoriesHandlers } from '@/features/posts/categories'
import { postListHandlers } from '@/features/posts/list'
import { writeHandlers } from '@/features/posts/write'
import { postDetailHandlers } from '@/features/posts/detail'
import { editHandlers } from '@/features/posts/edit'
import { postLikeHandlers } from '@/features/posts/like'
import { postDeleteHandlers } from '@/features/posts/delete'
// import { commentsHandlers } from '@/features/posts/comments'
import { userSearchHandlers } from '@/features/accounts/user-search'
// import { logoutHandlers } from '@/features/accounts/logout'
import { meHandlers } from '@/features/accounts/me'

// categories → list → detail 순서: /posts/categories, /posts/가 /posts/:postId보다 먼저 매칭되어야 함
export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...meHandlers,
  ...categoriesHandlers,
  ...postListHandlers,
  ...writeHandlers,
  ...postDetailHandlers,
  ...editHandlers,
  // ...commentsHandlers,
  ...postLikeHandlers,
  ...postDeleteHandlers,
  ...userSearchHandlers,
  // ...logoutHandlers,
]
