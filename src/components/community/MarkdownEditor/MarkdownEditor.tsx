import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import MDEditor, {
  commands as mdCommands,
  type ICommand,
} from '@uiw/react-md-editor'
import './MarkdownEditor.css'

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  error?: string
}

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const UNDO_LIMIT = 50

export function MarkdownEditor({
  value,
  onChange,
  onImageUpload,
  error,
}: MarkdownEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const valueRef = useRef(value)
  const objectUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const handleChange = (newValue: string) => {
    setUndoStack((prev) => {
      const next = [...prev, valueRef.current]
      return next.length > UNDO_LIMIT ? next.slice(-UNDO_LIMIT) : next
    })
    setRedoStack([])
    onChange(newValue)
  }

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setRedoStack((r) => [...r, valueRef.current])
    setUndoStack((u) => u.slice(0, -1))
    onChange(prev)
  }, [undoStack, onChange])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack((u) => [...u, valueRef.current])
    setRedoStack((r) => r.slice(0, -1))
    onChange(next)
  }, [redoStack, onChange])

  const undoCommand = useMemo<ICommand>(
    () => ({
      name: 'undo',
      keyCommand: 'undo',
      buttonProps: {
        'aria-label': '실행 취소',
        title: '실행 취소',
        'data-inactive': undoStack.length === 0 ? 'true' : undefined,
      } as React.ButtonHTMLAttributes<HTMLButtonElement>,
      icon: <span style={{ fontSize: 13 }}>↩</span>,
      execute: handleUndo,
    }),
    [undoStack.length, handleUndo]
  )

  const redoCommand = useMemo<ICommand>(
    () => ({
      name: 'redo',
      keyCommand: 'redo',
      buttonProps: {
        'aria-label': '다시 실행',
        title: '다시 실행',
        'data-inactive': redoStack.length === 0 ? 'true' : undefined,
      } as React.ButtonHTMLAttributes<HTMLButtonElement>,
      icon: <span style={{ fontSize: 13 }}>↪</span>,
      execute: handleRedo,
    }),
    [redoStack.length, handleRedo]
  )

  const imageCommand: ICommand = useMemo(
    () => ({
      name: 'image',
      keyCommand: 'image',
      buttonProps: { 'aria-label': '이미지 업로드', title: '이미지 업로드' },
      icon: (
        <svg width="14" height="14" viewBox="0 0 20 20">
          <path
            fill="currentColor"
            d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 6V4h16v11z"
          />
        </svg>
      ),
      execute: (_state, api) => {
        if (!onImageUpload) return
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = ACCEPTED_IMAGE_TYPES.join(',')
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) return
          if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            setImageError('JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.')
            return
          }
          setImageError(null)
          setIsUploading(true)
          const objectUrl = URL.createObjectURL(file)
          objectUrlsRef.current.add(objectUrl)
          api.replaceSelection(`![${file.name}](${objectUrl})`)
          try {
            const serverUrl = await onImageUpload(file)
            onChange(valueRef.current.replaceAll(objectUrl, serverUrl))
            URL.revokeObjectURL(objectUrl)
            objectUrlsRef.current.delete(objectUrl)
          } catch {
            URL.revokeObjectURL(objectUrl)
            objectUrlsRef.current.delete(objectUrl)
            setImageError('이미지 업로드에 실패했습니다. 다시 시도해 주세요.')
          } finally {
            setIsUploading(false)
          }
        }
        input.click()
      },
    }),
    [onImageUpload, onChange]
  )

  const editorCommands: ICommand[] = useMemo(
    () => [
      undoCommand,
      redoCommand,
      mdCommands.divider,
      mdCommands.bold,
      mdCommands.italic,
      mdCommands.strikethrough,
      mdCommands.divider,
      mdCommands.title,
      mdCommands.divider,
      mdCommands.link,
      imageCommand,
    ],
    [imageCommand, undoCommand, redoCommand]
  )

  const editorExtraCommands: ICommand[] = useMemo(
    () => [
      mdCommands.unorderedListCommand,
      mdCommands.orderedListCommand,
      mdCommands.checkedListCommand,
      mdCommands.divider,
      mdCommands.quote,
      mdCommands.hr,
      mdCommands.divider,
      mdCommands.code,
      mdCommands.codeBlock,
      mdCommands.divider,
      mdCommands.table,
    ],
    []
  )

  return (
    <div className="bg-bg-base rounded-[20px] border border-[#cdcdcd]">
      <div data-color-mode="light" className="post-editor-wrap">
        <MDEditor
          value={value}
          onChange={(v) => handleChange(v ?? '')}
          preview="live"
          commands={editorCommands}
          extraCommands={editorExtraCommands}
          textareaProps={{
            onKeyDown: (e) => {
              if (e.key === 'Tab') {
                e.preventDefault()
                const textarea = e.currentTarget
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const insert = '  '
                const current = textarea.value
                const next =
                  current.substring(0, start) + insert + current.substring(end)
                handleChange(next)
                requestAnimationFrame(() => {
                  textarea.selectionStart = start + insert.length
                  textarea.selectionEnd = start + insert.length
                })
              }
            },
          }}
        />
      </div>
      {isUploading && (
        <p className="text-text-muted px-4 pb-2 text-xs" aria-live="polite">
          이미지 업로드 중...
        </p>
      )}
      {imageError && (
        <p className="text-error px-4 pb-2 text-xs" role="alert">
          {imageError}
        </p>
      )}
      {error && (
        <p className="text-error px-4 pb-2 text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
