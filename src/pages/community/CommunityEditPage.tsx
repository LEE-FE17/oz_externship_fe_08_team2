/**
 * @figma 커뮤니티 - 게시글 수정하기  https://www.figma.com/design/4rJmEFUU2HMWVy3qUcYZRs/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-5757&m=dev
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/stores/authStore'
import { useCategories } from '@/features/posts/categories'
import { postDetailQueryOptions } from '@/features/posts/detail'
import { useUpdatePost } from '@/features/posts/edit'
import { Toast } from '@/components/common/Toast'
import type { ToastVariant } from '@/components/common/Toast/Toast'
import { Spinner } from '@/components/common/Spinner'
import { PageHeader, PostForm } from '@/components/community'
import type { PostFormSubmitValues } from '@/components/community'

interface ToastState {
  visible: boolean
  message: string
  variant: ToastVariant
}

export function CommunityEditPage() {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const { isAuthenticated } = useAuthStore()
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'success',
  })

  const {
    data: categories = [],
    isError: isCategoriesError,
    isLoading: isCategoriesLoading,
  } = useCategories()

  const {
    data: post,
    isLoading: isPostLoading,
    isError: isPostError,
  } = useQuery(postDetailQueryOptions(Number(postId)))

  const { mutate: updatePost, isPending } = useUpdatePost(postId!)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.AUTH.LOGIN || '/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (isPostError) {
      navigate(ROUTES.COMMUNITY.LIST, { replace: true })
    }
  }, [isPostError, navigate])

  const handleSubmit = (values: PostFormSubmitValues) => {
    updatePost(values, {
      onSuccess: () => {
        setToast({
          visible: true,
          message: '게시글이 수정되었습니다.',
          variant: 'success',
        })
        setTimeout(() => {
          navigate(ROUTES.COMMUNITY.DETAIL.replace(':postId', postId!))
        }, 800)
      },
      onError: (error) => {
        const axiosError = error as AxiosError<{
          error_detail?: string | Record<string, string[]>
        }>
        const detail = axiosError.response?.data?.error_detail
        const message =
          typeof detail === 'string' ? detail : '요청에 실패했습니다.'
        setToast({ visible: true, message, variant: 'error' })
      },
    })
  }

  if (isPostLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-236 px-4 py-8">
      <PageHeader title="커뮤니티 게시글 수정" className="mb-8" />
      <PostForm
        mode="edit"
        categories={categories}
        isCategoriesError={isCategoriesError}
        isCategoriesLoading={isCategoriesLoading}
        key={post?.id}
        defaultValues={
          post
            ? {
                categoryId: String(post.category_id),
                title: post.title,
                content: post.content,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        isPending={isPending}
      />
      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  )
}
