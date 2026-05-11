import { http, HttpResponse } from 'msw'
import { apiUrl } from '@/mocks/url'

export const logoutHandlers = [
  http.post(apiUrl('/api/v1/accounts/logout'), () => {
    return HttpResponse.json({ detail: '로그아웃 되었습니다.' })
  }),
]
