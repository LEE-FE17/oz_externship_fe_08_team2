import { Avatar } from '@/components/common/Avatar'

export interface PostHeaderProps {
  category: string
  title: string
  author: {
    nickname: string
    profileImage: string | null
  }
  createdAt: string
  viewCount: number
  likeCount: number
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)

  if (sec < 60) return '방금 전'
  if (min < 60) return `${min}분 전`
  if (hour < 24) return `${hour}시간 전`
  if (day < 7) return `${day}일 전`
  const d = new Date(isoString)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function PostHeader({
  category,
  title,
  author,
  createdAt,
  viewCount,
  likeCount,
}: PostHeaderProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 카테고리 + 제목 + 프로필 */}
      <div className="flex flex-col gap-6">
        <span className="text-primary text-xl font-bold">{category}</span>

        <div className="flex items-start justify-between gap-6">
          <h1 className="text-text-heading text-[32px] leading-snug font-bold">
            {title}
          </h1>
          <div className="flex shrink-0 items-center gap-3">
            <Avatar src={author.profileImage} alt={author.nickname} size="lg" />
            <span className="text-base font-semibold text-gray-600">
              {author.nickname}
            </span>
          </div>
        </div>
      </div>

      {/* 조회수 · 좋아요 · 시간 메타 정보 */}
      <div className="flex items-center gap-1 text-base text-gray-400">
        <span>조회수 {viewCount.toLocaleString()}</span>
        <span aria-hidden="true">·</span>
        <span>좋아요 {likeCount.toLocaleString()}</span>
        <span aria-hidden="true">·</span>
        <span>{formatRelativeTime(createdAt)}</span>
      </div>
    </div>
  )
}
