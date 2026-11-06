import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, description,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  danger = false, onConfirm, onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="p-5">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-[color:var(--color-ink-muted)]">{description}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t p-3">
          <button type="button" className="btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
