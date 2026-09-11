import { useEffect, useId, useRef, useState } from 'react'
import './PopupSelect.css'

export type PopupSelectOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

type PopupSelectProps = {
  options: PopupSelectOption[]
  value?: string
  onChange: (value: string) => void
  'aria-label'?: string
  className?: string
  disabled?: boolean
  /** `filter` matches toolbar selects. `button` uses `admin-btn`. */
  variant?: 'filter' | 'button'
  align?: 'start' | 'end'
  triggerLabel?: string
}

export function PopupSelect({
  options,
  value = '',
  onChange,
  className = '',
  disabled = false,
  variant = 'filter',
  align = 'start',
  triggerLabel,
  'aria-label': ariaLabel,
}: PopupSelectProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)
  const shown = triggerLabel || selected?.label || 'Seleccionar'
  const wide = variant === 'button' || options.some((option) => option.description)

  useEffect(() => {
    if (!open) return undefined

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointer)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className={`popup-select ${className}`.trim()} ref={wrapRef}>
      <button
        type="button"
        className={
          variant === 'button'
            ? 'admin-btn popup-select__trigger'
            : 'popup-select__trigger popup-select__trigger--filter'
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="popup-select__trigger-label">{shown}</span>
        {variant === 'filter' ? (
          <span className={`popup-select__caret ${open ? 'is-open' : ''}`} aria-hidden />
        ) : null}
      </button>
      {open ? (
        <div
          className={`popup-select__menu ${align === 'end' ? 'popup-select__menu--end' : ''} ${wide ? 'popup-select__menu--wide' : ''}`.trim()}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`popup-select__option ${isSelected ? 'is-selected' : ''}`}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <strong>{option.label}</strong>
                {option.description ? <span>{option.description}</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
