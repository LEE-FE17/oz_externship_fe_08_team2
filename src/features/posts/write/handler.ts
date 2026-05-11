import { http, HttpResponse } from 'msw'
import { apiUrl } from '@/mocks/url'
import { postMockStore } from '../mockStore'

const mockS3Store = new Map<string, Blob>()

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

  // 업로드된 파일을 메모리에 저장
  http.put(
    'http://localhost:5173/api/mock-s3/:fileName',
    async ({ request, params }) => {
      const blob = await request.blob()
      mockS3Store.set(decodeURIComponent(params.fileName as string), blob)
      return new HttpResponse(null, { status: 200 })
    }
  ),

  // 저장된 파일을 그대로 반환
  http.get('http://localhost:5173/api/mock-s3/:fileName', ({ params }) => {
    const blob = mockS3Store.get(decodeURIComponent(params.fileName as string))
    if (!blob) return new HttpResponse(null, { status: 404 })
    return new HttpResponse(blob, {
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
    })
  }),
]
