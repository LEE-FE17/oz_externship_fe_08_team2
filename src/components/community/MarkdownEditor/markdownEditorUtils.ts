export type EditorState = {
  selectedText: string
  text: string
  selection: { start: number; end: number }
}

export type TextApiWithElement = {
  replaceSelection: (t: string) => void
  setSelectionRange: (r: { start: number; end: number }) => void
  textArea?: HTMLTextAreaElement
}

/** getState() 결과에서 전체 상태를 안전하게 꺼냅니다. */
export function safeGetState(
  getState?: () => false | EditorState
): EditorState | null {
  const s = getState?.()
  return s && 'text' in s ? s : null
}

/** 커서가 HTML 태그 내부(<...> 사이)에 있는지 확인합니다. */
export function isCursorInsideTag(text: string, cursor: number): boolean {
  const lastOpen = text.lastIndexOf('<', cursor - 1)
  if (lastOpen === -1) return false
  const lastClose = text.lastIndexOf('>', cursor - 1)
  return lastOpen > lastClose
}

/**
 * 커서가 닫는 HTML 태그(</tag>) 직후에 연속으로 위치한 경우,
 * 태그 스택 내부의 실제 콘텐츠 끝 위치로 이동합니다.
 * 이미 콘텐츠 위치이거나 태그 내부이면 원래 cursor를 그대로 반환합니다.
 *
 * 예: `<mark><span>content</span></mark>|` → content 끝 위치
 *     `<u>content</u>|`                   → content 끝 위치
 *
 * 이를 통해 배경색·밑줄 등 HTML 태그 기반 서식 적용 후에도
 * 곧바로 다른 서식(글자색, 폰트 크기 등)을 연속 적용할 수 있습니다.
 */
export function getEffectiveCursor(text: string, cursor: number): number {
  let pos = cursor
  // 실제 에디터에서 중첩 깊이는 3-4단계 이하이므로 8은 충분한 안전 마진
  const MAX_DEPTH = 8
  for (let i = 0; i < MAX_DEPTH; i++) {
    const before = text.slice(0, pos)
    const m = before.match(/<\/\w+>$/)
    if (!m) break
    const candidate = pos - m[0].length
    if (isCursorInsideTag(text, candidate)) break
    // 후보 위치 바로 앞이 실제 콘텐츠 문자이면 도달
    if (candidate > 0 && /[^\s<>]/.test(text[candidate - 1])) {
      return candidate
    }
    pos = candidate
  }
  return cursor
}

/** 커서 위치 기준 현재 단어 범위를 반환합니다 (인라인 서식용).
 *  HTML 태그 문자(<, >)에서 단어 경계로 처리해 태그 내용 선택을 방지합니다.
 *
 *  커서가 닫는 태그 뒤에 위치한 경우 getEffectiveCursor로 실제 콘텐츠 위치를 구한 뒤 재탐색합니다.
 *  중첩 태그(`</span></mark>|` 등)도 재귀적으로 통과합니다. */
export function getWordRange(
  text: string,
  cursor: number
): { start: number; end: number } | null {
  if (isCursorInsideTag(text, cursor)) return null
  let start = cursor
  let end = cursor
  while (start > 0 && /[^\s<>]/.test(text[start - 1])) start--
  while (end < text.length && /[^\s<>]/.test(text[end])) end++
  if (start < end) return { start, end }

  // 단어 미발견: 닫는 태그 뒤에 커서가 있으면 실제 콘텐츠 위치로 이동 후 재탐색
  const effective = getEffectiveCursor(text, cursor)
  if (effective === cursor) return null
  if (isCursorInsideTag(text, effective)) return null
  let s = effective
  let e = effective
  while (s > 0 && /[^\s<>]/.test(text[s - 1])) s--
  while (e < text.length && /[^\s<>]/.test(text[e])) e++
  return s < e ? { start: s, end: e } : null
}

/** 커서를 감싸는 가장 가까운 <span style="...">...</span> 의 범위를 반환합니다.
 *  이미 스타일이 적용된 span에 다시 서식을 적용할 때 중첩 방지용으로 사용합니다.
 *  커서가 </span> 바로 뒤(spanEnd)에 있는 경우도 포함합니다. */
