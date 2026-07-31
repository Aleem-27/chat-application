interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-lg">
        <h3 className="font-display text-lg text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink-soft">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-accent-tint"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-3 py-2 text-sm font-medium text-white hover:opacity-90 ${
              variant === 'danger' ? 'bg-danger' : 'bg-accent'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}