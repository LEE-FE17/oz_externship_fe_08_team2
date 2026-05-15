import { useState } from 'react'
import type { ChatInputDisabledReason } from '@/features/chatbot/widgetTypes'
import { SendHorizontal } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  disabledReason?: ChatInputDisabledReason // 추후 disabled 사유별 UI 분기 시 사용
  placeholder?: string
  notice?: string
  /** 글자수 카운터 최대값 — Figma 기준 1000 */
  maxLength?: number
}

const DEFAULT_MAX_LENGTH = 1000

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '더 궁금한 것이 있다면 이어서 질문해 보세요.',
  notice,
  maxLength = DEFAULT_MAX_LENGTH,
}: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const length = value.length
  const canSend = !disabled && value.trim().length > 0

  return (
    <div
      className="border-t border-[#CECECE] px-3 py-3"
      style={{ backgroundColor: '#F2F2F7' }}
    >
      {notice && (
        <p id="chatbot-input-notice" className="text-text-muted mb-2 text-xs">
          {notice}
        </p>
      )}

      {/* 흰 박스: 입력 영역 + 카운터 + 전송 */}
      <div className="rounded-md border border-[#CECECE] bg-white px-3 pt-3 pb-2">
        <textarea
          id="chatbot-message-input"
          value={value}
          onChange={(e) => {
            const next = e.target.value
            setValue(next.length > maxLength ? next.slice(0, maxLength) : next)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="메시지 입력"
          aria-disabled={disabled || undefined}
          aria-describedby={notice ? 'chatbot-input-notice' : undefined}
          rows={2}
          maxLength={maxLength}
          className="w-full resize-none border-0 bg-transparent text-[14px] leading-[20px] tracking-[-0.57px] text-[#121212] placeholder:text-[#9D9D9D] focus:outline-none disabled:text-[#9D9D9D]"
        />

        {/* 하단 우측: 카운터 + 전송 */}
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-[12px] leading-[18px] tracking-[-0.36px]">
            <span className="text-[#6201E0]">{length}</span>
            <span className="text-[#9D9D9D]">/{maxLength}</span>
          </span>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="메시지 전송"
            aria-disabled={!canSend || undefined}
            className="ml-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[#6201E0] transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <SendHorizontal size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