export function getEnclosingSpanRange(
  text: string,
  cursor: number
): { start: number; end: number } | null {
  // 순방향으로 모든 <span>을 찾아 커서가 포함되는지 확인합니다.
  // cursor <= spanEnd 조건으로 </span> 바로 뒤에 커서가 있을 때도 매칭됩니다.
  const spanOpenRe = /<span\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = spanOpenRe.exec(text)) !== null) {
    const spanStart = match.index
    const openEnd = spanStart + match[0].length
    const closeIdx = text.indexOf('</span>', openEnd)
    if (closeIdx === -1) continue
    const spanEnd = closeIdx + '</span>'.length
    if (cursor >= spanStart && cursor <= spanEnd) {
      return { start: spanStart, end: spanEnd }
    }
  }
  return null
}

/** 커서 위치 기준 현재 줄 범위를 반환합니다 (블록 서식용). */
export function getLineRange(
  text: string,
  cursor: number
): { start: number; end: number } | null {
  if (isCursorInsideTag(text, cursor)) return null
  let start = cursor
  let end = cursor
  while (start > 0 && text[start - 1] !== '\n') start--
  while (end < text.length && text[end] !== '\n') end++
  return start < end ? { start, end } : null
}

/**
 * 번호 목록에서 Tab/Shift+Tab 시 들여쓰기 레벨에 맞는 다음 번호를 계산합니다.
 * beforeIndex 이전 줄들을 역방향으로 탐색해 targetIndent 레벨의 마지막 번호 + 1을 반환합니다.
 */
export function computeNextNumber(
  lines: string[],
  beforeIndex: number,
  targetIndent: string
): number {
  for (let i = beforeIndex - 1; i >= 0; i--) {
    const m = lines[i].match(/^(\s*)(\d+)\. /)
    if (!m) continue
    if (m[1] === targetIndent) return parseInt(m[2], 10) + 1
    if (m[1].length < targetIndent.length) break
  }
  return 1
}

/**
 * fromIndex부터 targetIndent 레벨의 번호 목록 항목들을 순차적으로 재번호합니다.
 * 더 깊은 레벨(하위 목록)은 건너뛰고, 더 얕은 레벨에서 중단합니다.
 */
export function renumberFrom(
  lines: string[],
  fromIndex: number,
  targetIndent: string
): string[] {
  const result = [...lines]
  let counter = computeNextNumber(result, fromIndex, targetIndent)
  for (let i = fromIndex; i < result.length; i++) {
    const m = result[i].match(/^(\s*)(\d+)\. (.*)/)
    if (!m) continue
    if (m[1].length < targetIndent.length) break
    if (m[1] === targetIndent) {
      result[i] = `${targetIndent}${counter}. ${m[3]}`
      counter++
    }
  }
  return result
}

/**
 * execute 핸들러에서 선택 영역이 없으면 현재 단어를 자동 선택 후 wrapFn 적용.
 * 인라인 서식(밑줄, 글자색 등)에 사용합니다.
 */
export function applyInline(
  state: EditorState,
  api: {
    replaceSelection: (t: string) => void
    setSelectionRange: (r: { start: number; end: number }) => void
  },
  wrapFn: (text: string) => string
) {
  if (state.selectedText) {
    api.replaceSelection(wrapFn(state.selectedText))
    return
  }
  const range = getWordRange(state.text, state.selection.start)
  if (range) {
    api.setSelectionRange(range)
    api.replaceSelection(wrapFn(state.text.slice(range.start, range.end)))
  }
}

/**
 * execute 핸들러에서 선택 영역이 없으면 현재 줄을 자동 선택 후 wrapFn 적용.
 * 블록 서식(정렬, 들여쓰기 등)에 사용합니다.
 */
