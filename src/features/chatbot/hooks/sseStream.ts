const DEFAULT_MAX_BUFFER_SIZE = 100_000

interface SseStreamResult {
  completed: boolean
  hasReceivedChunk: boolean
  bufferExceeded: boolean
}

export async function readSseMessageStream({
  response,
  onChunk,
  onBufferExceeded,
  maxBufferSize = DEFAULT_MAX_BUFFER_SIZE,
}: {
  response: Response
  onChunk: (message: string) => void
  onBufferExceeded?: () => void
  maxBufferSize?: number
}): Promise<SseStreamResult> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('ReadableStream 없음')

  const decoder = new TextDecoder()
  let buffer = ''
  let total = 0
  let completed = false
  let hasReceivedChunk = false
  let bufferExceeded = false

  while (!completed && !bufferExceeded) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const dataLine = event
        .split('\n')
        .find((line) => line.startsWith('data:'))
      if (!dataLine) continue

      const data = dataLine.slice(5).trim()
      if (data === '[DONE]') {
        completed = true
        break
      }

      try {
        const chunk = JSON.parse(data) as { message?: unknown }
        if (typeof chunk.message !== 'string') continue

        total += chunk.message.length
        if (total > maxBufferSize) {
          bufferExceeded = true
          onBufferExceeded?.()
          break
        }

        hasReceivedChunk = true
        onChunk(chunk.message)
      } catch {
        // malformed SSE chunk는 무시하고 다음 이벤트를 계속 처리한다.
      }
    }
  }

  return { completed, hasReceivedChunk, bufferExceeded }
}
