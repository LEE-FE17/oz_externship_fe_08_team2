import React from 'react'
import { commands as mdCommands, type ICommand } from '@uiw/react-md-editor'
import {
  Underline,
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
import {
  BG_PALETTE_COLORS,
  TEXT_PALETTE_COLORS,
} from './markdownEditorConstants'
import {
  applyInline,
  applyBlock,
  applyInlineFromDropdown,
  applyBlockFromDropdown,
  insertListPrefix,
  wrapWithStyle,
  stripStyleProp,
  wrapDivWithStyle,
  getEnclosingURange,
  getEnclosingMarkRange,
  safeGetState,
  replaceInText,
  type EditorState,
} from './markdownEditorUtils'

/**
 * HTML 인식 Bold 토글.
 * react-md-editor 기본 execute는 \S 기준 단어 선택으로 HTML 속성 안까지 선택될 수 있음.
 * applyInline 사용으로 <> 경계 인식 + isCursorInsideTag 체크.
 *
 * 토글 규칙:
 *   **text**   → text       (bold 제거)
 *   *text*     → ***text*** (이미 italic → bold+italic 추가)
 *   text       → **text**   (bold 추가)
 */
export const boldCommand: ICommand = {
  ...mdCommands.bold,
  execute: (state: EditorState, api) =>
    applyInline(state, api, (t) => {
      if (t.startsWith('**') && t.endsWith('**') && t.length >= 4) {
        return t.slice(2, -2)
      }
      return `**${t}**`
    }),
}

/**
 * HTML 인식 Italic 토글.
 * Bold 마커 **를 italic 마커 *로 잘못 인식하는 버그 수정.
 *
 * 토글 규칙:
 *   ***text*** → **text**   (bold+italic → bold만 남김)
 *   *text*     → text       (italic 제거, **로 시작하지 않을 때만)
 *   **text**   → ***text*** (이미 bold → bold+italic 추가)
 *   text       → *text*     (italic 추가)
 */
export const italicCommand: ICommand = {
  ...mdCommands.italic,
  execute: (state: EditorState, api) =>
    applyInline(state, api, (t) => {
      if (t.startsWith('***') && t.endsWith('***') && t.length >= 6) {
        return `**${t.slice(3, -3)}**`
      }
      if (t.startsWith('**') && t.endsWith('**') && t.length >= 4) {
        return `***${t.slice(2, -2)}***`
      }
      if (t.startsWith('*') && t.endsWith('*') && t.length >= 2) {
        return t.slice(1, -1)
      }
      return `*${t}*`
    }),
}

/**
 * HTML 인식 Strikethrough 토글.
 * applyInline 사용으로 HTML 속성 안까지 선택되는 문제 방지.
 */
export const strikethroughCommand: ICommand = {
  ...mdCommands.strikethrough,
  execute: (state: EditorState, api) =>
    applyInline(state, api, (t) => {
      if (t.startsWith('~~') && t.endsWith('~~') && t.length >= 4) {
        return t.slice(2, -2)
      }
      return `~~${t}~~`
    }),
}

/** 밑줄 토글: 커서가 <u> 안에 있거나 선택 텍스트가 <u>로 감싸져 있으면 제거, 아니면 추가 */
export const underlineCommand: ICommand = {
  name: 'underline',
  keyCommand: 'underline',
  buttonProps: {
    'aria-label': '밑줄',
    title: '밑줄',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(Underline, { size: 14 }),
  execute: (state, api) => {
    // 선택 없이 커서가 <u>...</u> 안에 있으면 → <u> 전체 선택 후 제거
    if (!state.selectedText) {
      const uRange = getEnclosingURange(state.text, state.selection.start)
      if (uRange) {
        const inner = state.text.slice(
          uRange.start + '<u>'.length,
          uRange.end - '</u>'.length
        )
        api.setSelectionRange(uRange)
        api.replaceSelection(inner)
        return
      }
    }
    applyInline(state, api, (text) => {
      const uMatch = text.match(/^<u>([\s\S]*)<\/u>$/)
      return uMatch ? uMatch[1] : `<u>${text}</u>`
    })
  },
}

export function makeColorCommand(
  name: string,
  label: string,
  icon: React.ReactElement,
  colors: string[],
  wrap: (color: string, text: string) => string
): ICommand {
  return {
    name,
    keyCommand: 'group',
    groupName: name,
    // onMouseDown: preventDefault → 팔레트 클릭 시 에디터 포커스/선택 영역 유지
    buttonProps: {
      'aria-label': label,
      title: label,
      onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) =>
        e.preventDefault(),
    },
    icon,
    children: ({ close, getState, textApi }) =>
      React.createElement(
        'div',
        {
          className: 'color-palette',
          onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
        },
        colors.map((color) =>
          React.createElement('div', {
            key: color,
            className: 'color-swatch',
            style: { background: color },
            'data-white': color === '#ffffff' ? 'true' : undefined,
            title: color === '#ffffff' ? '흰색' : color,
            onClick: () => {
              applyInlineFromDropdown(getState, textApi, (t) => wrap(color, t))
              close()
            },
          })
        )
      ),
    execute: () => {},
  }
}

/**
 * 배경색 커맨드.
 * 기존 <mark> 방식 대신 <span style="background-color: ...">을 사용합니다.
 * - font-size, color 등 다른 스타일과 같은 <span>에 병합되어
 *   폰트 크기가 클 때 배경이 텍스트를 벗어나는 CSS 문제를 방지합니다.
 * - 레거시 <mark> 콘텐츠는 색상 변경/제거 시 <span>으로 변환합니다.
 */
export const bgColorCommand: ICommand = {
  name: 'bg-color',
  keyCommand: 'group',
  groupName: 'bg-color',
  buttonProps: {
    'aria-label': '배경색',
    title: '배경색',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center', gap: 3 } },
    React.createElement('span', {
      style: {
        width: 16,
        height: 16,
        borderRadius: 3,
        background: '#4285f4',
        border: '1px solid rgba(0,0,0,0.12)',
        display: 'inline-block',
      },
    }),
    React.createElement(ChevronDown, { size: 10 })
  ),
  children: ({ close, getState, textApi }) =>
    React.createElement(
      'div',
      {
        className: 'bg-color-popup',
        onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      },
      // ── 배경 제거 버튼 ──
      React.createElement(
        'button',
        {
          type: 'button',
          className: 'bg-color-remove-btn',
          onClick: () => {
            const s = safeGetState(getState)
            if (s && textApi) {
              // 레거시: 커서가 <mark> 안에 있으면 mark 태그 전체 제거
              const markRange = getEnclosingMarkRange(s.text, s.selection.start)
              if (markRange && !s.selectedText) {
                const inner = s.text
                  .slice(markRange.start, markRange.end)
                  .replace(/<mark[^>]*>([\s\S]*?)<\/mark>/g, '$1')
                if (
                  !replaceInText(
                    textApi,
                    s.text,
                    markRange.start,
                    markRange.end,
                    inner
                  )
                ) {
                  textApi.setSelectionRange(markRange)
                  textApi.replaceSelection(inner)
                }
                close()
                return
              }
            }
            // 신규: span의 background-color 속성 제거 + 레거시 mark 제거
            applyInlineFromDropdown(getState, textApi, (t) => {
              const withoutMark = t.replace(
                /<mark[^>]*>([\s\S]*?)<\/mark>/g,
                '$1'
              )
              return stripStyleProp(withoutMark, 'background-color')
            })
            close()
          },
        },
        '✕ 배경 제거'
      ),
      // ── 색상 팔레트 ──
      React.createElement(
        'div',
        { className: 'color-palette' },
        BG_PALETTE_COLORS.map((color) =>
          React.createElement('div', {
            key: color,
            className: 'color-swatch',
            style: {
              background: color,
              border:
                color === '#ffffff'
                  ? '1px solid #cdcdcd'
                  : '1px solid rgba(0,0,0,0.12)',
            },
            title: color === '#ffffff' ? '흰색' : color,
            onClick: () => {
              const s = safeGetState(getState)
              if (s && textApi) {
                // 레거시: 커서가 <mark> 안에 있으면 mark를 span으로 변환
                const markRange = getEnclosingMarkRange(
                  s.text,
                  s.selection.start
                )
                if (markRange && !s.selectedText) {
                  const inner = s.text
                    .slice(markRange.start, markRange.end)
                    .replace(/<mark[^>]*>([\s\S]*?)<\/mark>/g, '$1')
                  const replacement = wrapWithStyle(
                    inner,
                    'background-color',
                    color
                  )
                  if (
                    !replaceInText(
                      textApi,
                      s.text,
                      markRange.start,
                      markRange.end,
                      replacement
                    )
                  ) {
                    textApi.setSelectionRange(markRange)
                    textApi.replaceSelection(replacement)
                  }
                  close()
                  return
                }
              }
              // 신규: background-color를 span style로 추가 (기존 span에 병합)
              applyInlineFromDropdown(getState, textApi, (t) =>
                wrapWithStyle(t, 'background-color', color)
              )
              close()
            },
          })
        )
      )
    ),
  execute: () => {},
}

export const textColorCommand: ICommand = makeColorCommand(
  'text-color',
  '글자색',
  React.createElement(
    'span',
    {
      style: {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        lineHeight: 1,
      },
    },
    React.createElement(
      'span',
      { style: { fontWeight: 700, fontSize: 13 } },
      'A'
    ),
    React.createElement('span', {
      style: {
        width: 14,
        height: 3,
        background: '#e53e3e',
        borderRadius: 1,
        display: 'block',
      },
    })
  ),
  TEXT_PALETTE_COLORS,
  (color, text) => wrapWithStyle(text, 'color', color)
)

export const alignLeftCommand: ICommand = {
  name: 'align-left',
  keyCommand: 'align-left',
  buttonProps: {
    'aria-label': '왼쪽 정렬',
    title: '왼쪽 정렬',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(AlignLeft, { size: 14 }),
  execute: (state, api) =>
    applyBlock(state, api, (t) => wrapDivWithStyle(t, 'text-align', 'left')),
}

export const alignCenterCommand: ICommand = {
  name: 'align-center',
  keyCommand: 'align-center',
  buttonProps: {
    'aria-label': '가운데 정렬',
    title: '가운데 정렬',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(AlignCenter, { size: 14 }),
  execute: (state, api) =>
    applyBlock(state, api, (t) => wrapDivWithStyle(t, 'text-align', 'center')),
}

export const alignRightCommand: ICommand = {
  name: 'align-right',
  keyCommand: 'align-right',
  buttonProps: {
    'aria-label': '오른쪽 정렬',
    title: '오른쪽 정렬',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(AlignRight, { size: 14 }),
  execute: (state, api) =>
    applyBlock(state, api, (t) => wrapDivWithStyle(t, 'text-align', 'right')),
}

export const alignJustifyCommand: ICommand = {
  name: 'align-justify',
  keyCommand: 'align-justify',
  buttonProps: {
    'aria-label': '양쪽 정렬',
    title: '양쪽 정렬',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(AlignJustify, { size: 14 }),
  execute: (state, api) =>
    applyBlock(state, api, (t) => wrapDivWithStyle(t, 'text-align', 'justify')),
}

export const listDropdownCmd: ICommand = {
  name: 'list-style',
  keyCommand: 'group',
  groupName: 'list-style',
  buttonProps: {
    'aria-label': '목록',
    title: '목록',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center', gap: 2 } },
    React.createElement(List, { size: 13 }),
    React.createElement(ChevronDown, { size: 10 })
  ),
  children: ({ close, getState, textApi }) =>
    React.createElement(
      'div',
      {
        className: 'toolbar-popup',
        onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            insertListPrefix(getState, textApi, '- ')
            close()
          },
        },
        '글머리 목록'
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            insertListPrefix(getState, textApi, '1. ')
            close()
          },
        },
        '번호 목록'
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            insertListPrefix(getState, textApi, '- [ ] ')
            close()
          },
        },
        '체크 목록'
      )
    ),
  execute: () => {},
}

