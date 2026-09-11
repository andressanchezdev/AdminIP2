import { useEffect, useId, useRef, useState } from 'react'
import '../PopupSelect/PopupSelect.css'
import './MultiSelectFilter.css'

export type MultiSelectOption = {
  value: string
  label: string
  /** Texto auxiliar a la derecha (p. ej. conteo). */
  hint?: string
  /** Opción especial (Todas / Ninguna): no usa toggle normal. */
  kind?: 'option' | 'all' | 'none'
}

type MultiSelectFilterProps = {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  /** Valores concretos (sin all/none) usados para “todas”. */
  allValues: string[]
  emptyLabel?: string
  allLabel?: string
  noneLabel?: string
  className?: string
}

function triggerLabel(
  selected: string[],
  allValues: string[],
  emptyLabel: string,
  allLabel: string,
) {
  if (selected.length === 0) return emptyLabel
  if (selected.length === allValues.length && allValues.every((item) => selected.includes(item))) {
    return allLabel
  }
  if (selected.length === 1) return selected[0]
  return `${selected.length} seleccionadas`
}

/** Filtro multi-opción con el mismo popup que Descargar contexto. */
export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  allValues,
  emptyLabel = 'Ninguna',
  allLabel = 'Todas',
  noneLabel = 'Ninguna',
  className = '',
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const allSelected = allValues.length > 0
    && allValues.every((item) => value.includes(item))
    && value.length === allValues.length
  const noneSelected = value.length === 0

  useEffect(() => {
    if (!open) return undefined

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
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

  const toggleOption = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    )
  }

  const handleOptionClick = (option: MultiSelectOption) => {
    if (option.kind === 'all') {
      onChange([...allValues])
      return
    }
    if (option.kind === 'none') {
      onChange([])
      return
    }
    toggleOption(option.value)
  }

  const isActive = (option: MultiSelectOption) => {
    if (option.kind === 'all') return allSelected
    if (option.kind === 'none') return noneSelected
    return value.includes(option.value)
  }

  return (
    <div className={`popup-select multi-select-filter ${className}`.trim()} ref={wrapRef}>
      {label ? <span className="multi-select-filter__caption">{label}</span> : null}
      <div className="multi-select-filter__control">
        <button
          type="button"
          className="popup-select__trigger popup-select__trigger--filter"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="popup-select__trigger-label">
            {triggerLabel(value, allValues, emptyLabel, allLabel)}
          </span>
          <span className={`popup-select__caret ${open ? 'is-open' : ''}`} aria-hidden />
        </button>
        {value.length > 0 && !allSelected ? (
          <button
            type="button"
            className="multi-select-filter__clear"
            aria-label="Restablecer a todas"
            title="Restablecer"
            onClick={() => onChange([...allValues])}
          >
            ×
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="popup-select__menu popup-select__menu--end"
          id={listId}
          role="listbox"
          aria-multiselectable
        >
          <button
            type="button"
            role="option"
            aria-selected={allSelected}
            className={`popup-select__option ${allSelected ? 'is-selected' : ''}`}
            onClick={() => handleOptionClick({ value: '__all__', label: allLabel, kind: 'all' })}
          >
            <strong>{allLabel}</strong>
          </button>
          <button
            type="button"
            role="option"
            aria-selected={noneSelected}
            className={`popup-select__option ${noneSelected ? 'is-selected' : ''}`}
            onClick={() => handleOptionClick({ value: '__none__', label: noneLabel, kind: 'none' })}
          >
            <strong>{noneLabel}</strong>
          </button>
          {options.map((option) => {
            const selected = isActive(option)
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`popup-select__option ${selected ? 'is-selected' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                <span className="popup-select__option-row">
                  <strong>{option.label}</strong>
                  {option.hint ? <span>{option.hint}</span> : null}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
