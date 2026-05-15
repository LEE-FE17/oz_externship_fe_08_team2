import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { ChatMessage } from '@/features/chatbot/widgetTypes'
import { useAuthStore } from '@/stores/authStore'
import { redirectToLogin } from '@/utils/loginRedirect'
import { readSseMessageStream } from './sseStream'

const ERROR_TEXT = '응답을 불러오지 못했습니다. 다시 시도해주세요.'
const ERROR_BUFFER_TEXT = '응답이 너무 길어 중단되었습니다.'
const DONE_COOLDOWN_MS = 500

function clearAuthAndRedirectToLogin() {
  useAuthStore.getState().logout()
  localStorage.removeItem('accessToken')
  redirectToLogin()
}

function createChatMessage(
  prefix: string,
  role: ChatMessage['role'],
  message: string
): ChatMessage & { id: string } {
  return {
    id: `${prefix}-${role}-${crypto.randomUUID()}`,
    role,
    message,
  }
}

function updateAssistantMessage(
  messages: ChatMessage[],
  assistantId: string,
  updater: (message: string) => string
) {
  return messages.map((msg) =>
    msg.id === assistantId ? { ...msg, message: updater(msg.message) } : msg
  )
}

async function requestStream(
  endpoint: string,
  message: string,
  signal: AbortSignal
) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
    signal,
  })
}

function invalidateQueries(queryClient: QueryClient, queryKeys: QueryKey[]) {
  queryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey })
  })
}

function handleHttpStatus({
  response,
  assistantId,
  onRateLimit,
}: {
  response: Response
  assistantId: string
  onRateLimit?: (assistantId: string) => void
}) {
  if (response.status === 401) {
    clearAuthAndRedirectToLogin()
    return true
  }
  if (response.status === 429 && onRateLimit) {
    onRateLimit(assistantId)
    return true
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return false
}

function appendErrorMessage(
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  idPrefix: string,
  message: string
) {
  setMessages((prev) => [
    ...prev,
    createChatMessage(`${idPrefix}-error`, 'assistant', message),
  ])
}

function waitForDoneCooldown(signal: AbortSignal) {
  if (signal.aborted) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timeoutId)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timeoutId = setTimeout(finish, DONE_COOLDOWN_MS)

    signal.addEventListener('abort', finish, { once: true })
  })
}

export async function sendStreamingMessage({
  text,
  endpoint,
  idPrefix,
  isBlocked,
  reset,
  abort,
  setMessages,
  setIsStreaming,
  queryClient,
  invalidateQueryKeys,
  onRateLimit,
}: {
  text: string
  endpoint: string
  idPrefix: string
  isBlocked: boolean
  reset: () => AbortSignal
  abort: () => void
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>
  queryClient: QueryClient
  invalidateQueryKeys: QueryKey[]
  onRateLimit?: (assistantId: string) => void
}) {
  const trimmed = text.trim()
  if (!trimmed || isBlocked) return

  const userMsg = createChatMessage(idPrefix, 'user', trimmed)
  const assistantMsg = createChatMessage(idPrefix, 'assistant', '')
  const assistantId = assistantMsg.id

  setMessages((prev) => [...prev, userMsg, assistantMsg])
  setIsStreaming(true)

  let completed = false
  let hasReceivedChunk = false

  try {
    const signal = reset()
    const response = await requestStream(endpoint, trimmed, signal)
    if (handleHttpStatus({ response, assistantId, onRateLimit })) return

    const result = await readSseMessageStream({
      response,
      onBufferExceeded: abort,
      onChunk: (chunk) => {
        setMessages((prev) =>
          updateAssistantMessage(
            prev,
            assistantId,
            (message) => message + chunk
          )
        )
      },
    })
    completed = result.completed
    hasReceivedChunk = result.hasReceivedChunk

    if (result.completed) {
      await waitForDoneCooldown(signal)
    }

    if (result.bufferExceeded) {
      appendErrorMessage(setMessages, idPrefix, ERROR_BUFFER_TEXT)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return

    setMessages((prev) =>
      hasReceivedChunk
        ? [
            ...prev,
            createChatMessage(`${idPrefix}-error`, 'assistant', ERROR_TEXT),
          ]
        : updateAssistantMessage(prev, assistantId, () => ERROR_TEXT)
    )
  } finally {
    setIsStreaming(false)
    if (completed || hasReceivedChunk) {
      invalidateQueries(queryClient, invalidateQueryKeys)
    }
  }
}
