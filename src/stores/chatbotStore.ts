import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ChatbotView } from '@/features/chatbot/widgetTypes'

interface ChatbotState {
  isOpen: boolean
  currentView: ChatbotView
  activeQnaQuestionId: number | null
  currentPageQuestionId: number | null
  firstAnswerFromProps: string | null
  questionTitle: string | null
  qnaLimitExceededIds: Set<number>

  open: () => void
  close: () => void
  toggle: () => void
  setView: (view: ChatbotView) => void
  setCurrentPageQuestionId: (id: number | null) => void
  enterQna: (params: {
    questionId: number
    questionTitle?: string | null
    firstAnswer?: string | null
  }) => void
  markQnaLimitExceeded: (questionId: number) => void
  clearQnaLimitExceeded: (questionId: number) => void
}

export const useChatbotStore = create<ChatbotState>()(
  devtools(
    (set, get) => ({
      isOpen: false,
      currentView: 'cs',
      activeQnaQuestionId: null,
      currentPageQuestionId: null,
      firstAnswerFromProps: null,
      questionTitle: null,
      qnaLimitExceededIds: new Set<number>(),

      open: () =>
        set({ isOpen: true, currentView: 'cs' }, undefined, 'chatbot/open'),

      close: () =>
        set(
          {
            isOpen: false,
            currentView: 'cs',
            activeQnaQuestionId: null,
            firstAnswerFromProps: null,
            questionTitle: null,
          },
          undefined,
          'chatbot/close'
        ),

      toggle: () => {
        if (get().isOpen) {
          get().close()
        } else {
          get().open()
        }
      },

      setView: (view) =>
        set({ currentView: view }, undefined, 'chatbot/setView'),

      setCurrentPageQuestionId: (id) =>
        set(
          { currentPageQuestionId: id },
          undefined,
          'chatbot/setCurrentPageQuestionId'
        ),

      enterQna: ({ questionId, questionTitle, firstAnswer }) =>
        set(
          {
            isOpen: true,
            currentView: 'qna',
            activeQnaQuestionId: questionId,
            questionTitle: questionTitle ?? null,
            firstAnswerFromProps: firstAnswer ?? null,
          },
          undefined,
          'chatbot/enterQna'
        ),

      markQnaLimitExceeded: (questionId) => {
        const current = get().qnaLimitExceededIds
        // 이미 포함되어 있으면 새 Set을 만들지 않음 (무한 리렌더 방지)
        if (current.has(questionId)) return
        const next = new Set(current)
        next.add(questionId)
        set(
          { qnaLimitExceededIds: next },
          undefined,
          'chatbot/markQnaLimitExceeded'
        )
      },

      clearQnaLimitExceeded: (questionId) => {
        const current = get().qnaLimitExceededIds
        // 포함되어 있지 않으면 새 Set을 만들지 않음 (무한 리렌더 방지)
        if (!current.has(questionId)) return
        const next = new Set(current)
        next.delete(questionId)
        set(
          { qnaLimitExceededIds: next },
          undefined,
          'chatbot/clearQnaLimitExceeded'
        )
      },
    }),
    { name: 'ChatbotStore' }
  )
)
