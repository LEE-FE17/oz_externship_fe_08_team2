// 챗봇 위젯 UI 공통 타입

export type ChatbotView = 'hub' | 'cs' | 'qna'

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  message: string
}

export type ChatInputDisabledReason =
  | 'streaming'
  | 'limit'
  | 'readonly'
  | 'loading'
