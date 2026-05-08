import { delay, http, HttpResponse } from 'msw'
import { postMockStore } from '../mockStore'
import type { PostDeleteResponse } from './types'

export const postDeleteHandlers = [
  http.delete('/api/v1/posts/:post_id', async ({ params }) => {
    await delay(300)
    postMockStore.remove(Number(params.post_id))
    const body: PostDeleteResponse = {
      detail: '게시글이 삭제되었습니다.',
    }
    return HttpResponse.json(body)
  }),
]
