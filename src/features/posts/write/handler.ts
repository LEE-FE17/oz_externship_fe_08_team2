import { http, HttpResponse } from 'msw'
import { apiUrl } from '@/mocks/url'
import { postMockStore } from '../mockStore'

const mockS3Store = new Map<
  string,
  { data: ArrayBuffer; contentType: string }
>()

export const writeHandlers = [
  http.post(apiUrl('/api/v1/posts/'), async ({ request }) => {
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

  http.post(apiUrl('/api/v1/posts/presigned-url'), async ({ request }) => {
    const body = (await request.json()) as { file_name?: string }
    const fileName = body.file_name ?? 'image.png'
    const encoded = encodeURIComponent(fileName)
    return HttpResponse.json({
      presigned_url: `http://localhost:5173/api/mock-s3/${encoded}`,
      img_url: `http://localhost:5173/api/mock-s3/${encoded}`,
      key: `uploads/images/posts/${fileName}`,
    })
  }),

  http.put(
    'http://localhost:5173/api/mock-s3/:fileName',
    async ({ request, params }) => {
      const data = await request.arrayBuffer()
      const contentType = request.headers.get('Content-Type') ?? 'image/png'
      mockS3Store.set(params.fileName as string, { data, contentType })
      return new HttpResponse(null, { status: 200 })
    }
  ),

  http.get('http://localhost:5173/api/mock-s3/:fileName', ({ params }) => {
    const entry = mockS3Store.get(params.fileName as string)
    if (!entry) return new HttpResponse(null, { status: 404 })
    return new HttpResponse(entry.data, {
      status: 200,
      headers: { 'Content-Type': entry.contentType },
    })
  }),
]
