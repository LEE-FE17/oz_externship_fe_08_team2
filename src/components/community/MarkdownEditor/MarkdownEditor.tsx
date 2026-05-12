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

        // 들여쓰기된 번호 목록 (빈 항목 → 상위 레벨로 복귀)
        const orderedEmptyMatch = line.match(/^( +)(\d+)\. $/)
        if (orderedEmptyMatch) {
          e.preventDefault()
          e.stopPropagation()
          const [, indent, numStr] = orderedEmptyMatch
          const nextItem = `${indent}${parseInt(numStr, 10) + 1}. `
          const newText =
            text.slice(0, lineStart) + nextItem + text.slice(lineEnd)
          applyText(ta, newText, lineStart + nextItem.length)
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

const boldCommand: ICommand = {
  name: 'bold',
  keyCommand: 'bold',
  buttonProps: { 'aria-label': '굵게', title: '굵게' },
  icon: <b style={{ fontSize: 13, fontWeight: 700 }}>B</b>,
  execute: (state, api) => {
    const sel = state.selectedText
    const { bold, italic } = detectFormat(sel)
    if (bold && italic) {
      api.replaceSelection(`*${sel.slice(3, -3)}*`)
    } else if (bold) {
      api.replaceSelection(sel.slice(2, -2))
    } else if (italic) {
      api.replaceSelection(`***${sel.slice(1, -1)}***`)
    } else {
      api.replaceSelection(`**${sel || '굵게'}**`)
    }
  },
}

const italicCommand: ICommand = {
  name: 'italic',
  keyCommand: 'italic',
  buttonProps: { 'aria-label': '기울임', title: '기울임' },
  icon: <i style={{ fontSize: 13 }}>I</i>,
  execute: (state, api) => {
    const sel = state.selectedText
    const { bold, italic } = detectFormat(sel)
    if (bold && italic) {
      api.replaceSelection(`**${sel.slice(3, -3)}**`)
    } else if (italic) {
      api.replaceSelection(sel.slice(1, -1))
    } else if (bold) {
      api.replaceSelection(`***${sel.slice(2, -2)}***`)
    } else {
      api.replaceSelection(`*${sel || '기울임'}*`)
    }
  },
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
const TEXT_PALETTE_COLORS = ['#ffffff', ...PALETTE_COLORS]

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
      {TEXT_PALETTE_COLORS.map((color) => (
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

const boldCommand: ICommand = {
  ...mdCommands.bold,
  execute: (state, api) => {
    const sel = state.selectedText
    if (sel.startsWith('***') && sel.endsWith('***') && sel.length >= 6) {
      api.replaceSelection('*' + sel.slice(3, -3) + '*')
    } else if (
      sel.startsWith('**') &&
      !sel.startsWith('***') &&
      sel.endsWith('**') &&
      !sel.endsWith('***') &&
      sel.length >= 4
    ) {
      api.replaceSelection(sel.slice(2, -2))
    } else {
      api.replaceSelection(`**${sel}**`)
    }
  },
}

const italicCommand: ICommand = {
  ...mdCommands.italic,
  execute: (state, api) => {
    const sel = state.selectedText
    if (sel.startsWith('***') && sel.endsWith('***') && sel.length >= 6) {
      api.replaceSelection('**' + sel.slice(3, -3) + '**')
    } else if (
      sel.startsWith('*') &&
      !sel.startsWith('**') &&
      sel.endsWith('*') &&
      !sel.endsWith('**') &&
      sel.length >= 2
    ) {
      api.replaceSelection(sel.slice(1, -1))
    } else {
      api.replaceSelection(`*${sel}*`)
    }
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
            handleChange(valueRef.current.replaceAll(objectUrl, serverUrl))
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
    [onImageUpload, handleChange]
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
