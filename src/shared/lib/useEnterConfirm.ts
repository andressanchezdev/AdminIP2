import { useEffect, useRef } from 'react'

/**
 * Enter confirma la acción activa (crear / actualizar / confirmar),
 * excepto cuando el foco está en textarea o el modal está cerrado.
 */
export function useEnterConfirm(isActive: boolean, onConfirm: () => void) {
  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (target.closest('[data-enter-ignore]')) return
      event.preventDefault()
      onConfirmRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive])
}
