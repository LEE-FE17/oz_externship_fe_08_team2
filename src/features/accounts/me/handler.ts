import { http, HttpResponse } from 'msw'
import { apiUrl } from '@/mocks/url'
import type { MeResponse } from './types'

export const meHandlers = [
  http.get(apiUrl('/api/v1/accounts/me'), ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json<MeResponse>({
      id: 99,
      nickname: '테스트유저',
      email: 'test@example.com',
      profile_img_url: null,
      role: 'USER',
    })
  }),

  http.post(apiUrl('/api/v1/accounts/me/refresh'), () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return HttpResponse.json({ detail: 'No refresh token' }, { status: 401 })
    }
    return HttpResponse.json({ access_token: 'mock-refreshed-token' })
  }),
]
