import { http, HttpResponse } from 'msw'
import type { UserSearchResponse } from './types'

const mockUsers = [
  { id: 1, nickname: '오즈원', profile_img_url: null },
  { id: 2, nickname: '오즈투', profile_img_url: null },
  { id: 3, nickname: '오즈쓰리3', profile_img_url: null },
  { id: 4, nickname: '오늘밥은', profile_img_url: null },
  { id: 5, nickname: 'user1', profile_img_url: null },
  { id: 6, nickname: 'user2', profile_img_url: null },
  { id: 7, nickname: '테스트유저', profile_img_url: null },
]

export const userSearchHandlers = [
  http.get('/api/v1/users/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('nickname') ?? ''

    const results = mockUsers.filter((u) =>
      u.nickname.toLowerCase().includes(query.toLowerCase())
    )

    const response: UserSearchResponse = { results }
    return HttpResponse.json(response)
  }),
]
