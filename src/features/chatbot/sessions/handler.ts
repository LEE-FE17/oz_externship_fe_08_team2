import { http, HttpResponse } from 'msw'
import type { ChatSessionListResponse } from './types'

// swagger.yaml AiAnswerSessionItem 스키마 기준
const mockSessions: ChatSessionListResponse = {
  // 빈 배열 테스트 시 아래 주석 해제:
  // results: [],
  results: [
    {
      question_id: 42,
      last_message: 'select_related는 JOIN을 사용하여 최적화합니다...',
      role: 'assistant',
      created_at: '2026-04-23T14:30:05',
    },
    {
      question_id: 55,
      last_message: 'JWT는 Header, Payload...',
      role: 'assistant',
      created_at: '2026-04-23T14:30:05',
    },
  ],
}

export const sessionsHandlers = [
  http.get('*/qna/ai-answer/sessions', () => {
    return HttpResponse.json(mockSessions)
  }),
]