export function applyBlock(
  state: EditorState,
  api: {
    replaceSelection: (t: string) => void
    setSelectionRange: (r: { start: number; end: number }) => void
  },
  wrapFn: (text: string) => string
) {
  if (state.selectedText) {
    api.replaceSelection(wrapFn(state.selectedText))
    return
  }
  const range = getLineRange(state.text, state.selection.start)
  if (range) {
    api.setSelectionRange(range)
    api.replaceSelection(wrapFn(state.text.slice(range.start, range.end)))
  }
}

/**
 * textarea 값을 직접 교체하고 React onChange를 트리거합니다.
 * setSelectionRange → replaceSelection 순서에서 insertTextAtPosition 내부의
 * focus() 호출이 selection을 리셋하는 문제를 우회합니다.
 *
 * React native property setter hack:
 * 원래 HTMLTextAreaElement.prototype.value setter를 호출하면 React가 변경을
 * "dirty"로 인식한 뒤 input 이벤트에서 onChange를 정상 호출합니다.
 */
export function replaceInText(
  textApi: TextApiWithElement,
  fullText: string,
  start: number,
  end: number,
  replacement: string
): boolean {
  const ta = textApi.textArea
  if (!ta) return false
  const newValue = fullText.slice(0, start) + replacement + fullText.slice(end)
  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value'
  )?.set
  if (!nativeSetter) return false
  nativeSetter.call(ta, newValue)
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  ta.selectionStart = ta.selectionEnd = start + replacement.length
  return true
}

/**
 * 드롭다운 children 핸들러용 인라인 서식 적용.
 *
 * 우선순위:
 * 1. 커서가 기존 <span> 안에 있으면 → span 전체를 교체 (선택 여부 무관, 중첩 방지)
 *    커서가 </mark></span> 등 닫는 태그 뒤에 있을 때도 getEffectiveCursor로
 *    실제 콘텐츠 위치를 구해 span을 탐색합니다.
 * 2. 선택 영역 있음 → 선택 텍스트에 적용
 * 3. 선택 없음 → 현재 단어 선택 후 적용
 * 4. 아무것도 없으면 → 아무것도 하지 않음 (빈 span 삽입 방지)
 *
 * replaceInText를 우선 사용해 setSelectionRange + replaceSelection 패턴에서
 * 발생하는 focus() → selection 리셋 문제를 방지합니다.
 */
export function applyInlineFromDropdown(
  getState: (() => false | EditorState) | undefined,
  textApi: TextApiWithElement | undefined,
  wrapFn: (text: string) => string
) {
  const s = safeGetState(getState)
  if (!s || !textApi) return

  // 1. 커서만 있고(선택 없음) 기존 <span> 안이면 span 전체를 교체 (중첩 방지)
  //    선택 영역이 있으면 2번으로 넘어가 선택 텍스트에만 적용 (배경색 span 안에서 부분 글자색 적용 등)
  //    닫는 태그 뒤에 커서가 있을 때는 effectiveCursor로 실제 콘텐츠 위치를 구해 재탐색
  const effectiveCursor = getEffectiveCursor(s.text, s.selection.start)
  const spanRange = getEnclosingSpanRange(s.text, effectiveCursor)
  if (spanRange && !s.selectedText) {
    const innerText = s.text.slice(spanRange.start, spanRange.end)
    const replacement = wrapFn(innerText)
    if (
      !replaceInText(
        textApi,
        s.text,
        spanRange.start,
        spanRange.end,
        replacement
      )
    ) {
      textApi.setSelectionRange(spanRange)
      textApi.replaceSelection(replacement)
    }
    return
  }

  // 2. 선택 영역이 있으면 선택 텍스트에 적용
  if (s.selectedText) {
    const replacement = wrapFn(s.selectedText)
    if (
      !replaceInText(
        textApi,
        s.text,
        s.selection.start,
        s.selection.end,
        replacement
      )
    ) {
      textApi.replaceSelection(replacement)
    }
    return
  }

  // 3. 선택 없음 → effectiveCursor 기준 단어를 선택 후 적용
  const wordRange = getWordRange(s.text, effectiveCursor)
  if (wordRange) {
    const innerText = s.text.slice(wordRange.start, wordRange.end)
    const replacement = wrapFn(innerText)
    if (
      !replaceInText(
        textApi,
        s.text,
        wordRange.start,
        wordRange.end,
        replacement
      )
    ) {
      textApi.setSelectionRange(wordRange)
      textApi.replaceSelection(replacement)
    }
  }
  // 4. 아무것도 없으면 종료 (빈 <span></span> 삽입 안 함)
}

