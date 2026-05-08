import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import MDEditor, {
  commands as mdCommands,
  type ICommand,
} from '@uiw/react-md-editor'
import {
  Undo2,
  Redo2,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ChevronDown,
  ArrowUpDown,
  RemoveFormatting,
  IndentIncrease,
  IndentDecrease,
} from 'lucide-react'
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

const FONT_FAMILIES = [
  { label: '기본서체', value: 'inherit' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: '돋움', value: 'Dotum, sans-serif' },
  { label: '맑은 고딕', value: "'Malgun Gothic', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: "'Courier New', monospace" },
]

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32]

const PALETTE_COLORS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#b7b7b7',
  '#ff0000',
  '#ff7700',
  '#ffff00',
  '#00ff00',
  '#0000ff',
  '#9900ff',
  '#ff00ff',
  '#00ffff',
  '#ff6d6d',
  '#ffd966',
  '#93c47d',
  '#76a5af',
  '#4a86e8',
  '#8e7cc3',
  '#c27ba0',
]

interface EditorFullState {
  text: string
  selectedText: string
  selection: { start: number; end: number }
}

// 정렬 span 제거: 이미 적용된 text-align span을 벗겨냄
function stripAlignSpan(text: string): string {
  return text.replace(
    /^<span style="display: block; text-align: (?:left|center|right|justify)">([\s\S]*)<\/span>$/,
    '$1'
  )
}

// 줄간격 span 제거
function stripLineHeightSpan(text: string): string {
  return text.replace(
    /^<span style="display: block; line-height: [\d.]+">([\s\S]*)<\/span>$/,
    '$1'
  )
}

// 언더라인 토글: 이미 <u>로 감싸져 있으면 제거, 아니면 추가
function toggleUnderline(text: string): string {
  if (/^<u>[\s\S]*<\/u>$/.test(text)) {
    return text.replace(/^<u>([\s\S]*)<\/u>$/, '$1')
  }
  return `<u>${text}</u>`
}

const PILL: React.CSSProperties = {
  borderRadius: 6,
  background: '#f0f2f5',
  border: '1px solid #e2e8f0',
  padding: '0 10px',
  height: 26,
  width: 'auto',
  minWidth: 'auto',
  fontSize: 12,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  cursor: 'pointer',
  color: '#374151',
  fontWeight: 400,
}

function safeSelected(
  getState?: () => false | { selectedText: string }
): string {
  const s = getState?.()
  return (s && 'selectedText' in s ? s.selectedText : '') || ''
}

const fontFamilyCommand: ICommand = {
  name: 'font-family',
  keyCommand: 'group',
  groupName: 'font-family',
  buttonProps: { 'aria-label': '글꼴', title: '글꼴', style: PILL },
  icon: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      기본서체 <ChevronDown size={10} />
    </span>
  ),
  children: ({ close, getState, textApi }) => (
    <div className="toolbar-popup">
      {FONT_FAMILIES.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          style={{ fontFamily: value === 'inherit' ? undefined : value }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const inner = safeSelected(getState)
            const stripped = inner.replace(
              /^<span style="font-family: [^"]*">([\s\S]*)<\/span>$/,
              '$1'
            )
            textApi?.replaceSelection(
              `<span style="font-family: ${value}">${stripped}</span>`
            )
            close()
          }}
        >
          {label}
        </button>
      ))}
    </div>
  ),
  execute: () => {},
}

const fontSizeCommand: ICommand = {
  name: 'font-size',
  keyCommand: 'group',
  groupName: 'font-size',
  buttonProps: { 'aria-label': '글자 크기', title: '글자 크기', style: PILL },
  icon: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      16 <ChevronDown size={10} />
    </span>
  ),
  children: ({ close, getState, textApi }) => (
    <div className="toolbar-popup" style={{ minWidth: 60 }}>
      {FONT_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const inner = safeSelected(getState)
            const stripped = inner.replace(
              /^<span style="font-size: \d+px">([\s\S]*)<\/span>$/,
              '$1'
            )
            textApi?.replaceSelection(
              `<span style="font-size: ${size}px">${stripped}</span>`
            )
            close()
          }}
        >
          {size}
        </button>
      ))}
    </div>
  ),
  execute: () => {},
}

