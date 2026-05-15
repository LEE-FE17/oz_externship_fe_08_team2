import { queryOptions, useQuery } from '@tanstack/react-query'
import api from '@/api/instance'
import type { CsHistoryResponse } from './types'

// TODO: FEATURES.md와 API 명세 충돌, FN-CS PDF 기준 적용
export const CS_HISTORY_QUERY_KEY = ['chatbot', 'cs', 'history'] as const

export const csHistoryQueryOptions = queryOptions({
  queryKey: [...CS_HISTORY_QUERY_KEY],
  queryFn: () =>
    api.get<CsHistoryResponse>('/qna/chatbot/completions').then((r) => r.data),
  staleTime: 0,
})

export function useGetCsHistory() {
  return useQuery(csHistoryQueryOptions)
}
