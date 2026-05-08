import { http, HttpResponse } from 'msw'

export const logoutHandlers = [
  http.post('/api/v1/accounts/logout', () => {
    return HttpResponse.json({ detail: '로그아웃 되었습니다.' })
  }),
]
