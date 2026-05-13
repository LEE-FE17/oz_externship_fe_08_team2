import { http, HttpResponse } from 'msw'
import { postMockStore, MOCK_CATEGORIES } from '../mockStore'

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
    const categoryId = Number(body.category_id)
    const category = MOCK_CATEGORIES.find((c) => c.id === categoryId)

    // postMockStore에 있는 게시글이면 업데이트
    const existing = postMockStore.get(postId)
    if (existing) {
      postMockStore.posts.set(postId, {
        ...existing,
        title: body.title as string,
        content: body.content as string,
        category_id: categoryId,
        category_name: category?.name ?? existing.category_name,
        updated_at: new Date().toISOString(),
      })
    }

    return HttpResponse.json({
      id: postId,
      title: body.title as string,
      content: body.content as string,
      category: { id: categoryId, name: category?.name ?? '자유 게시판' },
    })
  }),
]
