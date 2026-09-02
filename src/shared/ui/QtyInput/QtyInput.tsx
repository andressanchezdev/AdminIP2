import type { FocusEvent, KeyboardEvent } from 'react'

type QtyInputProps = {
  value: number
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  'aria-label'?: string
  onChange: (qty: number) => void
}

/** Cantidad sin flechas visuales; clic selecciona todo; ↑/↓ del teclado ajustan. */
export function QtyInput({
  value,
  min = 1,
  max,
  disabled,
  className = 'admin-input admin-input--qty',
  onChange,
  'aria-label': ariaLabel = 'Cantidad',
}: QtyInputProps) {
  const boundQty = (next: number) => {
    let qty = Number.isFinite(next) ? Math.trunc(next) : min
    if (qty < min) qty = min
    if (typeof max === 'number' && qty > max) qty = max
    return qty
  }

  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onChange(boundQty(value + 1))
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onChange(boundQty(value - 1))
    }
  }

  return (
    <input
      className={`${className} admin-input--no-spin`}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      value={Number.isFinite(value) ? value : min}
      disabled={disabled}
      aria-label={ariaLabel}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onChange={(event) => {
        const raw = event.target.value
        if (raw === '') {
          onChange(min)
          return
        }
        onChange(boundQty(Number(raw)))
      }}
    />
  )
}
