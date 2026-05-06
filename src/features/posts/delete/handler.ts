import { delay, http, HttpResponse } from 'msw'
import type { PostDeleteResponse } from './types'
import { postMockStore } from '../mockStore'

export const postDeleteHandlers = [
  http.delete('/api/v1/posts/:post_id', async ({ params }) => {
    await delay(300)
    const postId = Number(params.post_id)

    if (postId === 999) {
      return HttpResponse.json(
        { error_detail: '해당 게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    postMockStore.posts.delete(postId)

    const body: PostDeleteResponse = {
      detail: '게시글이 삭제되었습니다.',
    }
    return HttpResponse.json(body)
  }),
]
