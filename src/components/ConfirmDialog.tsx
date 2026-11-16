import Modal from '@/components/Modal'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  pending: boolean
  // Server error of the confirmed action, displayed in the dialog
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

// Confirmation before a destructive action, built on the generic Modal
function ConfirmDialog({ open, title, message, confirmLabel, pending, error, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="modal-text">{message}</p>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      <div className="modal-actions">
        {/* Cancel first: it gets the initial focus, so Enter never confirms by accident */}
        <button className="add-button" type="button" onClick={onCancel}>Annuler</button>
        {/* aria-disabled instead of disabled: the button keeps the focus while the request runs */}
        <button className="add-button danger-button" type="button" aria-disabled={pending} onClick={() => !pending && onConfirm()}>
          {pending ? 'Patientez…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