const underlineCommand: ICommand = {
  name: 'underline',
  keyCommand: 'underline',
  buttonProps: { 'aria-label': '밑줄', title: '밑줄' },
  icon: <Underline size={14} />,
  execute: (state, api) => {
    api.replaceSelection(toggleUnderline(state.selectedText))
  },
}

// ~~markdown~~ 대신 <del> HTML을 사용 — markdown 취소선은 HTML 태그와 섞이면 파서가 깨짐
const strikethroughCommand: ICommand = {
  name: 'strikethrough',
  keyCommand: 'strikethrough',
  buttonProps: { 'aria-label': '취소선', title: '취소선' },
  icon: <Strikethrough size={14} />,
  execute: (state, api) => {
    const sel = state.selectedText
    if (/^<del>[\s\S]*<\/del>$/.test(sel)) {
      api.replaceSelection(sel.replace(/^<del>([\s\S]*)<\/del>$/, '$1'))
    } else {
      api.replaceSelection(`<del>${sel}</del>`)
    }
  },
}

const BG_PALETTE_COLORS = ['#ffffff', ...PALETTE_COLORS]

const bgColorCommand: ICommand = {
  name: 'bg-color',
  keyCommand: 'group',
  groupName: 'bg-color',
  buttonProps: { 'aria-label': '배경색', title: '배경색' },
  icon: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          background: '#4285f4',
          border: '1px solid rgba(0,0,0,0.12)',
          display: 'inline-block',
        }}
      />
      <ChevronDown size={10} />
    </span>
  ),
  children: ({ close, getState, textApi }) => (
    <div style={{ padding: 7 }}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const selected = safeSelected(getState)
          textApi?.replaceSelection(
            selected.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/g, '$1')
          )
          close()
        }}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          padding: '4px 8px',
          marginBottom: 6,
          fontSize: 12,
          cursor: 'pointer',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          background: 'transparent',
          color: '#374151',
        }}
      >
        배경색 제거
      </button>
      <div className="color-palette" style={{ padding: 0 }}>
        {BG_PALETTE_COLORS.map((color) => (
          <div
            key={color}
            className="color-swatch"
            style={{
              background: color,
              border:
                color === '#ffffff'
                  ? '1px solid #d1d5db'
                  : '1px solid rgba(0,0,0,0.12)',
            }}
            title={color}
            onClick={() => {
              const state = getState?.() as false | EditorFullState | undefined
              if (!state) {
                close?.()
                return
              }
              const { text, selectedText, selection } = state
              const before = text.substring(0, selection.start)
              const after = text.substring(selection.end)
              // 선택 영역이 이미 mark 태그 안에 있는 경우: 선택을 mark 전체로 확장 후 교체
              const beforeMark = before.match(
                /<mark style="background-color: [^"]*">$/
              )
              const afterMark = after.match(/^<\/mark>/)
              if (beforeMark && afterMark) {
                textApi?.setSelectionRange({
                  start: selection.start - beforeMark[0].length,
                  end: selection.end + afterMark[0].length,
                })
                textApi?.replaceSelection(
                  `<mark style="background-color: ${color}">${selectedText}</mark>`
                )
              } else {
                // 선택 안에 mark 태그가 포함된 경우: 모두 벗기고 새 색상 적용
                const stripped = selectedText.replace(/<\/?mark[^>]*>/g, '')
                textApi?.replaceSelection(
                  `<mark style="background-color: ${color}">${stripped}</mark>`
                )
              }
              close()
            }}
          />
        ))}
      </div>
    </div>
  ),
  execute: () => {},
}

const TEXT_COLOR_SPAN_RE = /^<span style="color: [^"]*">$/

