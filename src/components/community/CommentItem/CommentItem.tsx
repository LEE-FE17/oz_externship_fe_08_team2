import { useState } from 'react'
import type { ReactNode } from 'react'
import DOMPurify from 'dompurify'
import { Avatar } from '@/components'
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal'
import type { Comment, TaggedUser } from '@/features/posts/comments'

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoString))
}

function parseContent(content: string, taggedUsers: TaggedUser[]): ReactNode[] {
  const clean = DOMPurify.sanitize(content)
  const mentionRegex = /@(\S+)/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(clean)) !== null) {
    const nickname = match[1]
    const isTagged = taggedUsers.some((u) => u.nickname === nickname)

    if (match.index > lastIndex) {
      parts.push(clean.slice(lastIndex, match.index))
    }

    parts.push(
      <span
        key={match.index}
        className={isTagged ? 'text-primary font-bold' : ''}
        style={
          isTagged
            ? {
                backgroundColor: '#EDE6FF',
                borderRadius: '4px',
                padding: '0 2px',
              }
            : undefined
        }
      >
        {match[0]}
      </span>
    )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < clean.length) {
    parts.push(clean.slice(lastIndex))
  }

  return parts
}

interface CommentItemProps {
  comment: Comment
  isOwn: boolean
  onDelete?: () => void
}

export function CommentItem({ comment, isOwn, onDelete }: CommentItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="flex gap-3 py-4">
      <Avatar
        src={comment.author.profile_img_url}
        alt={comment.author.nickname}
        size="lg"
      />
      <div className="min-w-0 flex-1 border-b border-gray-200 pb-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-text-heading text-sm font-semibold">
            {comment.author.nickname}
          </span>
          <span className="text-text-muted text-xs">
            {formatDate(comment.created_at)}
          </span>
          {isOwn && (
            <>
              <span className="text-text-muted text-xs">|</span>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="text-primary text-sm font-semibold transition-colors duration-150 hover:opacity-70"
              >
                삭제
              </button>
              <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                message="댓글을 삭제하시겠습니까?"
                cancelLabel="취소"
                confirmLabel="확인"
                onConfirm={() => {
                  setConfirmOpen(false)
                  onDelete?.()
                }}
              />
            </>
          )}
        </div>
        <p className="text-text-body text-sm leading-relaxed wrap-break-word">
          {parseContent(comment.content, comment.tagged_users)}
        </p>
      </div>
    </div>
  )
}
