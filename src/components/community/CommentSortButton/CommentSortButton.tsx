import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'

export type SortOrder = 'latest' | 'oldest'

interface CommentSortButtonProps {
  sortOrder: SortOrder
  onChange: (order: SortOrder) => void
}

export function CommentSortButton({
  sortOrder,
  onChange,
}: CommentSortButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowModal(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setShowModal((prev) => !prev)}
        className="flex items-center justify-center gap-1 rounded-lg text-sm transition-colors duration-150"
        style={{ width: '99px', height: '38px', color: '#4D4D4D' }}
      >
        {sortOrder === 'latest' ? '최신순' : '오래된 순'}
        <ArrowUpDown size={14} />
      </button>

      {showModal && (
        <div
          className="absolute top-full right-0 z-10 mt-1 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
          style={{ width: '138px', height: '116px' }}
        >
          {(['latest', 'oldest'] as const).map((order) => {
            const label = order === 'latest' ? '최신순' : '오래된 순'
            const isSelected = sortOrder === order
            return (
              <button
                key={order}
                type="button"
                onClick={() => {
                  onChange(order)
                  setShowModal(false)
                }}
                className="flex items-center justify-center rounded-md text-base transition-colors duration-150"
                style={{
                  width: '118px',
                  height: '42px',
                  backgroundColor: isSelected ? '#EFE6FC' : 'transparent',
                  color: isSelected ? '#6201E0' : '#1a1a1a',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '16px',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    ;(
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = '#ECECEC'
                    ;(e.currentTarget as HTMLButtonElement).style.color =
                      '#4D4D4D'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    ;(
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color =
                      '#1a1a1a'
                  }
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
