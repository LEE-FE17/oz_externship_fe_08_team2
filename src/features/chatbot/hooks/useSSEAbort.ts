import { useEffect, useRef } from 'react'

// AbortController 기반 SSE 중단 유틸 훅
export function useSSEAbort() {
  const controllerRef = useRef<AbortController>(new AbortController())

  const reset = () => {
    controllerRef.current.abort()
    controllerRef.current = new AbortController()
    return controllerRef.current.signal
  }

  const abort = () => {
    controllerRef.current.abort()
  }

  const getSignal = () => {
    return controllerRef.current.signal
  }

  useEffect(() => {
    return () => {
      controllerRef.current.abort()
    }
  }, [])

  return {
    getSignal,
    reset,
    abort,
  }
}
