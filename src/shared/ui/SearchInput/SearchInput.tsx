import { useEffect, useState, type KeyboardEvent } from 'react'

type SearchInputProps = {
  placeholder?: string
  className?: string
  'aria-label'?: string
  /** Valor aplicado (solo cambia al confirmar con Enter). */
  appliedValue?: string
  onSearch: (query: string) => void
}

/** Búsqueda que solo aplica al presionar Enter. */
export function SearchInput({
  placeholder = 'Escriba y pulse Enter para buscar',
  className = 'admin-search',
  appliedValue = '',
  onSearch,
  'aria-label': ariaLabel = 'Buscar',
}: SearchInputProps) {
  const [draft, setDraft] = useState(appliedValue)

  useEffect(() => {
    setDraft(appliedValue)
  }, [appliedValue])

  const commit = () => {
    onSearch(draft.trim())
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
  }

  return (
    <input maxLength={60}
      className={className}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={onKeyDown}
    />
  )
}
