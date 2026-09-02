import './ScheduleDateTimePicker.css'

type ScheduleDateTimePickerProps = {
  label: string
  value: string
  onChange: (isoLocal: string) => void
  min?: string
  disabled?: boolean
}

/** Convierte ISO a valor datetime-local. */
export function toDatetimeLocalValue(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDatetimeLocalValue(local: string) {
  if (!local) return null
  const date = new Date(local)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Fecha/hora inline (sin pop-up), para el contenedor de programación. */
export function ScheduleDateTimePicker({
  label,
  value,
  onChange,
  min,
  disabled,
}: ScheduleDateTimePickerProps) {
  return (
    <label className="schedule-picker schedule-picker--inline">
      <span className="schedule-picker__label">{label}</span>
      <div className="schedule-picker__row">
        <input
          className="admin-input schedule-picker__input"
          type="datetime-local"
          disabled={disabled}
          min={min}
          value={toDatetimeLocalValue(value || null)}
          onChange={(event) => {
            const iso = fromDatetimeLocalValue(event.target.value)
            onChange(iso ?? '')
          }}
          aria-label={label}
        />
        {value ? (
          <button
            type="button"
            className="schedule-picker__clear"
            disabled={disabled}
            onClick={() => onChange('')}
          >
            Quitar
          </button>
        ) : null}
      </div>
    </label>
  )
}
