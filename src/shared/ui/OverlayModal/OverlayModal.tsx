import { useEffect, type ReactNode } from 'react'
import { namedControl } from '@/shared/lib/namedControl'
import './OverlayModal.css'

type OverlayModalProps = {
  isOpen: boolean
  onClose?: () => void
  labelledBy?: string
  className?: string
  backdropClassName?: string
  children: ReactNode
}

/** Modal overlay idéntico al de ClienteIP (AuthModal). No confundir con Modal admin CRUD. */
export function OverlayModal({
  isOpen,
  onClose,
  labelledBy,
  className = '',
  backdropClassName = '',
  children,
}: OverlayModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div
        className={`modal-backdrop ${backdropClassName}`.trim()}
        onClick={onClose}
        {...namedControl('Cerrar')}
      />
      <div
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </>
  )
}
