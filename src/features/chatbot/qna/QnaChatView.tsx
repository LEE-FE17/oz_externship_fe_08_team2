import { ChatbotHeader } from '@/components/chatbot/ChatbotHeader'
import { MessageList } from '@/components/chatbot/MessageList'
import { ChatInput } from '@/components/chatbot/ChatInput'
import { useShallow } from 'zustand/react/shallow'
import { useChatbotStore } from '@/stores/chatbotStore'
import { useQnaChat } from './hooks/useQnaChat'

interface QnaChatViewProps {
  questionId: number
}

export function QnaChatView({ questionId }: QnaChatViewProps) {
  const {
    messages,
    isStreaming,
    isLoading,
    isError,
    isLimitExceeded,
    isReadOnly,
    refetch,
    sendMessage,
    abort,
  } = useQnaChat({ questionId })

  const { setView, close } = useChatbotStore(
    useShallow((s) => ({ setView: s.setView, close: s.close }))
  )

  const handleBack = () => {
    abort()
    setView('hub')
  }

  const handleClose = () => {
    abort()
    close()
  }

  const getPlaceholder = () => {
    if (isReadOnly) return '질문을 이어서 하려면 상세 페이지로 이동해주세요'
    if (isLimitExceeded) return '추가 질문 횟수를 모두 사용했습니다'
    if (isStreaming) return '응답 중입니다...'
    if (isError) return '대화를 불러온 뒤 이용할 수 있습니다'
    return '더 궁금한 것이 있다면 이어서 질문해 보세요.'
  }

  const getDisabledReason = () => {
    if (isReadOnly) return 'readonly' as const
    if (isLimitExceeded) return 'limit' as const
    if (isStreaming) return 'streaming' as const
    if (isLoading) return 'loading' as const
    return undefined
  }

  return (
    <div className="flex h-full flex-col">
      <ChatbotHeader
        title="질의응답 챗봇"
        subtitle="추가 질문은 최대 5회까지 가능하며, 대화 기록은 30분 동안 유지됩니다."
        showBack
        onBack={handleBack}
        onClose={handleClose}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-text-muted text-sm">
              대화를 불러오지 못했습니다
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-text-body hover:bg-bg-muted rounded-lg border border-gray-200 px-4 py-2 text-sm transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {isLimitExceeded && (
        <div className="border-t border-yellow-200 bg-yellow-50 px-4 py-2 text-center text-xs text-yellow-700">
          이 질문의 추가 질문 횟수(5회)를 초과했습니다. 더 필요한 질문은 질문
          게시판을 이용해주세요
        </div>
      )}

      <ChatInput
        onSend={sendMessage}
        disabled={
          isStreaming || isLoading || isError || isLimitExceeded || isReadOnly
        }
        disabledReason={getDisabledReason()}
        placeholder={getPlaceholder()}
      />
    </div>
  )
}
