import { useEffect, useId, useRef, type PropsWithChildren } from 'react'

type ModalProps = PropsWithChildren<{
  open: boolean
  title: string
  onClose: () => void
}>

// Native <dialog> opened with showModal(): the browser handles focus trapping, Escape to close,
// the inert background and focus return to the opener. No extra library.
function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // onClose fires on Escape too, so the parent state stays in sync
    <dialog ref={ref} className="modal" aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId} className="modal-title">{title}</h2>
      {/* Content mounted only while open: a form always starts from its initial values */}
      {open && children}
    </dialog>
  )
}

export default Modal
