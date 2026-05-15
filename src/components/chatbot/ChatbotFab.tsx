import { useShallow } from 'zustand/react/shallow'
import { useChatbotStore } from '@/stores/chatbotStore'
import { useAuthStore } from '@/stores/authStore'
import { ChatbotRobotImage } from './ChatbotRobotImage'

export function ChatbotFab() {
  const { isOpen, toggle } = useChatbotStore(
    useShallow((s) => ({ isOpen: s.isOpen, toggle: s.toggle }))
  )
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return null

  return (
    <button
      type="button"
      aria-label={isOpen ? 'AI 챗봇 닫기' : 'AI 챗봇 열기'}
      aria-expanded={isOpen}
      aria-controls={isOpen ? 'chatbot-widget' : undefined}
      onClick={toggle}
      className="fixed right-6 bottom-6 z-50 flex h-[78px] w-[78px] items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
      style={{
        backgroundColor: '#E7D5FF',
        boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
      }}
    >
      {isOpen ? (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 6L6 18"
            stroke="#58249D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 6L18 18"
            stroke="#58249D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <ChatbotRobotImage className="h-[52px] w-[49px] object-contain" />
      )}
    </button>
  )
}