const textColorCommand: ICommand = {
  name: 'text-color',
  keyCommand: 'group',
  groupName: 'text-color',
  buttonProps: { 'aria-label': '글자색', title: '글자색' },
  icon: (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        lineHeight: 1,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 13 }}>A</span>
      <span
        style={{
          width: 14,
          height: 3,
          background: '#e53e3e',
          borderRadius: 1,
          display: 'block',
        }}
      />
    </span>
  ),
  children: ({ close, getState, textApi }) => (
    <div className="color-palette">
      {PALETTE_COLORS.map((color) => (
        <div
          key={color}
          className="color-swatch"
          style={{ background: color }}
          title={color}
          onClick={() => {
            const state = getState?.() as false | EditorFullState | undefined
            if (!state) {
              close?.()
              return
            }
            const { text, selectedText, selection } = state
            const before = text.substring(0, selection.start)
            const after = text.substring(selection.end)
            // 선택 영역이 color span 안에 있는 경우: span 전체로 확장 후 교체
            const beforeSpan = before.match(/<span style="color: [^"]*">$/)
            const afterSpan = after.match(/^<\/span>/)
            if (
              beforeSpan &&
              TEXT_COLOR_SPAN_RE.test(beforeSpan[0]) &&
              afterSpan
            ) {
              textApi?.setSelectionRange({
                start: selection.start - beforeSpan[0].length,
                end: selection.end + afterSpan[0].length,
              })
              textApi?.replaceSelection(
                `<span style="color: ${color}">${selectedText}</span>`
              )
            } else {
              // 선택 안에 color span이 있는 경우: 모두 벗기고 새 색상 적용
              const stripped = selectedText.replace(
                /<span style="color: [^"]*">([\s\S]*?)<\/span>/g,
                '$1'
              )
              textApi?.replaceSelection(
                `<span style="color: ${color}">${stripped}</span>`
              )
            }
            close()
          }}
        />
      ))}
    </div>
  ),
  execute: () => {},
}

const alignLeftCommand: ICommand = {
  name: 'align-left',
  keyCommand: 'align-left',
  buttonProps: { 'aria-label': '왼쪽 정렬', title: '왼쪽 정렬' },
  icon: <AlignLeft size={14} />,
  execute: (state, api) => {
    const sel = state.selectedText
    if (/^<span style="display: block; text-align: left">/.test(sel)) {
      api.replaceSelection(stripAlignSpan(sel))
    } else {
      api.replaceSelection(
        `<span style="display: block; text-align: left">${stripAlignSpan(sel)}</span>`
      )
    }
  },
}

const alignCenterCommand: ICommand = {
  name: 'align-center',
  keyCommand: 'align-center',
  buttonProps: { 'aria-label': '가운데 정렬', title: '가운데 정렬' },
  icon: <AlignCenter size={14} />,
  execute: (state, api) => {
    const sel = state.selectedText
    if (/^<span style="display: block; text-align: center">/.test(sel)) {
      api.replaceSelection(stripAlignSpan(sel))
    } else {
      api.replaceSelection(
        `<span style="display: block; text-align: center">${stripAlignSpan(sel)}</span>`
      )
    }
  },
}

const alignRightCommand: ICommand = {
  name: 'align-right',
  keyCommand: 'align-right',
  buttonProps: { 'aria-label': '오른쪽 정렬', title: '오른쪽 정렬' },
  icon: <AlignRight size={14} />,
  execute: (state, api) => {
    const sel = state.selectedText
    if (/^<span style="display: block; text-align: right">/.test(sel)) {
      api.replaceSelection(stripAlignSpan(sel))
    } else {
      api.replaceSelection(
        `<span style="display: block; text-align: right">${stripAlignSpan(sel)}</span>`
      )
    }
  },
}

const alignJustifyCommand: ICommand = {
  name: 'align-justify',
  keyCommand: 'align-justify',
  buttonProps: { 'aria-label': '양쪽 정렬', title: '양쪽 정렬' },
  icon: <AlignJustify size={14} />,
  execute: (state, api) => {
    const sel = state.selectedText
    if (/^<span style="display: block; text-align: justify">/.test(sel)) {
      api.replaceSelection(stripAlignSpan(sel))
    } else {
      api.replaceSelection(
        `<span style="display: block; text-align: justify">${stripAlignSpan(sel)}</span>`
      )
    }
  },
}

