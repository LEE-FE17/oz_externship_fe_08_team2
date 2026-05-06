import { http, HttpResponse } from 'msw'
import { postMockStore } from '../mockStore'

export const writeHandlers = [
  http.post('/api/v1/posts', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (!body.title || !body.content || !body.category_id) {
      return HttpResponse.json(
        { error_detail: { title: ['이 필드는 필수 항목입니다.'] } },
        { status: 400 }
      )
    }
    const pk = postMockStore.add({
      title: body.title as string,
      content: body.content as string,
      category_id: Number(body.category_id),
    })
    return HttpResponse.json(
      { detail: '게시글이 성공적으로 등록되었습니다.', pk },
      { status: 201 }
    )
  }),

  http.post('/api/v1/posts/presigned-url', async ({ request }) => {
    const body = (await request.json()) as { file_name?: string }
    const fileName = body.file_name ?? 'image.png'
    return HttpResponse.json({
      presigned_url: `http://localhost:5173/api/mock-s3/${encodeURIComponent(fileName)}`,
      img_url: `https://picsum.photos/seed/${encodeURIComponent(fileName)}/400/300`,
      key: `uploads/images/posts/${fileName}`,
    })
  }),

  // MSW가 mock S3 PUT 요청도 가로채서 성공 처리
  http.put('http://localhost:5173/api/mock-s3/:fileName', () => {
    return new HttpResponse(null, { status: 200 })
  }),
]
