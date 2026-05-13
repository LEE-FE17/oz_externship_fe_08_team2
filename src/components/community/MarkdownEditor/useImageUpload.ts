import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import React from 'react'
import { type ICommand } from '@uiw/react-md-editor'
import { usePresignedUrl } from '@/features/posts/write'
import { ACCEPTED_IMAGE_TYPES } from './markdownEditorConstants'

export function useImageUpload(
  valueRef: React.RefObject<string>,
  onChange: (v: string) => void
) {
  const { mutateAsync: getPresignedUrl } = usePresignedUrl()
  const [isUploading, setIsUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const objectUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const uploadImageFile = useCallback(
    async (file: File, insertFn: (md: string) => void) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImageError('JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.')
        return
      }
      setImageError(null)
      setIsUploading(true)
      const objectUrl = URL.createObjectURL(file)
      objectUrlsRef.current.add(objectUrl)
      insertFn(`![${file.name}](${objectUrl})`)
      try {
        const { presigned_url, img_url } = await getPresignedUrl({
          file_name: file.name,
        })
        try {
          await fetch(presigned_url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          })
        } catch (err) {
          if (!import.meta.env.DEV) throw err
          // DEV(MSW) 환경에서는 S3 업로드 실패 무시 — objectUrl로 미리보기 유지
        }
        if (!import.meta.env.DEV) {
          onChange(valueRef.current.replaceAll(objectUrl, img_url))
          URL.revokeObjectURL(objectUrl)
          objectUrlsRef.current.delete(objectUrl)
        }
      } catch {
        URL.revokeObjectURL(objectUrl)
        objectUrlsRef.current.delete(objectUrl)
        setImageError('이미지 업로드에 실패했습니다. 다시 시도해 주세요.')
      } finally {
        setIsUploading(false)
      }
    },
    [getPresignedUrl, onChange, valueRef]
  )

  const imageCommand: ICommand = useMemo(
    () => ({
      name: 'image',
      keyCommand: 'image',
      buttonProps: {
        'aria-label': '이미지 업로드',
        title: '이미지 업로드',
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) =>
          e.preventDefault(),
      },
      icon: React.createElement(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 20 20' },
        React.createElement('path', {
          fill: 'currentColor',
          d: 'M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 6V4h16v11z',
        })
      ),
      execute: (_state, api) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = ACCEPTED_IMAGE_TYPES.join(',')
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) return
          await uploadImageFile(file, (md) => api.replaceSelection(md))
        }
        input.click()
      },
    }),
    [uploadImageFile]
  )

  return {
    isUploading,
    imageError,
    objectUrlsRef,
    uploadImageFile,
    imageCommand,
  }
}
