/**
 * @figma 커뮤니티 - 목록 페이지  https://www.figma.com/design/4rJmEFUU2HMWVy3qUcYZRs/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-9801&m=dev
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Button, DropdownList, SearchInput } from '@/components'
import { PostCard } from '@/components/community'
import { ROUTES } from '@/constants/routes'
import { usePostList } from '@/features/posts/list'
import type { PostSearchFilter, PostSortOption } from '@/features/posts/list'
import { useCategories } from '@/features/posts/categories'
import { useAuthStore } from '@/stores/authStore'

const PAGE_SIZE = 10

const SEARCH_TYPE_OPTIONS: { value: PostSearchFilter; label: string }[] = [
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
  { value: 'author', label: '작성자' },
  { value: 'title_or_content', label: '제목+내용' },
]

const SORT_OPTIONS: { value: PostSortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'most_views', label: '조회순' },
  { value: 'most_likes', label: '좋아요순' },
  { value: 'most_comments', label: '댓글순' },
]

type CategoryTab = { value: string; label: string; categoryId: number | undefined }

const ALL_TAB: CategoryTab = { value: 'all', label: '전체', categoryId: undefined }

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function getPageRange(current: number, total: number): number[] {
  const WINDOW = 10
  const half = Math.floor(WINDOW / 2)
  let start = Math.max(1, current - half)
  const end = Math.min(total, start + WINDOW - 1)
  start = Math.max(1, end - WINDOW + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function CommunityListPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const tabsScrollRef = useRef<HTMLDivElement>(null)

  const { data: categoriesData } = useCategories()
  const categoryTabs: CategoryTab[] = [
    ALL_TAB,
    ...(categoriesData ?? []).map((c) => ({
      value: String(c.id),
      label: c.name,
      categoryId: c.id,
    })),
  ]

  const [searchType, setSearchType] = useState<PostSearchFilter | undefined>(
    undefined
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState(ALL_TAB.value)
  const [sort, setSort] = useState<PostSortOption>(SORT_OPTIONS[0].value)
  const [page, setPage] = useState(1)

  const activeCategory = categoryTabs.find((t) => t.value === category)

  const { data, isLoading, isError } = usePostList({
    sort,
    search: searchQuery || undefined,
    search_filter: searchQuery ? searchType : undefined,
    category_id: activeCategory?.categoryId,
    page,
    page_size: PAGE_SIZE,
  })

  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE)

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setPage(1)
  }

  const handleSortChange = (value: string) => {
    setSort(value as PostSortOption)
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleWriteClick = () => {
    if (isInitialized && !isAuthenticated) {
      window.location.href = ROUTES.AUTH.LOGIN
      return
    }
    navigate(ROUTES.COMMUNITY.WRITE)
  }

  const currentIndex = categoryTabs.findIndex((t) => t.value === category)

  const moveCategory = (dir: 'left' | 'right') => {
    const next =
      dir === 'left'
        ? Math.max(0, currentIndex - 1)
        : Math.min(categoryTabs.length - 1, currentIndex + 1)
    if (next === currentIndex) return
    handleCategoryChange(categoryTabs[next].value)
    // 선택된 탭이 보이도록 스크롤
    const tabEl = tabsScrollRef.current?.children[next] as
      | HTMLElement
      | undefined
    tabEl?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  return (
    <div className="mx-auto w-full max-w-225 px-15 py-10">
      {/* 페이지 타이틀 */}
      <h1 className="text-text-heading text-3xl font-bold tracking-tight">
        커뮤니티
      </h1>

      {/* 검색 + 글쓰기 */}
      <div className="mt-6 flex w-full items-center gap-3">
        <span className="w-28 shrink-0">
          <DropdownList
            options={SEARCH_TYPE_OPTIONS}
            value={searchType}
            onChange={(v) => setSearchType(v as PostSearchFilter)}
            placeholder="검색 유형"
          />
        </span>
        <SearchInput
          value={searchQuery}
          onValueChange={handleSearch}
          placeholder="검색어를 입력하세요"
          className="flex-1"
        />
        <Button
          variant="primary"
          size="md"
          className="flex shrink-0 items-center gap-1.5"
          onClick={handleWriteClick}
        >
          <PencilIcon />
          글쓰기
        </Button>
      </div>

      {/* 카테고리 탭 + 정렬 */}
      <div className="border-border-base mt-5 grid w-full grid-cols-[1fr_8rem] items-center gap-4 border-b pb-3">
        {/* 탭 스크롤 영역 */}
        <div className="flex items-center">
          {/* 왼쪽 화살표 */}
          <button
            type="button"
            onClick={() => moveCategory('left')}
            aria-label="이전 카테고리"
            className="text-text-muted hover:text-text-body flex shrink-0 items-center px-1 transition-colors"
          >
            <ChevronLeftIcon />
          </button>

          {/* 탭 목록 */}
          <div
            ref={tabsScrollRef}
            role="tablist"
            aria-label="게시글 카테고리"
            className="flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={category === tab.value}
                onClick={() => handleCategoryChange(tab.value)}
                className={[
                  'h-10.5 shrink-0 cursor-pointer rounded-md px-3.5 text-sm font-medium transition-colors duration-150 outline-none',
                  category === tab.value
                    ? 'bg-primary-100 text-primary'
                    : 'text-text-muted hover:text-text-body',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 오른쪽 화살표 */}
          <button
            type="button"
            onClick={() => moveCategory('right')}
            aria-label="다음 카테고리"
            className="text-text-muted hover:text-text-body flex shrink-0 items-center px-1 transition-colors"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* 정렬 */}
        <div>
          <DropdownList
            options={SORT_OPTIONS}
            value={sort}
            onChange={handleSortChange}
          />
        </div>
      </div>

      {/* 글 목록 */}
      <div className="flex min-h-96 w-full flex-col gap-10">
        {isLoading && (
          <p className="text-text-muted py-16 text-center text-sm">
            불러오는 중...
          </p>
        )}
        {isError && (
          <p className="text-error py-16 text-center text-sm">
            게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}
        {!isLoading && !isError && (data?.results?.length ?? 0) === 0 && (
          <p className="text-text-muted py-16 text-center text-sm">
            게시글이 없습니다.
          </p>
        )}
        {data?.results?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onClick={() =>
              navigate(
                ROUTES.COMMUNITY.DETAIL.replace(':postId', String(post.id))
              )
            }
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="border-border-base mt-13 border-t">
          <div className="flex w-full items-center justify-center gap-1 py-8">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label="첫 페이지"
              className="text-text-muted flex items-center justify-center rounded px-2.5 py-3.25 text-[20px] leading-5 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-[#BDBDBD]"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="이전 페이지"
              className="text-text-muted flex items-center justify-center rounded px-2.5 py-3.25 text-[20px] leading-5 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-[#BDBDBD]"
            >
              ‹
            </button>

            {getPageRange(page, totalPages).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-gray-200',
                ].join(' ')}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="다음 페이지"
              className="text-text-muted flex items-center justify-center rounded px-2.5 py-3.25 text-[20px] leading-5 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-[#BDBDBD]"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              aria-label="마지막 페이지"
              className="text-text-muted flex items-center justify-center rounded px-2.5 py-3.25 text-[20px] leading-5 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-[#BDBDBD]"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
