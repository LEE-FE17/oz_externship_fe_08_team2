/** ISO 날짜 문자열을 상대 시간으로 변환 (1분 미만: "방금", 이후: "N분 전" 등) */
export function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const past = new Date(dateStr).getTime()
  const diffMs = now - past

  if (diffMs < 0) return '방금'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return '방금'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}달 전`

  const years = Math.floor(months / 12)
  return `${years}년 전`
}
