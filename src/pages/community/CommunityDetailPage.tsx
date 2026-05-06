/**
 * @figma 커뮤니티 상세 페이지 (비회원)     https://www.figma.com/design/4rJmEFUU2HMWVy3qUcYZRs/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-10472&m=dev
 * @figma 커뮤니티 상세 페이지 (회원)        https://www.figma.com/design/4rJmEFUU2HMWVy3qUcYZRs/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-10585&m=dev
 * @figma 커뮤니티 상세 페이지 (회원-작성자) https://www.figma.com/design/4rJmEFUU2HMWVy3qUcYZRs/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-10696&m=dev
 */
import { Component, Suspense, useState, useRef } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal'
import { PostHeader } from '@/components/community/PostHeader'
import { PostAuthorActions } from '@/components/community/PostAuthorActions'
import { PostBody } from '@/components/community/PostBody'
import { PostActions } from '@/components/community/PostActions'
import { Toast } from '@/components/common/Toast'
import { CommunityComments } from '@/components/community/CommunityComments'
import { usePostDetail } from '@/features/posts/detail'
import { useTogglePostLike } from '@/features/posts/like'
import { useDeletePost } from '@/features/posts/delete'
import { useAuthStore } from '@/stores/authStore'

interface DetailErrorBoundaryProps {
  children: ReactNode
}

interface DetailErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class DetailErrorBoundary extends Component<
  DetailErrorBoundaryProps,
  DetailErrorBoundaryState
> {
  constructor(props: DetailErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): DetailErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CommunityDetailPage error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-text-muted">
            게시글을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </main>
      )
    }

    return this.props.children
  }
}

function CommunityDetailContent({ postId }: { postId: number }) {
  const navigate = useNavigate()
  const { data: post } = usePostDetail(postId)
  const { isAuthenticated, user } = useAuthStore()

  const isAuthor = isAuthenticated && user?.id === post.author.id

  const pendingNavigate = useRef<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    variant: 'success' | 'error' | 'warning'
    visible: boolean
  }>({ message: '', variant: 'warning', visible: false })

  const { mutate: toggleLike, isPending: isLikePending } =
    useTogglePostLike(postId)
  const { mutate: deletePost, isPending: isDeletePending } = useDeletePost()

  const showToast = (
    message: string,
    variant: 'success' | 'error' | 'warning' = 'warning'
  ) => {
    setToast({ message, variant, visible: true })
  }

  const handleEdit = () => {
    navigate(`/community/${postId}/edit`)
  }

  const handleLike = () => {
    if (!isAuthenticated) {
      showToast('로그인이 필요합니다.', 'warning')
      return
    }
    if (isLikePending) return

    toggleLike(post.is_liked, {
      onError: () => {
        showToast('좋아요 처리에 실패했습니다.', 'error')
      },
    })
  }

  const handleDeleteConfirm = () => {
    if (isDeletePending) return
    deletePost(postId, {
      onSuccess: () => {
        setIsDeleteModalOpen(false)
        pendingNavigate.current = '/community'
        showToast('게시글이 삭제되었습니다.', 'success')
      },
      onError: () => {
        showToast('게시글 삭제에 실패했습니다.', 'error')
      },
    })
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ url, title: post.title })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      showToast('링크 복사에 실패했습니다.', 'error')
    }
  }

  return (
    <main className="mx-auto w-full max-w-[944px] px-4 pt-16 pb-10">
      <article className="flex flex-col">
        {/* 헤더: 카테고리 · 제목 · 작성자 · 메타 */}
        <PostHeader
          category={post.category_name}
          title={post.title}
          author={{
            nickname: post.author.nickname,
            profileImage: post.author.profile_img_url,
          }}
          createdAt={post.created_at}
          viewCount={post.view_count}
          likeCount={post.like_count}
        />

        {/* 수정/삭제 버튼 — 작성자 전용 */}
        {isAuthor && (
          <PostAuthorActions
            onEdit={handleEdit}
            onDelete={() => {
              if (!isDeletePending) setIsDeleteModalOpen(true)
            }}
          />
        )}

        {/* 구분선 */}
        <div className="mt-1 h-px w-full bg-gray-200" />

        {/* 본문 (HTML · 이미지 포함) */}
        <PostBody content={post.content} />

        {/* 좋아요 */}
        <PostActions
          likeCount={post.like_count}
          isLiked={post.is_liked}
          isLoggedIn={isAuthenticated}
          isLikePending={isLikePending}
          onLike={handleLike}
          onShare={handleShare}
        />

        {/* 구분선 */}
        <div className="h-px w-full bg-gray-200" />

        {/* 댓글 */}
        <CommunityComments postId={post.id} />
      </article>

      {/* 게시글 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeletePending) setIsDeleteModalOpen(false)
        }}
        message={`게시글을 삭제하시겠습니까?\n삭제된 게시글은 복구할 수 없습니다.`}
        confirmLabel="삭제"
        danger
        closeOnConfirm={false}
        isConfirmDisabled={isDeletePending}
        isCancelDisabled={isDeletePending}
        onConfirm={handleDeleteConfirm}
      />

      {/* 토스트 메시지 */}
      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => {
          setToast((prev) => ({ ...prev, visible: false }))
          if (pendingNavigate.current) {
            navigate(pendingNavigate.current)
            pendingNavigate.current = null
          }
        }}
      />
    </main>
  )
}

export function CommunityDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const postIdNum = Number(postId)

  if (isNaN(postIdNum) || postIdNum <= 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-text-muted">잘못된 게시글 ID입니다.</p>
      </main>
    )
  }

  return (
    <DetailErrorBoundary>
      <Suspense
        fallback={
          <main className="mx-auto max-w-4xl px-4 py-10">
            <p className="text-text-muted">로딩 중...</p>
          </main>
        }
      >
        <CommunityDetailContent postId={postIdNum} />
      </Suspense>
    </DetailErrorBoundary>
  )
}
