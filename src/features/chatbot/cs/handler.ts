import { http, HttpResponse } from 'msw'

export const csChatbotHandlers = [
  // GET /api/v1/qna/chatbot/completions — 히스토리 조회
  http.get(
    `${import.meta.env.VITE_API_BASE_URL}/qna/chatbot/completions`,
    () => {
      // 빈 히스토리 테스트 시 아래 주석 해제:
      // return HttpResponse.json({ results: [] })

      return HttpResponse.json({
        results: [
          {
            role: 'assistant',
            message: '안녕하세요! CS 상담 챗봇입니다. 무엇을 도와드릴까요?',
          },
          { role: 'user', message: '수강 신청은 어떻게 하나요?' },
          {
            role: 'assistant',
            message: '메인 페이지에서 수강 신청 버튼을 클릭하시면 됩니다.',
          },
        ],
      })
    }
  ),

  // POST /api/v1/qna/chatbot/completions — SSE 스트리밍 응답
  http.post(
    `${import.meta.env.VITE_API_BASE_URL}/qna/chatbot/completions`,
    ({ request }) => {
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        start(controller) {
          const chunks = [
            'data: {"message": "수강 신청은"}\n\n',
            'data: {"message": " 메인 페이지에서"}\n\n',
            'data: {"message": " 진행하실 수 있습니다."}\n\n',
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
