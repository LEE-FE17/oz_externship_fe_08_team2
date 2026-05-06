import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { MessageCircle } from 'lucide-react'
import { Toast } from '@/components'
import {
  useCommentsInfiniteQuery,
  useSubmitComment,
  useDeleteComment,
} from '@/features/posts/comments'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/constants/routes'
import { CommentLoadingDots } from '@/components/community/CommentLoadingDots'
import { CommentItem } from '@/components/community/CommentItem'
import { CommentInput } from '@/components/community/CommentInput'
import { CommentSortButton } from '@/components/community/CommentSortButton'
import type { SortOrder } from '@/components/community/CommentSortButton'

interface Props {
  postId: number
}

export function CommunityComments({ postId }: Props) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [submitError, setSubmitError] = useState(false)
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const [deleteToast, setDeleteToast] = useState<{
    visible: boolean
    message: string
    variant: 'success' | 'error'
    closeAction?: 'navigate-list' | 'navigate-login' | 'refresh'
  }>({ visible: false, message: '', variant: 'success' })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useCommentsInfiniteQuery(postId, sortOrder, Boolean(postId))

  const queryClient = useQueryClient()
  const { mutate: submitComment, isPending: isSubmitting } =
    useSubmitComment(postId)
  const { mutate: deleteComment } = useDeleteComment(postId)

  const isPostNotFound =
    isError && axios.isAxiosError(error) && error.response?.status === 404

  const handleToastClose = useCallback(() => {
    navigate(ROUTES.COMMUNITY.LIST, { replace: true })
  }, [navigate])

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) {
      setSubmitErrorMessage('댓글은 1글자 이상 적어야합니다.')
      setSubmitError(true)
      return
    }
    submitComment(
      { content: inputValue.trim() },
      {
        onSuccess: () => setInputValue(''),
        onError: (error) => {
          if (!axios.isAxiosError(error) || !error.response) {
            setSubmitErrorMessage('네트워크 연결을 확인해주세요.')
            setSubmitError(true)
            return
          }
          const status = error.response.status
          if (status === 401) {
            setSubmitErrorMessage('로그인이 필요합니다.')
            setSubmitError(true)
            navigate(ROUTES.AUTH.LOGIN, { replace: true })
          } else if (status === 404) {
            setSubmitErrorMessage('존재하지 않는 게시물입니다.')
            setSubmitError(true)
            navigate(ROUTES.COMMUNITY.LIST, { replace: true })
          } else {
            setSubmitErrorMessage(
              '댓글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.'
            )
            setSubmitError(true)
          }
        },
      }
    )
  }, [inputValue, submitComment, navigate])

  const handleDelete = useCallback(
    (commentId: number) => {
      deleteComment(commentId, {
        onSuccess: () => {
          setDeleteToast({
            visible: true,
            message: '댓글이 삭제되었습니다.',
            variant: 'success',
          })
        },
        onError: (error) => {
          if (!axios.isAxiosError(error)) {
            setDeleteToast({
              visible: true,
              message: '잠시 후 다시 시도해주세요.',
              variant: 'error',
            })
            return
          }
          const status = error.response?.status
          const detail = error.response?.data?.error_detail ?? ''
          if (status === 401) {
            setDeleteToast({
              visible: true,
              message: '로그인이 필요합니다.',
              variant: 'error',
              closeAction: 'navigate-login',
            })
          } else if (status === 404 && detail.includes('게시글')) {
            setDeleteToast({
              visible: true,
              message: '해당 게시물은 없습니다.',
              variant: 'error',
              closeAction: 'navigate-list',
            })
          } else if (status === 404 && detail.includes('댓글')) {
            setDeleteToast({
              visible: true,
              message: '이미 삭제된 댓글입니다.',
              variant: 'error',
              closeAction: 'refresh',
            })
          } else {
            setDeleteToast({
              visible: true,
              message: '잠시 후 다시 시도해주세요.',
              variant: 'error',
            })
          }
        },
      })
    },
    [deleteComment]
  )

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

  const allComments = data?.pages.flatMap((page) => page.results) ?? []
  const totalCount = data?.pages[0]?.count ?? 0

  if (isLoading) {
    return (
      <section className="mt-8">
        <CommentLoadingDots />
      </section>
    )
  }

  return (
    <section className="mt-8">
      {/* 게시물 조회 404 토스트 — 닫히면 목록 페이지로 이동 */}
      <Toast
        message="해당 게시물은 없습니다."
        variant="error"
        visible={isPostNotFound}
        onClose={handleToastClose}
      />

      {/* 댓글 삭제 토스트 */}
      <Toast
        message={deleteToast.message}
        variant={deleteToast.variant}
        visible={deleteToast.visible}
        onClose={() => {
          const action = deleteToast.closeAction
          setDeleteToast((prev) => ({ ...prev, visible: false }))
          if (action === 'navigate-list') {
            navigate(ROUTES.COMMUNITY.LIST, { replace: true })
          } else if (action === 'navigate-login') {
            navigate(ROUTES.AUTH.LOGIN, { replace: true })
          } else if (action === 'refresh') {
            queryClient.invalidateQueries({
              queryKey: ['posts', postId, 'comments'],
            })
          }
        }}
      />

      {/* 댓글 입력창 — 로그인 사용자만 */}
      {isAuthenticated && (
        <CommentInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitErrorMessage={submitErrorMessage}
          onSubmitErrorClose={() => setSubmitError(false)}
        />
      )}

      {/* 댓글 수 + 정렬 */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-text-heading flex items-center gap-1.5 text-lg font-semibold">
          <MessageCircle size={20} />
          댓글 {totalCount}개
        </h2>
        <CommentSortButton sortOrder={sortOrder} onChange={setSortOrder} />
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
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </div>
      )}

      {/* 무한스크롤 감지 영역 + 로딩 표시 */}
      <div ref={loadMoreRef} className="py-2">
        {isFetchingNextPage && <CommentLoadingDots />}
      </div>
    </section>
  )
}
