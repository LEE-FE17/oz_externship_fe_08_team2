import { useState, useRef, useCallback, type ReactNode } from 'react'
import { Toast } from '@/components'
import { useUserSearch } from '@/features/accounts/user-search'
import { UserTagList } from '@/components/community/UserTagList'

interface CommentInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  submitError: boolean
  submitErrorMessage?: string
  onSubmitErrorClose: () => void
}

function getMentionQuery(text: string, cursorPos: number): string | null {
  const textBeforeCursor = text.slice(0, cursorPos)
  const match = textBeforeCursor.match(/@(\S*)$/)
  return match ? match[1] : null
}

function renderHighlighted(
  text: string,
  taggedNicknames: Set<string>
): ReactNode[] {
  const parts = text.split(/(@\S+)/g)
  return parts.map((part, i) => {
    if (/^@\S+$/.test(part)) {
      const nickname = part.slice(1)
      if (taggedNicknames.has(nickname)) {
        return (
          <mark
            key={i}
            style={{
              backgroundColor: '#EDE6FF',
              color: '#6201E0',
              fontWeight: 700,
              borderRadius: '4px',
              padding: '0 2px',
            }}
          >
            {part}
          </mark>
        )
      }
    }
    // 개행 처리
    return part.split('\n').reduce<ReactNode[]>((acc, line, j) => {
      if (j > 0) acc.push(<br key={`br-${i}-${j}`} />)
      acc.push(line)
      return acc
    }, [])
  })
}

// textarea와 동일한 패딩/폰트를 미러 div에 적용하기 위한 공통 스타일
const SHARED_STYLE: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: '14px',
  lineHeight: '1.5',
  padding: '12px 16px 40px 16px', // py-3 px-4 pb-10
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'pre-wrap',
}

export function CommentInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  submitError,
  submitErrorMessage = '댓글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.',
  onSubmitErrorClose,
}: CommentInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [taggedNicknames, setTaggedNicknames] = useState<Set<string>>(new Set())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  const { data: searchData } = useUserSearch(mentionQuery ?? '')

  const syncScroll = useCallback(() => {
    if (mirrorRef.current && textareaRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      const cursor = e.target.selectionStart ?? newValue.length
      setMentionQuery(getMentionQuery(newValue, cursor))
      // 텍스트에서 사라진 태그는 하이라이트 목록에서 제거
      setTaggedNicknames((prev) => {
        const next = new Set(prev)
        for (const nick of prev) {
          if (!newValue.includes(`@${nick}`)) next.delete(nick)
        }
        return next
      })
      syncScroll()
    },
    [onChange, syncScroll]
  )

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        setMentionQuery(null)
        return
      }
      const cursor = textareaRef.current?.selectionStart ?? value.length
      setMentionQuery(getMentionQuery(value, cursor))
    },
    [value]
  )

  const handleSelectUser = useCallback(
    (nickname: string) => {
      const cursor = textareaRef.current?.selectionStart ?? value.length
      const before = value.slice(0, cursor)
      const after = value.slice(cursor)
      const replaced = before.replace(/@(\S*)$/, `@${nickname} `)
      const newValue = replaced + after
      onChange(newValue)
      setMentionQuery(null)
      setTaggedNicknames((prev) => new Set([...prev, nickname]))

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.selectionStart = replaced.length
          textareaRef.current.selectionEnd = replaced.length
        }
      })
    },
    [value, onChange]
  )

  const users = searchData?.results ?? []
  const showDropdown = mentionQuery !== null && users.length > 0

  return (
    <div className="mb-4">
      <Toast
        message={submitErrorMessage}
        variant="error"
        visible={submitError}
        onClose={onSubmitErrorClose}
      />
      <div
        className="relative rounded-lg border transition-colors duration-150"
        style={{ borderColor: isFocused ? '#6201E0' : '#CECECE' }}
      >
        {showDropdown && (
          <UserTagList users={users} onSelect={handleSelectUser} />
        )}

        {/* 하이라이트 미러 — textarea 뒤에 겹쳐서 @태그만 강조 표시 */}
        <div
          ref={mirrorRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
          style={SHARED_STYLE}
        >
          {renderHighlighted(value, taggedNicknames)}
          {/* 스크롤 여백 확보를 위한 더미 */}
          {'\u200b'}
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          onScroll={syncScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            setMentionQuery(null)
          }}
          placeholder="개인정보를 공유 및 요청하거나, 명예 훼손, 무단 광고, 불법 정보 유포 시 모니터링 후 삭제될 수 있습니다."
          rows={2}
          maxLength={500}
          disabled={isSubmitting}
          className="relative w-full resize-none rounded-lg pb-10 text-sm outline-none disabled:opacity-50"
          style={{
            ...SHARED_STYLE,
            whiteSpace: 'pre-wrap',
            background: 'transparent',
            color: 'transparent',
            caretColor: '#121212',
            position: 'relative',
            zIndex: 1,
          }}
        />
        <style>{`textarea::placeholder { color: #CECECE; }`}</style>

        <div className="absolute right-3 bottom-2" style={{ zIndex: 2 }}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-full border text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
            style={
              isFocused || value.trim()
                ? {
                    width: '80px',
                    height: '40px',
                    borderColor: '#6201E0',
                    backgroundColor: '#EFE6FC',
                    color: '#6201E0',
                  }
                : {
                    width: '80px',
                    height: '40px',
                    borderColor: '#CECECE',
                    backgroundColor: '#ECECEC',
                    color: '#4D4D4D',
                  }
            }
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
