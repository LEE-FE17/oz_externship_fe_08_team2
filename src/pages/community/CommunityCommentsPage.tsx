import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import axios from 'axios'
import { MessageCircle, ArrowUpDown } from 'lucide-react'
import { Avatar, Toast } from '@/components'
import {
  useCommentsInfiniteQuery,
  useSubmitComment,
} from '@/features/posts/comments'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/constants/routes'
import type { Comment, TaggedUser } from '@/features/posts/comments'

// ─── 날짜 포맷 ────────────────────────────────────────────
function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoString))
}

// ─── @멘션 파싱 ───────────────────────────────────────────
function parseContent(
  content: string,
  taggedUsers: TaggedUser[]
): React.ReactNode[] {
  const mentionRegex = /@(\S+)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(content)) !== null) {
    const nickname = match[1]
    const isTagged = taggedUsers.some((u) => u.nickname === nickname)

    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    parts.push(
      <span
        key={match.index}
        className={isTagged ? 'text-primary font-bold' : ''}
      >
        {match[0]}
      </span>
    )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts
}

// ─── 댓글 단일 아이템 ─────────────────────────────────────
function CommentItem({ comment, isOwn }: { comment: Comment; isOwn: boolean }) {
  return (
    <div className="flex gap-3 py-4">
      <Avatar
        src={comment.author.profile_img_url}
        alt={comment.author.nickname}
        size="sm"
      />
      <div className="min-w-0 flex-1 border-b border-gray-200 pb-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-text-heading text-sm font-semibold">
            {comment.author.nickname}
          </span>
          <span className="text-text-muted text-xs">
            {formatDate(comment.created_at)}
            {isOwn && (
              <>
                {' | '}
                <button
                  type="button"
                  className="transition-colors duration-150 hover:text-red-500"
                >
                  삭제
                </button>
              </>
            )}
          </span>
        </div>
        <p className="text-text-body text-sm leading-relaxed break-words">
          {parseContent(comment.content, comment.tagged_users)}
        </p>
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
/**
 * 댓글 목록 컴포넌트
 *
 * 사용법 (CommunityDetailPage에서):
 *   import { CommunityCommentsPage } from '@/pages/community/CommunityCommentsPage'
 *   <CommunityCommentsPage />
 *
 * postId는 react-router의 useParams()로 자동으로 읽어옵니다.
 */
interface Props {
  postId: number
}

export function CommunityCommentsPage({ postId }: Props) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [submitError, setSubmitError] = useState(false)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useCommentsInfiniteQuery(postId, 'latest', Boolean(postId))

  const { mutate: submitComment, isPending: isSubmitting } =
    useSubmitComment(postId)

  // 게시물이 삭제된 경우 (404) 여부를 쿼리 상태에서 직접 파생
  const isPostNotFound =
    isError && axios.isAxiosError(error) && error.response?.status === 404

  const handleToastClose = useCallback(() => {
    navigate(ROUTES.COMMUNITY.LIST, { replace: true })
  }, [navigate])

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return
    submitComment(
      { content: inputValue.trim() },
      {
        onSuccess: () => setInputValue(''),
        onError: () => setSubmitError(true),
      }
    )
  }, [inputValue, submitComment])

  // 무한스크롤 IntersectionObserver
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── 조기 반환 (hooks 이후) ──────────────────────────────

  const allComments = data?.pages.flatMap((page) => page.results) ?? []
  const totalCount = data?.pages[0]?.count ?? 0

  // 초기 로딩
  if (isLoading) {
    return (
      <section className="mt-8">
        <div className="text-primary py-8 text-center text-8xl">...</div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      {/* 404 토스트 — 토스트가 닫히면 목록 페이지로 이동 */}
      <Toast
        message="해당 게시물은 없습니다."
        variant="error"
        visible={isPostNotFound}
        onClose={handleToastClose}
      />

      {/* 댓글 입력창 — 로그인 사용자만 */}
      {isAuthenticated && (
        <div className="mb-4">
          <Toast
            message="댓글 등록에 실패했습니다. 잠시 후 다시 시도해주세요."
            variant="error"
            visible={submitError}
            onClose={() => setSubmitError(false)}
          />
          <div className="border-border-base focus-within:border-primary relative rounded-lg border transition-colors duration-150">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="개인정보를 공유 및 요청하거나, 명예 훼손, 무단 광고, 불법 정보 유포 시 모니터링 후 삭제될 수 있습니다."
              rows={2}
              maxLength={500}
              disabled={isSubmitting}
              className="bg-bg-base text-text-heading placeholder:text-text-muted w-full resize-none rounded-lg px-4 py-3 pb-10 text-sm outline-none disabled:opacity-50"
            />
            <div className="absolute right-3 bottom-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isSubmitting}
                className="bg-primary text-text-inverse hover:bg-primary-700 rounded-full px-5 py-1.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 수 + 최신순 — 같은 줄 */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-text-heading flex items-center gap-1.5 text-lg font-semibold">
          <MessageCircle size={20} />
          댓글 {totalCount}개
        </h2>
        <button
          type="button"
          className="text-text-muted hover:text-text-heading flex items-center gap-1 text-sm transition-colors duration-150"
        >
          최신순
          <ArrowUpDown size={14} />
        </button>
      </div>

      {/* 댓글 목록 */}
      {allComments.length === 0 ? (
        <p className="text-text-muted py-8 text-center">
          등록된 댓글이 없습니다.
        </p>
      ) : (
        <div>
          {allComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwn={comment.author.nickname === user?.nickname}
            />
          ))}
        </div>
      )}

      {/* 무한스크롤 감지 영역 + 로딩 표시 */}
      <div ref={loadMoreRef} className="py-2">
        {isFetchingNextPage && (
          <div className="text-primary py-4 text-center text-8xl">...</div>
        )}
      </div>
    </section>
  )
}
