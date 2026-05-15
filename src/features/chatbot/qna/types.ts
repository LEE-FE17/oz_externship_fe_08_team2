// QNA 챗봇 API 타입 정의

// GET /api/v1/qna/questions/{questionId}/ai-answer 응답
export interface QnaHistoryResponse {
  results: QnaHistoryMessage[]
}

// 히스토리 개별 메시지 (API 응답 타입)
// 실제 API에서 message/content 필드명이 다를 수 있으므로 방어적 처리
export interface QnaHistoryMessage {
  role: 'user' | 'assistant'
  message?: string
  content?: string
  id?: string | number
}

// SSE chunk
export interface QnaSseChunk {
  message: string
}
