/**
 * @figma 커뮤니티 - 글작성하기  https://www.figma.com/design/4rJmEFUU2HMWVy3qUcYZRs/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-5561&m=dev
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import type { AxiosError } from 'axios'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/stores/authStore'
import { useCategories } from '@/features/posts/categories'
import { useCreatePost } from '@/features/posts/write'
import { Toast } from '@/components/common/Toast'
import type { ToastVariant } from '@/components/common/Toast/Toast'
import { PageHeader, PostForm } from '@/components/community'
import type { PostFormSubmitValues } from '@/components/community'

interface ToastState {
  visible: boolean
  message: string
  variant: ToastVariant
}

export function CommunityWritePage() {
  const navigate = useNavigate()
  const { isAuthenticated, isInitialized } = useAuthStore()
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'success',
  })

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      window.location.href = ROUTES.AUTH.LOGIN
    }
  }, [isInitialized, isAuthenticated])

  const {
    data: categories = [],
    isError: isCategoriesError,
    isLoading: isCategoriesLoading,
  } = useCategories()

  const { mutate: createPost, isPending } = useCreatePost()
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [])

  const handleSubmit = (values: PostFormSubmitValues) => {
    createPost(values, {
      onSuccess: (data) => {
        setToast({
          visible: true,
          message: '게시글이 등록되었습니다.',
          variant: 'success',
        })
        navTimerRef.current = setTimeout(() => {
          navigate(`/community/${data.pk}`)
        }, 800)
      },
      onError: (error) => {
        const axiosError = error as AxiosError<{
          error_detail?: string | Record<string, string[]>
        }>
        const detail = axiosError.response?.data?.error_detail
        let message = '요청에 실패했습니다.'
        if (typeof detail === 'string') {
          message = detail
        } else if (detail && typeof detail === 'object') {
          const firstValues = Object.values(detail)[0]
          const firstMsg = Array.isArray(firstValues)
            ? firstValues[0]
            : undefined
          if (firstMsg) message = firstMsg
        }
        setToast({ visible: true, message, variant: 'error' })
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-236 px-4 py-8">
      <PageHeader title="커뮤니티 게시글 작성" className="mb-8" />
      <PostForm
        mode="write"
        categories={categories}
        isCategoriesError={isCategoriesError}
        isCategoriesLoading={isCategoriesLoading}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/community')}
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
