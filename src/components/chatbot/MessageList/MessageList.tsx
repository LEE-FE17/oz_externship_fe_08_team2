import { useLayoutEffect, useRef } from 'react'
import rehypeSanitize from 'rehype-sanitize'
import MDEditor from '@uiw/react-md-editor'
import type { ChatMessage } from '@/features/chatbot/widgetTypes'
import { ChatbotRobotImage } from '@/components/chatbot/ChatbotRobotImage'
import userAvatarImg from '@/assets/user-avatar.png'

interface MessageListProps {
  messages: ChatMessage[]
}

function renderAssistantContent(message: ChatMessage) {
  return (
    <div
      data-color-mode="light"
      className="prose prose-sm max-w-none [&_.wmde-markdown]:!bg-transparent [&_.wmde-markdown_*]:!bg-transparent"
    >
      <MDEditor.Markdown
        source={message.message}
        rehypePlugins={[rehypeSanitize]}
      />
    </div>
  )
}

/** AI 로봇 아바타 — Figma: 흰 원 + 그림자 + 로봇 이미지 */
function BotAvatar() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
      style={{ boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)' }}
      aria-hidden="true"
    >
      <ChatbotRobotImage className="h-[33px] w-[33px] object-contain" />
    </div>
  )
}

/** 사용자 아바타 — Figma: 보라 원 + 사람 이미지 */
function UserAvatar() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <img
        src={userAvatarImg}
        alt=""
        className="h-8 w-8 object-cover"
        draggable={false}
      />
    </div>
  )
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  return (
    <div
      role="log"
      aria-label="채팅 메시지 목록"
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic={false}
      className="flex flex-1 flex-col gap-4 overflow-y-auto bg-white p-4"
    >
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user'
        return (
          <div
            key={msg.id ?? idx}
            role="article"
            aria-label={isUser ? '사용자 메시지' : 'AI 답변'}
            className={`flex gap-2 ${
              isUser ? 'flex-row-reverse items-end' : 'flex-row items-start'
            }`}
          >
            {isUser ? <UserAvatar /> : <BotAvatar />}
            <div
              className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-[14px] leading-[19.6px] tracking-[-0.57px] ${
                isUser ? 'text-white' : 'text-[#707070]'
              }`}
              style={{
                backgroundColor: isUser ? '#58249D' : '#F5F5F5',
              }}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap">{msg.message}</p>
              ) : (
                renderAssistantContent(msg)
              )}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