/**
 * 드롭다운 children 핸들러용 블록 서식 적용.
 * 선택 있음 → 선택 텍스트에 적용.
 * 선택 없음 → wrapFn('') 를 커서 위치에 삽입.
 */
export function applyBlockFromDropdown(
  getState: (() => false | EditorState) | undefined,
  textApi: TextApiWithElement | undefined,
  wrapFn: (text: string) => string
) {
  const s = safeGetState(getState)
  if (!s || !textApi) return
  if (s.selectedText) {
    textApi.replaceSelection(wrapFn(s.selectedText))
    return
  }
  textApi.replaceSelection(wrapFn(''))
}

/**
 * 목록 전용 삽입 함수.
 * 선택 있음 → 각 줄 앞에 prefix 추가.
 * 선택 없음 → 현재 줄의 맨 앞으로 커서 이동 후 prefix 삽입.
 *   textarea.selectionStart/End 를 직접 수정해 setSelectionRange(→ focus()) 호출을 피합니다.
 */
export function insertListPrefix(
  getState: (() => false | EditorState) | undefined,
  textApi: TextApiWithElement | undefined,
  prefix: string
) {
  const s = safeGetState(getState)
  if (!s || !textApi) return

  if (s.selectedText) {
    const lines = s.selectedText
      .split('\n')
      .map((l) => `${prefix}${l}`)
      .join('\n')
    textApi.replaceSelection(lines)
    return
  }

  // 선택 없음: 줄 시작 위치를 계산하고 직접 selectionStart/End 설정
  const lineStart = s.text.lastIndexOf('\n', s.selection.start - 1) + 1
  const nextNewline = s.text.indexOf('\n', lineStart)
  const lineEnd = nextNewline === -1 ? s.text.length : nextNewline
  const ta = (textApi as TextApiWithElement).textArea
  if (ta) {
    ta.selectionStart = lineStart
    ta.selectionEnd = lineStart
  }
  textApi.replaceSelection(prefix)
  // prefix 삽입 후 커서를 줄 끝으로 이동
  if (ta) {
    const newCursorPos = lineEnd + prefix.length
    ta.selectionStart = newCursorPos
    ta.selectionEnd = newCursorPos
  }
}

/**
 * 선택 텍스트가 이미 <span style="..."> 이면 해당 CSS 속성만 교체/추가하고,
 * 그렇지 않으면 새 <span>으로 감쌉니다.
 * 중첩 span 누적을 방지합니다.
 */
export function wrapWithStyle(
  selected: string,
  property: string,
  value: string
): string {
  const match = selected.match(/^<span style="([^"]*)">([\s\S]*)<\/span>$/)
  if (match) {
    const existingStyle = match[1]
    const inner = match[2]
    const propRe = new RegExp(`(^|;\\s*)${property}\\s*:[^;]*`, 'i')
    let newStyle: string
    if (propRe.test(existingStyle)) {
      newStyle = existingStyle
        .replace(
          new RegExp(`${property}\\s*:[^;]*`, 'i'),
          `${property}: ${value}`
        )
        .replace(/^;\s*/, '')
        .trim()
    } else if (existingStyle) {
      newStyle = `${existingStyle}; ${property}: ${value}`
    } else {
      newStyle = `${property}: ${value}`
    }
    return `<span style="${newStyle}">${inner}</span>`
  }
  return `<span style="${property}: ${value}">${selected}</span>`
}

/**
 * 선택 텍스트가 이미 <mark style="..."> 이면 background-color만 교체하고,
 * 그렇지 않으면 새 <mark>으로 감쌉니다.
 */
