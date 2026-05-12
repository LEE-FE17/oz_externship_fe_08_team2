import { useEffect, useRef } from 'react'
import { Button } from '@/components/common/Button'

export interface ProfileDropdownProps {
  isOpen: boolean
  onClose: () => void
  nickname: string
  email: string
  enrollHref?: string
  mypageHref?: string
  onLogout?: () => void
}

export function ProfileDropdown({
  isOpen,
  onClose,
  nickname,
  email,
  enrollHref,
  mypageHref,
  onLogout,
}: ProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 z-50 mt-2 w-[204px] rounded-xl bg-white px-4 py-6 shadow-[0px_0px_16px_0px_rgba(160,160,160,0.25)]"
    >
      <div className="flex flex-col gap-2">
        {/* User info */}
        <div className="flex flex-col gap-3">
          <p className="text-base font-semibold tracking-tight text-gray-900">
            {nickname}
          </p>
          <p className="text-sm tracking-tight break-all text-gray-400">
            {email}
          </p>
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-gray-200" />

        {/* Menu */}
        <nav className="flex flex-col gap-1">
          <a
            href={enrollHref}
            onClick={onClose}
            className="hover:text-primary hover:bg-bg-accent text-text-heading inline-flex h-12 w-full items-center justify-start rounded-sm px-3 text-sm font-medium tracking-tight transition-colors duration-150"
          >
            수강생 등록
          </a>
          <a
            href={mypageHref}
            onClick={onClose}
            className="hover:text-primary hover:bg-bg-accent text-text-heading inline-flex h-12 w-full items-center justify-start rounded-sm px-3 text-sm font-medium tracking-tight transition-colors duration-150"
          >
            마이페이지
          </a>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onLogout}
            className="text-text-heading hover:text-primary h-12 justify-start tracking-tight"
          >
            로그아웃
          </Button>
        </nav>
      </div>
    </div>
  )
}

export default ProfileDropdown
