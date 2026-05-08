import { Avatar } from '@/components'
import type { UserSearchResult } from '@/features/accounts/user-search'

interface UserTagListProps {
  users: UserSearchResult[]
  onSelect: (nickname: string) => void
}

export function UserTagList({ users, onSelect }: UserTagListProps) {
  if (users.length === 0) return null

  return (
    <ul className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-md">
      {users.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(user.nickname)
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 hover:bg-gray-100"
          >
            <Avatar src={user.profile_img_url} alt={user.nickname} size="sm" />
            <span className="text-text-heading text-sm font-medium">
              {user.nickname}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
