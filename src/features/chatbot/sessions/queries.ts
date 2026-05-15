import { queryOptions, useQuery } from '@tanstack/react-query'
import api from '@/api/instance'
import type { ChatSessionListResponse } from './types'

export const SESSIONS_QUERY_KEY = ['chatbot', 'sessions'] as const

export const sessionsQueryOptions = queryOptions({
  queryKey: [...SESSIONS_QUERY_KEY],
  queryFn: () =>
    api
      .get<ChatSessionListResponse>('/qna/ai-answer/sessions')
      .then((r) => r.data),
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
})

export function useGetSessions() {
  return useQuery(sessionsQueryOptions)
}
