import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import MDEditor, {
  commands as mdCommands,
  type ICommand,
} from '@uiw/react-md-editor'
import { ChevronDown } from 'lucide-react'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import './MarkdownEditor.css'
import {
  editorSanitizeSchema,
  ACCEPTED_IMAGE_TYPES,
  FONT_FAMILIES,
  FONT_SIZES,
  NO_BLUR_PROPS,
  PILL,
  UNDO_LIMIT,
} from './markdownEditorConstants'
import {
  applyInlineFromDropdown,
  wrapWithStyle,
  computeNextNumber,
  renumberFrom,
} from './markdownEditorUtils'
import {
  boldCommand,
  italicCommand,
  strikethroughCommand,
  underlineCommand,
  bgColorCommand,
  textColorCommand,
  alignLeftCommand,
  alignCenterCommand,
  alignRightCommand,
  alignJustifyCommand,
  listDropdownCmd,
  lineHeightCmd,
  outdentCmd,
  indentCmd,
  clearFormatCmd,
} from './markdownEditorCommands'
import { useMarkdownHistory } from './useMarkdownHistory'
import { useImageUpload } from './useImageUpload'

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
  actions?: React.ReactNode
  wrapperClassName?: string
}

export function MarkdownEditor({
  value,
  onChange,
  error,
  actions,
  wrapperClassName,
}: MarkdownEditorProps) {
  const [selectedFontLabel, setSelectedFontLabel] = useState('기본서체')
  const [selectedFontSize, setSelectedFontSize] = useState(16)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounterRef = useRef(0)
  const editorWrapRef = useRef<HTMLDivElement>(null)

  const {
    valueRef,
    setUndoStack,
    setRedoStack,
    handleChange,
    undoCommand,
    redoCommand,
  } = useMarkdownHistory(value, onChange)

  const { isUploading, imageError, uploadImageFile, imageCommand } =
    useImageUpload(valueRef, onChange)

  // Tab / Enter 인터셉트: 들여쓰기된 목록 항목의 번호·연속성 처리
  // wrap(부모)에 capture 등록 → 라이브러리 textarea 리스너보다 반드시 먼저 실행됨
  useEffect(() => {
    const wrap = editorWrapRef.current
    if (!wrap) return

    const applyText = (
      ta: HTMLTextAreaElement,
      newText: string,
      cursor: number
    ) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value'
      )?.set
      if (!nativeSetter) return
      nativeSetter.call(ta, newText)
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      ta.selectionStart = ta.selectionEnd = cursor
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLTextAreaElement)) return
      const ta = e.target
      const text = ta.value
      const cursor = ta.selectionStart
      const lineStart = text.lastIndexOf('\n', cursor - 1) + 1
      const lineEndRaw = text.indexOf('\n', cursor)
      const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw
      const line = text.slice(lineStart, lineEnd)

      // ── Tab / Shift+Tab: 번호 목록 들여쓰기 + 번호 재정규화 ──
      if (e.key === 'Tab') {
        const match = line.match(/^(\s*)(\d+)\. (.*)/)
        if (!match) return

        e.preventDefault()
        e.stopPropagation()

        const currentIndent = match[1]
        const content = match[3]
        const lines = text.split('\n')
        const lineIndex = (text.slice(0, lineStart).match(/\n/g) ?? []).length

        let newLineStr: string
        let newLines: string[]

        if (!e.shiftKey) {
          // Tab: 3칸 들여쓰기 + 번호 1로 초기화
          const newIndent = currentIndent + '   '
          newLineStr = `${newIndent}1. ${content}`
          newLines = renumberFrom(
            [
              ...lines.slice(0, lineIndex),
              newLineStr,
              ...lines.slice(lineIndex + 1),
            ],
            lineIndex + 1,
            currentIndent
          )
        } else {
          // Shift+Tab: 3칸 내어쓰기 + 부모 레벨 번호 계산
          if (currentIndent.length < 3) return
          const newIndent = currentIndent.slice(3)
          const num = computeNextNumber(lines, lineIndex, newIndent)
          newLineStr = `${newIndent}${num}. ${content}`
          newLines = renumberFrom(
            [
              ...lines.slice(0, lineIndex),
              newLineStr,
              ...lines.slice(lineIndex + 1),
            ],
            lineIndex + 1,
            newIndent
          )
        }

        const newText = newLines.join('\n')
        const newLineStart =
          lineIndex === 0
            ? 0
            : newLines.slice(0, lineIndex).join('\n').length + 1
        applyText(ta, newText, newLineStart + newLineStr.length)
        return
      }

      // ── Enter: 들여쓰기된 목록 항목 연속 생성 ──
      // 라이브러리는 indent 있는 항목을 인식 못함 → 여기서 처리
      // isComposing=true: 한글 IME 조합 중 Enter → 글자 확정만 하고 줄바꿈은 다음 이벤트에서 처리
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.isComposing &&
        ta.selectionStart === ta.selectionEnd
      ) {
        // 들여쓰기된 번호 목록 (비어있지 않은 항목)
        const orderedMatch = line.match(/^( +)(\d+)\. (.+)/)
        if (orderedMatch) {
          e.preventDefault()
          e.stopPropagation()
          const [, indent, numStr] = orderedMatch
          const insertion = `\n${indent}${parseInt(numStr, 10) + 1}. `
          const newText = text.slice(0, cursor) + insertion + text.slice(cursor)
          applyText(ta, newText, cursor + insertion.length)
          return
        }

        // 들여쓰기된 번호 목록 (빈 항목)
        const orderedEmptyMatch = line.match(/^( +)(\d+)\. $/)
        if (orderedEmptyMatch) {
          e.preventDefault()
          e.stopPropagation()
          const [, indent, numStr] = orderedEmptyMatch

          const prevLineEnd = lineStart - 1
          const prevLineStart =
            lineStart > 0 ? text.lastIndexOf('\n', prevLineEnd - 1) + 1 : 0
          const prevLine =
            lineStart > 0 ? text.slice(prevLineStart, prevLineEnd) : ''

          if (prevLine === indent) {
            // 3번째 엔터: 현재 줄을 부모 레벨 번호 목록으로 교체
            const lines = text.split('\n')
            const lineIndex = (text.slice(0, lineStart).match(/\n/g) ?? [])
              .length
            let parentIndent = ''
            for (let i = lineIndex - 1; i >= 0; i--) {
              const m = lines[i].match(/^(\s*)(\d+)\. /)
              if (m && m[1].length < indent.length) {
                parentIndent = m[1]
                break
              }
            }
            const parentNum = computeNextNumber(lines, lineIndex, parentIndent)
            const newLine = `${parentIndent}${parentNum}. `
            const newText =
              text.slice(0, lineStart) + newLine + text.slice(lineEnd)
            applyText(ta, newText, lineStart + newLine.length)
          } else {
            // 2번째 엔터: 들여쓰기 유지, 새 하위 번호 줄 추가
            const nextNum = parseInt(numStr, 10) + 1
            const nextItem = `${indent}${nextNum}. `
            const newText =
              text.slice(0, lineStart) +
              indent +
              `\n${nextItem}` +
              text.slice(lineEnd)
            applyText(
              ta,
              newText,
              lineStart + indent.length + 1 + nextItem.length
            )
          }
          return
        }

        // 들여쓰기된 글머리 목록 (비어있지 않은 항목)
        const bulletMatch = line.match(/^( +)([-*]) (.+)/)
        if (bulletMatch) {
          e.preventDefault()
          e.stopPropagation()
          const [, indent, bullet] = bulletMatch
          const insertion = `\n${indent}${bullet} `
          const newText = text.slice(0, cursor) + insertion + text.slice(cursor)
          applyText(ta, newText, cursor + insertion.length)
          return
        }

        // 들여쓰기된 글머리 목록 (빈 항목)
        const bulletEmptyMatch = line.match(/^( +)([-*]) $/)
        if (bulletEmptyMatch) {
          e.preventDefault()
          e.stopPropagation()
          const [, indent, bullet] = bulletEmptyMatch

          // 이전 줄이 같은 들여쓰기만 있는 줄인지 확인 → 3번째 엔터 감지
          const prevLineEnd = lineStart - 1
          const prevLineStart =
            lineStart > 0 ? text.lastIndexOf('\n', prevLineEnd - 1) + 1 : 0
          const prevLine =
            lineStart > 0 ? text.slice(prevLineStart, prevLineEnd) : ''

          if (prevLine === indent) {
            // 3번째 엔터: 이전 '    ' 줄은 유지, 현재 줄을 부모 레벨 bullet으로 교체
            const lines = text.split('\n')
            const lineIndex = (text.slice(0, lineStart).match(/\n/g) ?? [])
              .length
            let parentIndent = ''
            for (let i = lineIndex - 1; i >= 0; i--) {
              const prevBulletMatch = lines[i].match(/^(\s*)([-*]) /)
              if (
                prevBulletMatch &&
                prevBulletMatch[1].length < indent.length
              ) {
                parentIndent = prevBulletMatch[1]
                break
              }
            }
            const newLine = `${parentIndent}${bullet} `
            const newText =
              text.slice(0, lineStart) + newLine + text.slice(lineEnd)
            applyText(ta, newText, lineStart + newLine.length)
          } else {
            // 2번째 엔터: 현재 줄에서 '-' 제거(들여쓰기 유지), 새 하위 bullet 줄 추가
            const newText =
              text.slice(0, lineStart) +
              indent +
              `\n${indent}${bullet} ` +
              text.slice(lineEnd)
            applyText(
              ta,
              newText,
              lineStart + indent.length + 1 + indent.length + bullet.length + 1
            )
          }
          return
        }

        // 인용문 (빈 항목, '> ' 공백 있음)
        const blockquoteEmptyWithSpaceMatch = line.match(/^(>+) $/)
        if (blockquoteEmptyWithSpaceMatch) {
          e.preventDefault()
          e.stopPropagation()
          const [, markers] = blockquoteEmptyWithSpaceMatch
          // 바로 위 줄이 '>' 구분선이면 → 구분선 + 현재 줄 제거 (인용문 해제)
          const prevLineEnd = lineStart - 1 // lineStart 앞의 '\n'
          const prevLineStart = text.lastIndexOf('\n', prevLineEnd - 1) + 1
          const prevLine = text.slice(prevLineStart, prevLineEnd)
          if (prevLine === markers) {
            const textBefore = text.slice(0, prevLineStart)
            const textAfter = text.slice(lineEnd)
            // 인용문 뒤에 반드시 빈 줄이 있어야 CommonMark lazy continuation 방지
            const needsExtraNewline = !textAfter.startsWith('\n')
            const newText =
              textBefore + (needsExtraNewline ? '\n' : '') + textAfter
            const cursorPos = prevLineStart + (needsExtraNewline ? 1 : 0)
            applyText(ta, newText, cursorPos)
          } else {
            // 위 줄이 구분선이 아니면 → '>' + '\n' + '> ' 삽입 (문단 구분)
            const newText =
              text.slice(0, lineStart) +
              markers +
              '\n' +
              markers +
              ' ' +
              text.slice(lineEnd)
            applyText(ta, newText, lineStart + markers.length * 2 + 2)
          }
          return
        }

        // 인용문 (빈 항목, '>' 공백 없음 → 인용문 해제)
        const blockquoteEmptyMatch = line.match(/^(>+)$/)
        if (blockquoteEmptyMatch) {
          e.preventDefault()
          e.stopPropagation()
          const newText = text.slice(0, lineStart) + text.slice(lineEnd)
          applyText(ta, newText, lineStart)
          return
        }

        // 인용문 (공백 없이 '>' 바로 텍스트 → 라이브러리 자동 계속 방지, 일반 줄바꿈)
        const blockquoteNoSpaceMatch = line.match(/^>+[^ \n]/)
        if (blockquoteNoSpaceMatch) {
          e.preventDefault()
          e.stopPropagation()
          const insertion = '\n'
          const newText = text.slice(0, cursor) + insertion + text.slice(cursor)
          applyText(ta, newText, cursor + insertion.length)
          return
        }

        // 인용문 (내용 있는 항목 → 다음 줄도 인용문 유지, 공백 필수 '> text')
        const blockquoteMatch = line.match(/^(>+) /)
        if (blockquoteMatch) {
          e.preventDefault()
          e.stopPropagation()
          const [, markers] = blockquoteMatch
          const insertion = `\n${markers} `
          const newText = text.slice(0, cursor) + insertion + text.slice(cursor)
          applyText(ta, newText, cursor + insertion.length)
          return
        }
      }
    }

    wrap.addEventListener('keydown', onKeyDown, true)
    return () => wrap.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      const imageFiles = files.filter((f) =>
        ACCEPTED_IMAGE_TYPES.includes(f.type)
      )
      if (imageFiles.length === 0) {
        // 이미지가 아닌 파일 → uploadImageFile 내부의 타입 체크에서 에러 메시지 설정
        if (files.length > 0) await uploadImageFile(files[0], () => {})
        return
      }
      for (const file of imageFiles) {
        await uploadImageFile(file, (md) => {
          const current = valueRef.current
          const sep = current.length > 0 && !current.endsWith('\n') ? '\n' : ''
          setUndoStack((prev) => {
            const next = [...prev, current]
            return next.length > UNDO_LIMIT ? next.slice(-UNDO_LIMIT) : next
          })
          setRedoStack([])
          onChange(current + sep + md)
        })
      }
    },
    [uploadImageFile, onChange, valueRef, setUndoStack, setRedoStack]
  )

  const fontFamilyCommand = useMemo<ICommand>(
    () => ({
      name: 'font-family',
      keyCommand: 'group',
      groupName: 'font-family',
      buttonProps: {
        'aria-label': '글꼴',
        title: '글꼴',
        style: PILL,
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) =>
          e.preventDefault(),
      },
      icon: (
        <span className="toolbar-pill-icon">
          {selectedFontLabel} <ChevronDown size={10} />
        </span>
      ),
      children: ({ close, getState, textApi }) => (
        <div className="toolbar-popup" onMouseDown={(e) => e.preventDefault()}>
          {FONT_FAMILIES.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              style={{ fontFamily: value === 'inherit' ? undefined : value }}
              onClick={() => {
                applyInlineFromDropdown(getState, textApi, (t) =>
                  wrapWithStyle(t, 'font-family', value)
                )
                close()
                setTimeout(() => setSelectedFontLabel(label), 0)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ),
      execute: () => {},
    }),
    [selectedFontLabel]
  )

  const fontSizeCommand = useMemo<ICommand>(
    () => ({
      name: 'font-size',
      keyCommand: 'group',
      groupName: 'font-size',
      buttonProps: {
        'aria-label': '글자 크기',
        title: '글자 크기',
        style: PILL,
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) =>
          e.preventDefault(),
      },
      icon: (
        <span className="toolbar-pill-icon">
          {selectedFontSize} <ChevronDown size={10} />
        </span>
      ),
      children: ({ close, getState, textApi }) => (
        <div
          className="toolbar-popup toolbar-popup--font-size"
          onMouseDown={(e) => e.preventDefault()}
        >
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                applyInlineFromDropdown(getState, textApi, (t) =>
                  wrapWithStyle(t, 'font-size', `${size}px`)
                )
                close()
                setTimeout(() => setSelectedFontSize(size), 0)
              }}
            >
              {size}
            </button>
          ))}
        </div>
      ),
      execute: () => {},
    }),
    [selectedFontSize]
  )

  const editorCommands: ICommand[] = useMemo(
    () => [
      undoCommand,
      redoCommand,
      mdCommands.divider,
      fontFamilyCommand,
      fontSizeCommand,
      mdCommands.divider,
      boldCommand,
      italicCommand,
      underlineCommand,
      strikethroughCommand,
      bgColorCommand,
      textColorCommand,
      mdCommands.divider,
      {
        ...mdCommands.link,
        buttonProps: { ...mdCommands.link.buttonProps, ...NO_BLUR_PROPS },
      },
      imageCommand,
    ],
    [imageCommand, undoCommand, redoCommand, fontFamilyCommand, fontSizeCommand]
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
    <div
      className={
        wrapperClassName != null
          ? `${wrapperClassName}${isDragOver ? 'border-primary border-2' : ''}`
          : `bg-bg-base relative rounded-[20px] border ${isDragOver ? 'border-primary border-2' : 'border-[#cdcdcd]'}`
      }
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault()
        dragCounterRef.current++
        setIsDragOver(true)
      }}
      onDragLeave={() => {
        dragCounterRef.current--
        if (dragCounterRef.current === 0) setIsDragOver(false)
      }}
    >
      {isDragOver && (
        <div className="border-primary bg-primary/5 pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[20px] border-2 border-dashed">
          <p className="text-primary font-medium">이미지를 여기에 놓으세요</p>
        </div>
      )}
      <div
        data-color-mode="light"
        className="post-editor-wrap"
        ref={editorWrapRef}
      >
        <MDEditor
          value={value}
          onChange={(v) => handleChange(v ?? '')}
          preview="live"
          commands={editorCommands}
          extraCommands={editorExtraCommands}
          previewOptions={{
            remarkRehypeOptions: { allowDangerousHtml: true },
            rehypePlugins: [
              [rehypeRaw],
              [rehypeSanitize, editorSanitizeSchema],
            ],
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
      {actions && <div className="flex justify-end px-4 pb-3">{actions}</div>}
    </div>
  )
}
