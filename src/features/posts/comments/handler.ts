import { http, HttpResponse, delay } from 'msw'
import type { CommentsResponse } from './types'

// user-search 핸들러의 목 유저 목록과 동일하게 유지
const MOCK_USERS = [
  { id: 1, nickname: '오즈원' },
  { id: 2, nickname: '오즈투' },
  { id: 3, nickname: '오즈쓰리3' },
  { id: 4, nickname: '오늘밥은' },
  { id: 5, nickname: 'user1' },
  { id: 6, nickname: 'user2' },
  { id: 7, nickname: '테스트유저' },
]

function extractTaggedUsers(content: string) {
  const mentions = [...content.matchAll(/@(\S+)/g)].map((m) => m[1])
  return MOCK_USERS.filter((u) => mentions.includes(u.nickname))
}

const seedComments = Array.from({ length: 25 }, (_, i) => {
  // 짝수 인덱스는 테스트유저(id:99) 댓글로 시드 → 삭제 버튼 테스트용
  const isTestUser = i % 4 === 0
  return {
    id: i + 1,
    author: isTestUser
      ? { id: 99, nickname: '테스트유저', profile_img_url: null }
      : {
          id: (i % 5) + 1,
          nickname: `user${(i % 5) + 1}`,
          profile_img_url: null,
        },
    tagged_users: i % 3 === 0 ? [{ id: 2, nickname: 'user2' }] : [],
    content:
      i % 3 === 0
        ? `@user2 댓글 내용 ${i + 1}번째 댓글입니다.`
        : `일반 댓글 내용 ${i + 1}번째 댓글입니다.`,
    created_at: new Date(Date.now() - i * 60_000).toISOString(),
    updated_at: new Date(Date.now() - i * 60_000).toISOString(),
  }
})

// 런타임에 추가된 댓글을 누적하는 배열 (최신순: 앞에 추가)
const mockComments = [...seedComments]

export const commentsHandlers = [
  http.post('/api/v1/posts/:postId/comments', async ({ params, request }) => {
    const { postId } = params
    if (postId === '999') {
      return HttpResponse.json(
        { error_detail: '해당 게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    const body = (await request.json()) as { content: string }
    const newComment = {
      id: Date.now(),
      author: { id: 99, nickname: '테스트유저', profile_img_url: null },
      tagged_users: extractTaggedUsers(body.content),
      content: body.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockComments.unshift(newComment)
    return HttpResponse.json(newComment, { status: 201 })
  }),

  http.delete(
    '/api/v1/posts/:postId/comments/:commentId',
    async ({ params }) => {
      const { postId, commentId } = params
      if (postId === '999') {
        return HttpResponse.json(
          { error_detail: '해당 게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      const idx = mockComments.findIndex((c) => c.id === Number(commentId))
      if (idx === -1) {
        return HttpResponse.json(
          { error_detail: '해당 댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      mockComments.splice(idx, 1)
      return HttpResponse.json({ detail: '댓글이 삭제되었습니다.' })
    }
  ),

  http.get('/api/v1/posts/:postId/comments', async ({ params, request }) => {
    await delay(1000)
    const { postId } = params

    if (postId === '999') {
      return HttpResponse.json(
        { error_detail: '해당 게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('page_size') ?? 10)
    const ordering = url.searchParams.get('ordering') ?? '-created_at'

    const sorted = [...mockComments].sort((a, b) => {
      const diff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return ordering === 'created_at' ? diff : -diff
    })

    const total = sorted.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const results = sorted.slice(start, end)
    const hasNext = end < total

    const response: CommentsResponse = {
      count: total,
      next: hasNext
        ? `http://localhost:5173/api/v1/posts/${postId}/comments?page=${page + 1}&page_size=${pageSize}`
        : null,
      previous:
        page > 1
          ? `http://localhost:5173/api/v1/posts/${postId}/comments?page=${page - 1}&page_size=${pageSize}`
          : null,
      results,
    }

    return HttpResponse.json(response)
  }),
]
