import type { ChatMessage } from '@/features/chatbot/widgetTypes'

interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  message?: string
  content?: string
  id?: string | number
}

export function mapHistoryToMessages(
  results: ChatHistoryMessage[],
  idPrefix: string
): ChatMessage[] {
  return results.map((item, index) => ({
    id: item.id?.toString() ?? `${idPrefix}-history-${index}`,
    role: item.role,
    message: item.message ?? item.content ?? '',
  }))
}
