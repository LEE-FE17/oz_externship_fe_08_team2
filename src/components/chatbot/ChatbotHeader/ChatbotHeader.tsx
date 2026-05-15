import { useShallow } from 'zustand/react/shallow'
import { useChatbotStore } from '@/stores/chatbotStore'

interface ChatbotHeaderProps {
  title: string
  /** 헤더 하단에 노출되는 부제 — 미지정 시 기본 안내 문구 사용 */
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  onClose?: () => void
}

const DEFAULT_SUBTITLE = '채팅의 대화 기록은 30일 동안 유지됩니다.'

export function ChatbotHeader({
  title,
  subtitle = DEFAULT_SUBTITLE,
  showBack = false,
  onBack,
  onClose,
}: ChatbotHeaderProps) {
  const { setView, close } = useChatbotStore(
    useShallow((s) => ({ setView: s.setView, close: s.close }))
  )

  const handleBack = onBack ?? (() => setView('hub'))
  const handleClose = onClose ?? (() => close())

  return (
    <div
      className="relative flex h-[87px] items-center px-4"
      style={{ backgroundColor: '#58249D' }}
    >
      {/* 좌: 뒤로가기 */}
      {showBack ? (
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로가기"
          className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded text-white transition-opacity hover:opacity-80"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span className="mr-3 w-6 shrink-0" aria-hidden="true" />
      )}

      {/* 중앙: 타이틀 + 부제 */}
      <div className="min-w-0 flex-1">
        <h2
          id="chatbot-title"
          className="truncate text-[20px] leading-[22.5px] font-bold tracking-[-0.684px] text-white"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[10px] leading-[14px] tracking-[-0.3px] text-[#ECECEC]">
            {subtitle}
          </p>
        )}
      </div>

      {/* 우: 닫기 — 우측 상단 정렬 */}
      <button
        id="chatbot-close-button"
        type="button"
        onClick={handleClose}
        aria-label="닫기"
        className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded text-white transition-opacity hover:opacity-80"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