export const lineHeightCmd: ICommand = {
  name: 'line-height',
  keyCommand: 'group',
  groupName: 'line-height',
  buttonProps: {
    'aria-label': '줄 간격',
    title: '줄 간격',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(ArrowUpDown, { size: 14 }),
  children: ({ close, getState, textApi }) =>
    React.createElement(
      'div',
      {
        className: 'toolbar-popup',
        style: { minWidth: 80 },
        onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      },
      ['1', '1.5', '2', '2.5', '3'].map((h) =>
        React.createElement(
          'button',
          {
            key: h,
            type: 'button',
            onClick: () => {
              applyBlockFromDropdown(getState, textApi, (t) =>
                wrapDivWithStyle(t, 'line-height', h)
              )
              close()
            },
          },
          `${h}배`
        )
      )
    ),
  execute: () => {},
}

export const outdentCmd: ICommand = {
  name: 'outdent',
  keyCommand: 'outdent',
  buttonProps: {
    'aria-label': '내어쓰기',
    title: '내어쓰기',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(IndentDecrease, { size: 14 }),
  execute: (state, api) =>
    applyBlock(state, api, (t) =>
      t
        .split('\n')
        .map((l) => (l.startsWith('  ') ? l.slice(2) : l))
        .join('\n')
    ),
}

export const indentCmd: ICommand = {
  name: 'indent',
  keyCommand: 'indent',
  buttonProps: {
    'aria-label': '들여쓰기',
    title: '들여쓰기',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(IndentIncrease, { size: 14 }),
  execute: (state, api) =>
    applyBlock(state, api, (t) =>
      t
        .split('\n')
        .map((l) => `  ${l}`)
        .join('\n')
    ),
}

export const clearFormatCmd: ICommand = {
  name: 'clear-format',
  keyCommand: 'clear-format',
  buttonProps: {
    'aria-label': '서식 제거',
    title: '서식 제거',
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  },
  icon: React.createElement(RemoveFormatting, { size: 14 }),
  execute: (state, api) =>
    applyInline(state, api, (t) =>
      t
        .replace(/\*\*(.*?)\*\*/gs, '$1')
        .replace(/\*(.*?)\*/gs, '$1')
        .replace(/~~(.*?)~~/gs, '$1')
        .replace(/<[^>]+>/gs, '')
    ),
}
