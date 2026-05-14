import { Avatar } from '@/components/common'
import type { PostListItem } from '@/features/posts/list'

export interface PostCardProps {
  post: PostListItem
  onClick?: () => void
}

function extractFirstImage(text: string): string | null {
  const match = /!\[([^\]]*)\]\(([^)]+)\)/.exec(text)
  return match ? match[2] : null
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*{1,3}|_{1,3})(.+?)\1/g, '$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^[-*]{3,}\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatRelativeTime(isoString: string): string {
  const target = new Date(isoString).getTime()
  if (Number.isNaN(target)) return ''
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - target) / 1000))
  if (diffSec < 60) return '방금 전'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  const date = new Date(isoString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function ThumbsUpIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function PostCard({ post, onClick }: PostCardProps) {
  const effectiveThumbnail = post.thumbnail || extractFirstImage(post.content)
  const hasThumbnail = !!effectiveThumbnail

  return (
    <article
      onClick={onClick}
      data-testid="post-card"
      className={[
        'w-full overflow-hidden rounded-xl p-6',
        onClick
          ? 'cursor-pointer transition-colors duration-150 hover:bg-gray-100/60'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex h-40.75 w-full justify-between gap-10 overflow-hidden">
        {/* 텍스트 영역 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
          {/* 카테고리 */}
          <span className="text-text-muted text-xs">{post.category.name}</span>

          {/* 제목 */}
          <h2 className="text-text-heading truncate text-base leading-snug font-semibold">
            {post.title}
          </h2>

          {/* 내용 미리보기 */}
          <p
            className={[
              'text-text-body text-sm leading-relaxed wrap-break-word',
              hasThumbnail
                ? 'line-clamp-1 min-h-5.25'
                : 'line-clamp-2 min-h-10.5',
            ].join(' ')}
          >
            {stripMarkdown(post.content)}
          </p>

          {/* 하단 메타 */}
          <div className="text-text-muted mt-3 flex w-full items-center justify-between text-xs">
            {/* 좋아요 · 댓글 · 조회수 */}
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex items-center gap-1">
                <ThumbsUpIcon />
                좋아요 {post.like_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <CommentIcon />
                댓글 {post.comment_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon />
                조회수 {post.view_count.toLocaleString()}
              </span>
            </div>

            {/* 작성자 · 시간 */}
            <div className="flex min-w-0 shrink-0 items-center gap-1.5">
              <Avatar
                src={post.author.profile_image}
                alt={`${post.author.nickname} 프로필`}
                size="sm"
              />
              <span className="text-text-body max-w-24 truncate font-medium">
                {post.author.nickname}
              </span>
              <span aria-hidden="true" className="text-gray-300">
                ·
              </span>
              <time dateTime={post.created_at}>
                {formatRelativeTime(post.created_at)}
              </time>
            </div>
          </div>
        </div>

        {/* 썸네일 */}
        {hasThumbnail && (
          <img
            src={effectiveThumbnail ?? ''}
            alt=""
            role="presentation"
            loading="lazy"
            className="h-24 w-32 shrink-0 rounded-lg object-cover"
          />
        )}
      </div>
    </article>
  )
}
