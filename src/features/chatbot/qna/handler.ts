import { http, HttpResponse } from 'msw'

export const qnaChatbotHandlers = [
  // GET /api/v1/qna/questions/:questionId/chatbot — 히스토리 조회 및 세션 활성화
  http.get(
    `${import.meta.env.VITE_API_BASE_URL}/qna/questions/:questionId/chatbot`,
    () => {
      // 빈 히스토리 테스트 시 아래 주석 해제:
      // return HttpResponse.json({ results: [] })

      return HttpResponse.json({
        results: [
          {
            role: 'assistant',
            message:
              'TypeScript의 제네릭은 타입을 매개변수화하여 재사용 가능한 컴포넌트를 만드는 기능입니다.',
          },
          { role: 'user', message: '제네릭 제약 조건은 어떻게 사용하나요?' },
          {
            role: 'assistant',
            message:
              '`extends` 키워드를 사용하여 제네릭 타입에 제약을 걸 수 있습니다. 예를 들어 `<T extends string>`처럼 사용합니다.',
          },
        ],
      })
    }
  ),

  // POST /api/v1/qna/questions/:questionId/chatbot — SSE 스트리밍 응답
  http.post(
    `${import.meta.env.VITE_API_BASE_URL}/qna/questions/:questionId/chatbot`,
    ({ request }) => {
      // 429 테스트 시 아래 주석 해제:
      // return new HttpResponse(null, { status: 429 })

      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        start(controller) {
          const chunks = [
            'data: {"message": "제네릭 제약 조건은"}\n\n',
            'data: {"message": " `extends` 키워드를"}\n\n',
            'data: {"message": " 활용하여 타입 범위를"}\n\n',
            'data: {"message": " 제한할 수 있습니다."}\n\n',
            'data: [DONE]\n\n',
          ]

          let i = 0

          const interval = setInterval(() => {
            if (request.signal.aborted) {
              clearInterval(interval)
              controller.close()
              return
            }

            if (i < chunks.length) {
              controller.enqueue(encoder.encode(chunks[i]))
              i += 1
              return
            }

            clearInterval(interval)
            controller.close()
          }, 200)

          request.signal.addEventListener('abort', () => {
            clearInterval(interval)
            controller.close()
          })
        },
      })

      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }
  ),
]
