import { ChatbotHeader } from '@/components/chatbot/ChatbotHeader'
import { useShallow } from 'zustand/react/shallow'
import { useChatbotStore } from '@/stores/chatbotStore'
import { useGetSessions } from '@/features/chatbot/sessions'
import type { ChatSession } from '@/features/chatbot/sessions'
import { getRelativeTime } from '@/utils/relativeTime'
import { ChatbotRobotImage } from '@/components/chatbot/ChatbotRobotImage'

export function HubView() {
  const { setView, enterQna, close } = useChatbotStore(
    useShallow((s) => ({
      setView: s.setView,
      enterQna: s.enterQna,
      close: s.close,
    }))
  )
  const { data, isLoading, isFetching, isError, refetch } = useGetSessions()
  const isRefreshingSessions = isLoading || isFetching

  const handleCsClick = () => {
    setView('cs')
  }

  const handleSessionClick = (session: ChatSession) => {
    // sessions 응답에는 questionTitle/firstAnswer가 없음 — 진입 후 history fallback이 처리
    enterQna({
      questionId: session.question_id,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <ChatbotHeader
        title="AI OZ 챗봇"
        subtitle=""
        showBack={false}
        onClose={close}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
        {/* CS 항목 — 항상 최상단 */}
        <button
          type="button"
          onClick={handleCsClick}
          className="flex items-center gap-4 px-4 py-[18px] text-left transition-colors hover:bg-gray-50"
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
            style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}
          >
            <ChatbotRobotImage className="h-[42px] w-[42px] object-contain" />
          </div>
          <p className="min-w-0 flex-1 truncate text-[16px] font-medium text-[#121212]">
            AI OZ 시스템 챗봇
          </p>
        </button>

        <div className="border-t border-[#E8E8E8]" />

        {/* Q&A 세션 목록 */}
        {isRefreshingSessions && (
          <div className="flex items-center justify-center py-6">
            <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-text-muted text-sm">
              Q&A 목록을 불러오지 못했습니다
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-text-body rounded-lg border border-gray-200 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isRefreshingSessions &&
          !isError &&
          data?.results?.map((session) => (
            <div key={session.question_id}>
              <button
                type="button"
                onClick={() => handleSessionClick(session)}
                className="flex w-full items-start gap-4 px-4 py-[18px] text-left transition-colors hover:bg-gray-50"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
                  style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}
                >
                  <ChatbotRobotImage className="h-[42px] w-[42px] object-contain" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-[16px] font-medium text-[#121212]">
                    질의응답 챗봇
                  </p>
                  {session.last_message && (
                    <p className="truncate text-[13px] text-[#707070]">
                      {session.last_message}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[13px] text-[#9D9D9D]">
                  {getRelativeTime(session.created_at)}
                </span>
              </button>
              <div className="border-t border-[#E8E8E8]" />
            </div>
          ))}
      </div>
    </div>
  )
}
