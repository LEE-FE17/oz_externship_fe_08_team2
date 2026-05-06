import { useState } from 'react'
import type { Category } from '@/features/posts/categories'
import { usePresignedUrl } from '@/features/posts/write'
import { Dropdown } from '@/components/common/Dropdown'
import { MarkdownEditor } from '../MarkdownEditor'
import { SubmitButton } from '../SubmitButton'
import { CancelButton } from '../CancelButton'

interface PostFormValues {
  categoryId: string
  title: string
  content: string
}

interface PostFormErrors {
  categoryId?: string
  title?: string
  content?: string
}

export interface PostFormSubmitValues {
  title: string
  content: string
  category_id: number
}

export interface PostFormProps {
  mode: 'write' | 'edit'
  categories: Category[]
  isCategoriesError: boolean
  isCategoriesLoading: boolean
  defaultValues?: Partial<PostFormValues>
  onSubmit: (values: PostFormSubmitValues) => void
  onCancel?: () => void
  showCancel?: boolean
  isPending: boolean
}

const TITLE_MAX = 100
const CONTENT_MAX = 2000

export function PostForm({
  mode,
  categories,
  isCategoriesError,
  isCategoriesLoading,
  defaultValues,
  onSubmit,
  onCancel,
  showCancel = false,
  isPending,
}: PostFormProps) {
  const [values, setValues] = useState<PostFormValues>(() => ({
    categoryId: defaultValues?.categoryId ?? '',
    title: defaultValues?.title ?? '',
    content: defaultValues?.content ?? '',
  }))
  const [errors, setErrors] = useState<PostFormErrors>({})
  const { mutateAsync: getPresignedUrl } = usePresignedUrl()

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  const handleChange = <K extends keyof PostFormValues>(
    key: K,
    value: PostFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const { presigned_url, img_url } = await getPresignedUrl({
      file_name: file.name,
    })
    await fetch(presigned_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    return img_url
  }

  const validate = (): boolean => {
    const next: PostFormErrors = {}
    if (!values.categoryId) next.categoryId = '카테고리를 선택해 주세요.'
    if (!values.title.trim()) next.title = '제목을 입력해 주세요.'
    if (!values.content.trim()) {
      next.content = '내용을 입력해 주세요.'
    } else if (values.content.length > CONTENT_MAX) {
      next.content = `내용은 ${CONTENT_MAX}자 이내로 입력해 주세요.`
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      title: values.title,
      content: values.content,
      category_id: Number(values.categoryId),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* 카테고리 + 제목 카드 */}
      <div className="bg-bg-base flex flex-col gap-3 rounded-[20px] border border-[#cdcdcd] p-6">
        <Dropdown
          options={categoryOptions}
          value={values.categoryId}
          onChange={(v) => handleChange('categoryId', v)}
          placeholder="카테고리 선택"
          disabled={isCategoriesLoading || isCategoriesError}
        />
        {errors.categoryId && (
          <p className="text-error -mt-2 text-xs" role="alert">
            {errors.categoryId}
          </p>
        )}
        {isCategoriesError && (
          <p className="text-error -mt-2 text-xs" role="alert">
            카테고리를 불러오는데 실패했습니다.
          </p>
        )}

        <div
          className={[
            'flex items-center rounded border-0 px-4',
            'bg-[#f7f1ff]',
            errors.title ? 'ring-1 ring-red-400' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            type="text"
            value={values.title}
            maxLength={TITLE_MAX}
            placeholder="제목을 입력해 주세요"
            onChange={(e) => handleChange('title', e.target.value)}
            className="text-text-heading placeholder:text-text-muted h-14 w-full bg-transparent text-base outline-none"
          />
        </div>
        {errors.title && (
          <p className="text-error -mt-2 text-xs" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      {/* 에디터 */}
      <MarkdownEditor
        value={values.content}
        onChange={(v) => handleChange('content', v)}
        onImageUpload={handleImageUpload}
        error={errors.content}
      />

      {/* 버튼 영역 */}
      <div className="flex justify-end gap-3">
        {showCancel && onCancel && <CancelButton onClick={onCancel} />}
        <SubmitButton
          label={mode === 'write' ? '등록하기' : '완료'}
          loading={isPending}
        />
      </div>
    </form>
  )
}
