import { defaultSchema } from 'rehype-sanitize'

// style 속성 허용, blob: 이미지 src 허용, 스크립트/이벤트 핸들러는 차단
export const editorSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'style'],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'u', 'mark'],
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? ['http', 'https']), 'blob'],
  },
}

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

// 웹폰트 로드 실패 시 시스템 폰트(fallback)로 자동 대체됨
export const FONT_FAMILIES = [
  { label: '기본서체', value: 'inherit' },
  {
    label: '노토 산스',
    value: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  {
    label: '나눔고딕',
    value: "'Nanum Gothic', 'Dotum', '돋움', sans-serif",
  },
  {
    label: '나눔명조',
    value: "'Nanum Myeongjo', 'Batang', '바탕', serif",
  },
  {
    label: 'Roboto',
    value: "'Roboto', Arial, Helvetica, sans-serif",
  },
  {
    label: 'Merriweather',
    value: "'Merriweather', Georgia, 'Times New Roman', serif",
  },
  {
    label: 'Source Code Pro',
    value: "'Source Code Pro', 'Courier New', Consolas, monospace",
  },
]

export const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32]

export const TEXT_PALETTE_COLORS = [
  '#ffffff', // 흰색 (배경이 어두울 때 사용)
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

// 배경색 전용 팔레트 (TEXT_PALETTE_COLORS 첫 번째 요소가 이미 '#ffffff'이므로 그대로 사용)
export const BG_PALETTE_COLORS = TEXT_PALETTE_COLORS

// 버튼 클릭 시 textarea 포커스/선택 영역 유지를 위한 공통 props
export const NO_BLUR_PROPS = {
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
}

export const PILL: React.CSSProperties = {
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

export const UNDO_LIMIT = 50
