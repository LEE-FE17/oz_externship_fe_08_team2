import { queryOptions, useQuery } from '@tanstack/react-query'
import api from '@/api/instance'
import type { QnaHistoryResponse } from './types'

export const QNA_HISTORY_QUERY_KEY = (questionId: number) =>
  ['chatbot', 'qna', questionId] as const

export const qnaHistoryQueryOptions = (questionId: number) =>
  queryOptions({
    queryKey: [...QNA_HISTORY_QUERY_KEY(questionId)],
    queryFn: () =>
      api
        .get<QnaHistoryResponse>(`/qna/questions/${questionId}/chatbot`)
        .then((r) => r.data),
    staleTime: 0,
    enabled: Boolean(questionId),
  })

export function useGetQnaHistory(questionId: number) {
  return useQuery(qnaHistoryQueryOptions(questionId))
}
