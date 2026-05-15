import { useState } from 'react'
import { useNavigate } from 'react-router'
import logoImg from '@/assets/logo.png'
import { ROUTES } from '@/constants/routes'
import { ProfileIcon } from './icons'
import { ProfileDropdown } from './ProfileDropdown'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/features/accounts/logout'

export interface HeaderProps {
  bannerText?: string
  onLogout?: () => void
}

export function Header({
  bannerText = '🚨 선착순 모집! 국비지원 받고 4주 완성',
  onLogout,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { mutate: requestLogout } = useLogout()

  return (
    <header className="flex w-full flex-col">
      {/* Top banner */}
      <div className="flex h-12 items-center justify-center bg-black px-4">
        <p className="text-base whitespace-nowrap text-white">{bannerText}</p>
      </div>

      {/* Navigation bar */}
      <div className="border-b border-black/20 bg-white">
        <div className="max-w-container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-15">
            <a
              href={ROUTES.HOME}
              className="flex shrink-0 items-center"
              aria-label="홈으로 이동"
            >
              <img src={logoImg} alt="OzCodingSchool" className="h-5 w-auto" />
            </a>

            <nav className="flex items-center gap-15">
              <button
                onClick={() => navigate(ROUTES.COMMUNITY.LIST)}
                className="hover:text-primary px-2.5 py-2.5 text-lg tracking-tight text-gray-900 transition-colors duration-150"
              >
                커뮤니티
              </button>
              <a
                href={ROUTES.QNA.LIST}
                className="hover:text-primary px-2.5 py-2.5 text-lg tracking-tight text-gray-900 transition-colors duration-150"
              >
                질의응답
              </a>
            </nav>
          </div>

          {/* Right: Auth or Profile */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onMouseEnter={() => setDropdownOpen(true)}
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="프로필 메뉴"
                aria-expanded={dropdownOpen}
                className="focus-visible:ring-primary overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <ProfileIcon />
                )}
              </button>

              <ProfileDropdown
                isOpen={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                nickname={user?.nickname ?? ''}
                email={user?.email ?? ''}
                enrollHref={ROUTES.SIGNUP.SELECT}
                mypageHref={
                  isAuthenticated ? ROUTES.MYPAGE.HOME : ROUTES.AUTH.LOGIN
                }
                onLogout={() => {
                  requestLogout(undefined, {
                    onSettled: () => {
                      logout()
                      onLogout?.()
                      setDropdownOpen(false)
                    },
                  })
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 text-base tracking-tight text-gray-600">
              <a
                href={ROUTES.AUTH.LOGIN}
                className="transition-colors duration-150 hover:text-gray-900"
              >
                로그인
              </a>
              <span className="text-gray-400">|</span>
              <a
                href={ROUTES.SIGNUP.SELECT}
                className="transition-colors duration-150 hover:text-gray-900"
              >
                회원가입
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
