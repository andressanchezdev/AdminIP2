import type { ReactNode } from 'react'
import './Modal.css'

type ModalProps = {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, title, onClose, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="admin-modal-root" role="presentation">
      <button type="button" className="admin-modal-backdrop" aria-label="Cerrar" onClick={onClose} />
      <div
        className={`admin-modal admin-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="admin-modal__header">
          <h2 className="admin-modal__title">{title}</h2>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="admin-modal__body">{children}</div>
        {footer ? <footer className="admin-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