const listDropdownCmd: ICommand = {
  name: 'list-style',
  keyCommand: 'group',
  groupName: 'list-style',
  buttonProps: { 'aria-label': '목록', title: '목록' },
  icon: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <List size={13} />
      <ChevronDown size={10} />
    </span>
  ),
  children: ({ close, getState, textApi }) => (
    <div className="toolbar-popup">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const text = safeSelected(getState)
          const lines = text
            ? text
                .split('\n')
                .map((l) => `- ${l}`)
                .join('\n')
            : '- '
          textApi?.replaceSelection(lines)
          close()
        }}
      >
        글머리 목록
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const text = safeSelected(getState)
          const lines = text
            ? text
                .split('\n')
                .map((l, i) => `${i + 1}. ${l}`)
                .join('\n')
            : '1. '
          textApi?.replaceSelection(lines)
          close()
        }}
      >
        번호 목록
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const text = safeSelected(getState)
          const lines = text
            ? text
                .split('\n')
                .map((l) => `- [ ] ${l}`)
                .join('\n')
            : '- [ ] '
          textApi?.replaceSelection(lines)
          close()
        }}
      >
        체크 목록
      </button>
    </div>
  ),
  execute: () => {},
}

const lineHeightCmd: ICommand = {
  name: 'line-height',
  keyCommand: 'group',
  groupName: 'line-height',
  buttonProps: { 'aria-label': '줄 간격', title: '줄 간격' },
  icon: <ArrowUpDown size={14} />,
  children: ({ close, getState, textApi }) => (
    <div className="toolbar-popup" style={{ minWidth: 80 }}>
      {['1', '1.5', '2', '2.5', '3'].map((h) => (
        <button
          key={h}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const text = safeSelected(getState)
            const stripped = stripLineHeightSpan(text)
            textApi?.replaceSelection(
              `<span style="display: block; line-height: ${h}">${stripped}</span>`
            )
            close()
          }}
        >
          {h}배
        </button>
      ))}
    </div>
  ),
  execute: () => {},
}

const outdentCmd: ICommand = {
  name: 'outdent',
  keyCommand: 'outdent',
  buttonProps: { 'aria-label': '내어쓰기', title: '내어쓰기' },
  icon: <IndentDecrease size={14} />,
  execute: (state, api) => {
    const lines = state.selectedText
      ? state.selectedText
          .split('\n')
          .map((l) => (l.startsWith('  ') ? l.slice(2) : l))
          .join('\n')
      : ''
    api.replaceSelection(lines)
  },
}

const indentCmd: ICommand = {
  name: 'indent',
  keyCommand: 'indent',
  buttonProps: { 'aria-label': '들여쓰기', title: '들여쓰기' },
  icon: <IndentIncrease size={14} />,
  execute: (state, api) => {
    const lines = state.selectedText
      ? state.selectedText
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')
      : '  '
    api.replaceSelection(lines)
  },
}

const clearFormatCmd: ICommand = {
  name: 'clear-format',
  keyCommand: 'clear-format',
  buttonProps: { 'aria-label': '서식 제거', title: '서식 제거' },
  icon: <RemoveFormatting size={14} />,
  execute: (state, api) => {
    if (!state.selectedText) return
    const cleaned = state.selectedText
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/<[^>]+>/gs, '')
    api.replaceSelection(cleaned)
  },
}

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
      icon: <Undo2 size={14} />,
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
      icon: <Redo2 size={14} />,
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
      fontFamilyCommand,
      fontSizeCommand,
      mdCommands.divider,
      mdCommands.bold,
      mdCommands.italic,
      underlineCommand,
      strikethroughCommand,
      bgColorCommand,
      textColorCommand,
      mdCommands.divider,
      mdCommands.link,
      imageCommand,
    ],
    [imageCommand, undoCommand, redoCommand]
  )

  const editorExtraCommands: ICommand[] = useMemo(
    () => [
      listDropdownCmd,
      mdCommands.divider,
      alignLeftCommand,
      alignCenterCommand,
      alignRightCommand,
      alignJustifyCommand,
      lineHeightCmd,
      outdentCmd,
      indentCmd,
      clearFormatCmd,
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
              if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault()
                const textarea = e.currentTarget
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const insert = '<br>\n'
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
