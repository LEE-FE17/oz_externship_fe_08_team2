import { Modal } from './Modal'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
  cancelLabel?: string
  confirmLabel?: string
  onCancel?: () => void
  onConfirm?: () => void
  /** 확인 버튼 위험 스타일 적용 */
  danger?: boolean
  /** 요청 중 확인 버튼 비활성화 (중복 클릭 방지) */
  isConfirmDisabled?: boolean
  /**
   * false이면 확인 클릭 후 모달을 닫지 않음.
   * 비동기 작업 완료 후 부모가 직접 onClose를 호출해야 함. (기본값: true)
   */
  closeOnConfirm?: boolean
  /** 요청 중 취소 버튼 비활성화 — race condition 방지 */
  isCancelDisabled?: boolean
}

/** Figma 1:3271 — 본문 + 취소/확인 pill 버튼 */
export function ConfirmModal({
  isOpen,
  onClose,
  message,
  cancelLabel = '취소',
  confirmLabel = '삭제',
  onCancel,
  onConfirm,
  danger = false,
  isConfirmDisabled = false,
  closeOnConfirm = true,
  isCancelDisabled = false,
}: ConfirmModalProps) {
  const handleCancel = () => {
    onCancel?.()
    onClose()
  }

  const handleConfirm = () => {
    onConfirm?.()
    if (closeOnConfirm) onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseButton>
      <div className="flex flex-col gap-10">
        <div className="py-3">
          <p className="text-base leading-relaxed tracking-tight whitespace-pre-line text-gray-700">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isCancelDisabled}
            className="bg-primary-100 text-primary-800 hover:bg-primary-200 focus-visible:ring-primary h-[42px] rounded-full px-6 text-base font-semibold tracking-tight transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`h-[42px] rounded-full px-6 text-base font-semibold tracking-tight text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${danger ? 'bg-error hover:bg-error-dark focus-visible:ring-error' : 'bg-primary hover:bg-primary-700 focus-visible:ring-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