export function wrapMarkWithStyle(selected: string, color: string): string {
  const match = selected.match(/^<mark style="([^"]*)">([\s\S]*)<\/mark>$/)
  if (match) {
    const existingStyle = match[1]
    const inner = match[2]
    const newStyle = existingStyle
      .replace(/background-color\s*:[^;]*/i, `background-color: ${color}`)
      .replace(/^;\s*/, '')
      .trim()
    return `<mark style="${newStyle}">${inner}</mark>`
  }
  return `<mark style="background-color: ${color}">${selected}</mark>`
}

/**
 * span 요소의 style 속성에서 특정 CSS 프로퍼티를 제거합니다.
 * 제거 후 style이 비어지면 span 태그 자체를 제거하고 내용만 남깁니다.
 * 배경색 제거 시 사용합니다.
 */
export function stripStyleProp(html: string, property: string): string {
  const propRe = new RegExp(`${property}\\s*:[^;]*(;\\s*)?`, 'gi')
  // non-greedy([\s\S]*?)를 사용해 첫 번째 </span>에서 멈춥니다.
  // 중첩 span의 경우 replacement의 `${inner}</span>` 패턴이 닫는 태그를 재구성하므로
  // 나머지 </span>이 올바르게 남아 구조가 유지됩니다.
  return html.replace(
    /<span style="([^"]*)">([\s\S]*?)<\/span>/gi,
    (_, style, inner) => {
      const newStyle = style
        .replace(propRe, '')
        .replace(/;{2,}/g, ';')
        .replace(/^;+|;+$/g, '')
        .trim()
      return newStyle ? `<span style="${newStyle}">${inner}</span>` : inner
    }
  )
}

/**
 * 선택 텍스트가 이미 <div style="..."> 이면 해당 CSS 속성만 교체/추가하고,
 * 그렇지 않으면 새 <div>로 감쌉니다.
 * 중첩 div 누적을 방지합니다.
 */
export function wrapDivWithStyle(
  selected: string,
  property: string,
  value: string
): string {
  const match = selected.match(/^<div style="([^"]*)">([\s\S]*)<\/div>$/)
  if (match) {
    const existingStyle = match[1]
    const inner = match[2]
    const propRe = new RegExp(`${property}\\s*:[^;]*`, 'i')
    let newStyle: string
    if (propRe.test(existingStyle)) {
      newStyle = existingStyle
        .replace(propRe, `${property}: ${value}`)
        .replace(/^;\s*/, '')
        .trim()
    } else if (existingStyle) {
      newStyle = `${existingStyle}; ${property}: ${value}`
    } else {
      newStyle = `${property}: ${value}`
    }
    return `<div style="${newStyle}">${inner}</div>`
  }
  return `<div style="${property}: ${value}">${selected}</div>`
}

/** 커서를 감싸는 가장 가까운 <mark style="...">...</mark> 의 범위를 반환합니다.
 *  배경색이 이미 적용된 mark에 다시 색상을 적용하거나 제거할 때 사용합니다.
 *  커서가 </mark> 바로 뒤에 있는 경우도 포함합니다. */
export function getEnclosingMarkRange(
  text: string,
  cursor: number
): { start: number; end: number } | null {
  const markOpenRe = /<mark\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = markOpenRe.exec(text)) !== null) {
    const markStart = match.index
    const openEnd = markStart + match[0].length
    const closeIdx = text.indexOf('</mark>', openEnd)
    if (closeIdx === -1) continue
    const markEnd = closeIdx + '</mark>'.length
    if (cursor >= markStart && cursor <= markEnd) {
      return { start: markStart, end: markEnd }
    }
  }
  return null
}

/** 커서를 감싸는 <u>...</u> 범위를 반환합니다. </u> 바로 뒤 커서도 포함합니다. */
export function getEnclosingURange(
  text: string,
  cursor: number
): { start: number; end: number } | null {
  const re = /<u>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const uStart = m.index
    const closeIdx = text.indexOf('</u>', uStart + m[0].length)
    if (closeIdx === -1) continue
    const uEnd = closeIdx + '</u>'.length
    if (cursor >= uStart && cursor <= uEnd) {
      return { start: uStart, end: uEnd }
    }
  }
  return null
}
