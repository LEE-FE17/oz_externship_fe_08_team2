import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import React from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { type ICommand } from '@uiw/react-md-editor'
import { UNDO_LIMIT } from './markdownEditorConstants'

export function useMarkdownHistory(
  value: string,
  onChange: (v: string) => void
) {
  const valueRef = useRef(value)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  const handleChange = (newValue: string) => {
    setUndoStack((prev) => {
      const next = [...prev, valueRef.current]
      return next.length > UNDO_LIMIT ? next.slice(-UNDO_LIMIT) : next
    })
    setRedoStack([])
    onChange(newValue)
  }

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setRedoStack((r) => [...r, valueRef.current])
    setUndoStack((u) => u.slice(0, -1))
    onChange(prev)
  }, [undoStack, onChange])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack((u) => [...u, valueRef.current])
    setRedoStack((r) => r.slice(0, -1))
    onChange(next)
  }, [redoStack, onChange])

  const undoCommand = useMemo<ICommand>(
    () => ({
      name: 'undo',
      keyCommand: 'undo',
      buttonProps: {
        'aria-label': '실행 취소',
        title: '실행 취소',
        'data-inactive': undoStack.length === 0 ? 'true' : undefined,
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) =>
          e.preventDefault(),
      } as React.ButtonHTMLAttributes<HTMLButtonElement>,
      icon: React.createElement(Undo2, { size: 14 }),
      execute: handleUndo,
    }),
    [undoStack.length, handleUndo]
  )

  const redoCommand = useMemo<ICommand>(
    () => ({
      name: 'redo',
      keyCommand: 'redo',
      buttonProps: {
        'aria-label': '다시 실행',
        title: '다시 실행',
        'data-inactive': redoStack.length === 0 ? 'true' : undefined,
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) =>
          e.preventDefault(),
      } as React.ButtonHTMLAttributes<HTMLButtonElement>,
      icon: React.createElement(Redo2, { size: 14 }),
      execute: handleRedo,
    }),
    [redoStack.length, handleRedo]
  )

  return {
    valueRef,
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    handleChange,
    undoCommand,
    redoCommand,
  }
}
