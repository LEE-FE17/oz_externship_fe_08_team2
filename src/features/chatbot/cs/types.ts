// TODO: FEATURES.md와 API 명세 충돌, FN-CS PDF 기준 적용 (93번 POST, 94번 GET)

// POST /api/v1/chatbot/completions 요청 바디
export interface CsCompletionRequest {
  message: string
}

// GET /api/v1/chatbot/completions 응답
export interface CsHistoryResponse {
  results: CsHistoryMessage[]
}

// 히스토리 개별 메시지 (API 응답 타입)
// 실제 API에서 message/content 필드명이 다를 수 있으므로 방어적 처리
export interface CsHistoryMessage {
  role: 'user' | 'assistant'
  message?: string
  content?: string
  id?: string | number
  created_at?: string
}

// SSE chunk
export interface CsSseChunk {
  message: string
}
