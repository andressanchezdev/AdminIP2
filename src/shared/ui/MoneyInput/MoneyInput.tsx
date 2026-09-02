import type { ChangeEvent, FocusEvent } from 'react'
import { formatMoneyInput, formatMoneyTyping, parseMoneyInput } from '@/shared/lib/formatMoney'

type MoneyInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  placeholder?: string
  min?: number
  'aria-label'?: string
}

/** Campo de dinero COP: miles con punto y decimales con coma (100.000,00). */
export function MoneyInput({
  value,
  onChange,
  disabled,
  className = '',
  id,
  placeholder = '0,00',
  min = 0,
  'aria-label': ariaLabel = 'Valor en pesos',
}: MoneyInputProps) {
  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(formatMoneyTyping(event.target.value))
  }

  const handleBlur = () => {
    if (!value.trim() || value === ',' || value === '0,') {
      onChange('')
      return
    }
    const num = parseMoneyInput(value)
    if (!Number.isFinite(num)) {
      onChange('')
      return
    }
    const clamped = Math.max(min, num)
    onChange(formatMoneyInput(clamped))
  }

  return (
    <div className={`admin-money ${className}`.trim()}>
      <span className="admin-money__prefix" aria-hidden>$</span>
      <input
        id={id}
        className="admin-input admin-money__input admin-input--no-spin"
        type="text"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onFocus={onFocus}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <span className="admin-money__suffix" aria-hidden>COP</span>
    </div>
  )
}

export { parseMoneyInput, formatMoneyInput } from '@/shared/lib/formatMoney'
