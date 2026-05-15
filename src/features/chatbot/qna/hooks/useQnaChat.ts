import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSSEAbort } from '@/features/chatbot/hooks/useSSEAbort'
import { mapHistoryToMessages } from '@/features/chatbot/utils/mapHistory'
import { sendStreamingMessage } from '@/features/chatbot/hooks/sendStreamingMessage'
import { useGetQnaHistory, QNA_HISTORY_QUERY_KEY } from '../queries'
import { SESSIONS_QUERY_KEY } from '@/features/chatbot/sessions/queries'
import { useShallow } from 'zustand/react/shallow'
import { useChatbotStore } from '@/stores/chatbotStore'
import type { ChatMessage } from '@/features/chatbot/widgetTypes'

/** 1차 답변 해결 로직 — props 우선, 히스토리 첫 assistant fallback */
function resolveInitialMessages(
  mapped: ChatMessage[],
  firstAnswerFromProps: string | null
): ChatMessage[] {
  const hasFirstAnswerInHistory = mapped[0]?.role === 'assistant'
  const resolvedFirstAnswer =
    firstAnswerFromProps ?? (hasFirstAnswerInHistory ? mapped[0].message : null)

  const conversation = hasFirstAnswerInHistory ? mapped.slice(1) : mapped

  const display: ChatMessage[] = []
  if (resolvedFirstAnswer) {
    display.push({
      id: 'qna-first-answer',
      role: 'assistant',
      message: resolvedFirstAnswer,
    })
  }
  display.push(...conversation)
  return display
}

function useQnaChatStoreSelection() {
  return useChatbotStore(
    useShallow((s) => ({
      currentPageQuestionId: s.currentPageQuestionId,
      firstAnswerFromProps: s.firstAnswerFromProps,
      qnaLimitExceededIds: s.qnaLimitExceededIds,
      markQnaLimitExceeded: s.markQnaLimitExceeded,
      clearQnaLimitExceeded: s.clearQnaLimitExceeded,
    }))
  )
}

export function useQnaChat({ questionId }: { questionId: number }) {
  const [localMessages, setLocalMessages] = useState<ChatMessage[] | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const { reset, abort } = useSSEAbort()
  const queryClient = useQueryClient()

  const store = useQnaChatStoreSelection()

  const isReadOnly = questionId !== store.currentPageQuestionId
  const isLimitExceeded = store.qnaLimitExceededIds.has(questionId)

  const {
    data: historyData,
    isLoading,
    isError,
    refetch,
  } = useGetQnaHistory(questionId)

  const historyMessages = (() => {
    if (!historyData || !questionId) return []
    const results = historyData.results ?? []
    const mapped = mapHistoryToMessages(results, 'qna')
    return resolveInitialMessages(mapped, store.firstAnswerFromProps)
  })()

  useEffect(() => {
    if (!historyData) return
    const results = historyData?.results ?? []
    if (results.length === 0) {
      store.clearQnaLimitExceeded(questionId)
    }
  }, [questionId, historyData, store])

  const messages = localMessages ?? historyMessages

  const sendMessage = async (text: string): Promise<void> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
    await sendStreamingMessage({
      text,
      endpoint: `${baseUrl}/qna/questions/${questionId}/chatbot`,
      idPrefix: 'qna',
      isBlocked:
        isStreaming || isReadOnly || isLimitExceeded || isLoading || isError,
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
      invalidateQueryKeys: [
        [...QNA_HISTORY_QUERY_KEY(questionId)],
        [...SESSIONS_QUERY_KEY],
      ],
      onRateLimit: (assistantId) => {
        setLocalMessages((prev) => {
          const base = prev ?? historyMessages
          return base.filter((msg) => msg.id !== assistantId)
        })
        store.markQnaLimitExceeded(questionId)
      },
    })
  }

  const handleRetry = async () => {
    setLocalMessages(null)
    await refetch()
  }

  return {
    messages,
    isStreaming,
    isLoading,
    isError,
    isLimitExceeded,
    isReadOnly,
    refetch: handleRetry,
    sendMessage,
    abort,
  }
}
