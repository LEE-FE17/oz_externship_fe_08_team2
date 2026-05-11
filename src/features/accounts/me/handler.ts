import { http, HttpResponse } from 'msw'
import type { MeResponse } from './types'

export const meHandlers = [
  http.get('/api/v1/accounts/me/', () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json<MeResponse>({
      id: 99,
      nickname: '테스트유저',
      email: 'test@example.com',
      profile_img_url: null,
    })
  }),

  http.post('/api/v1/accounts/me/refresh', () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return HttpResponse.json({ detail: 'No refresh token' }, { status: 401 })
    }
    return HttpResponse.json({ access_token: 'mock-refreshed-token' })
  }),
]
