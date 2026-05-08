import { http, HttpResponse } from 'msw'
import { postMockStore } from '../mockStore'

export const editHandlers = [
  http.put('/api/v1/posts/:postId', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (!body.title || !body.content || !body.category_id) {
      return HttpResponse.json(
        { error_detail: { title: ['이 필드는 필수 항목입니다.'] } },
        { status: 400 }
      )
    }
    const postId = Number(params.postId)
    postMockStore.update(postId, {
      title: body.title as string,
      content: body.content as string,
      category_id: Number(body.category_id),
    })
    return HttpResponse.json({
      id: postId,
      title: body.title as string,
      content: body.content as string,
      category: { id: body.category_id as number, name: '자유 게시판' },
    })
  }),
]
