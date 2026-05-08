import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export interface PostBodyProps {
  /**
   * 마크다운 + 인라인 HTML 혼합 문자열 (리치텍스트 에디터 출력)
   */
  content: string
}

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'b',
    'i',
    'em',
    'strong',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'code',
    'img',
    'hr',
    'span',
    'div',
    'mark',
    'del',
    's',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style'],
}

export function PostBody({ content }: PostBodyProps) {
  const safe = DOMPurify.sanitize(content, SANITIZE_OPTIONS) as string

  return (
    <div
      className={[
        'text-text-heading min-h-40 py-10 text-base leading-relaxed',
        '[&_p]:mb-3',
        '[&_h1]:text-text-heading [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold',
        '[&_h2]:text-text-heading [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold',
        '[&_h3]:text-text-heading [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold',
        '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6',
        '[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6',
        '[&_li]:mb-1',
        '[&_blockquote]:border-primary [&_blockquote]:text-text-muted [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:pl-4',
        '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_pre]:bg-bg-muted [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-4',
        '[&_code]:bg-bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:text-sm',
        '[&_hr]:border-border-base [&_hr]:my-6',
        '[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse',
        '[&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold',
        '[&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2',
        '[&_mark]:rounded-sm',
      ].join(' ')}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {safe}
      </ReactMarkdown>
    </div>
  )
}
