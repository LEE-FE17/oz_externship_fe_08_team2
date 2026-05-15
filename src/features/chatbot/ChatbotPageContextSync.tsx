import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useChatbotStore } from '@/stores/chatbotStore'

// URL 라우트에서 질문 ID를 추출하여 chatbotStore에 동기화
export function ChatbotPageContextSync() {
  const { pathname } = useLocation()
  const setCurrentPageQuestionId = useChatbotStore(
    (s) => s.setCurrentPageQuestionId
  )
  const close = useChatbotStore((s) => s.close)
  const isOpen = useChatbotStore((s) => s.isOpen)
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    const match = pathname.match(/^\/qna\/(\d+)$/)
    const questionId = match ? Number(match[1]) : null
    setCurrentPageQuestionId(questionId)

    // 페이지 이동 시 챗봇 위젯 닫기
    if (prevPathnameRef.current !== pathname && isOpen) {
      close()
    }
    prevPathnameRef.current = pathname
  }, [pathname, setCurrentPageQuestionId, close, isOpen])

  return null
}
