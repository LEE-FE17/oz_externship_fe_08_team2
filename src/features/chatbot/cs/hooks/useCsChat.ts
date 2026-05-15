import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSSEAbort } from '@/features/chatbot/hooks/useSSEAbort'
import { mapHistoryToMessages } from '@/features/chatbot/utils/mapHistory'
import { sendStreamingMessage } from '@/features/chatbot/hooks/sendStreamingMessage'
import { useGetCsHistory, CS_HISTORY_QUERY_KEY } from '../queries'
import type { ChatMessage } from '@/features/chatbot/widgetTypes'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'cs-welcome',
  role: 'assistant',
  message: '안녕하세요. 무엇을 도와드릴까요?',
}

export function useCsChat() {
  const [localMessages, setLocalMessages] = useState<ChatMessage[] | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const { reset, abort } = useSSEAbort()
  const queryClient = useQueryClient()
  const { data: historyData, isLoading, isError, refetch } = useGetCsHistory()

  const historyMessages = (() => {
    if (!historyData) return []
    const results = historyData.results ?? []
    return results.length === 0
      ? [WELCOME_MESSAGE]
      : mapHistoryToMessages(results, 'cs')
  })()

  const messages = localMessages ?? historyMessages

  const sendMessage = async (text: string): Promise<void> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
    await sendStreamingMessage({
      text,
      endpoint: `${baseUrl}/qna/chatbot/completions`,
      idPrefix: 'cs',
      isBlocked: isStreaming,
      reset,
      abort,
      setMessages: (action) => {
        setLocalMessages((prev) => {
          const base = prev ?? historyMessages
          return typeof action === 'function' ? action(base) : action
        })
      },
      setIsStreaming,
      queryClient,
      invalidateQueryKeys: [[...CS_HISTORY_QUERY_KEY]],
    })
  }

  return {
    messages,
    isStreaming,
    isLoading,
    isError,
    refetch: async () => {
      setLocalMessages(null)
      await refetch()
    },
    sendMessage,
    abort,
  }
}
