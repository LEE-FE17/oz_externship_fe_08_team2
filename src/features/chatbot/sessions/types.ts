// GET /api/v1/qna/ai-answer/sessions/ — swagger.yaml AiAnswerSessionItem 기준

/** GET /api/v1/qna/ai-answer/sessions/ 응답 내 개별 세션 */
export interface ChatSession {
  question_id: number
  last_message: string
  role: 'user' | 'assistant'
  created_at: string
}

/** GET /api/v1/qna/ai-answer/sessions/ 응답 */
export interface ChatSessionListResponse {
  results: ChatSession[]
}
