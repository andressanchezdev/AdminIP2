import type { ReactNode } from 'react'
import './ResponsiveTable.css'

export type TablePriority = 1 | 2 | 3

export type ResponsiveTableColumn = {
  key: string
  label: string
  /** Columnas 1–3 visibles en móvil (modo tabla). Sin priority = ocultas en móvil. */
  priority?: TablePriority
}

/** Si ninguna columna declara priority, las primeras 3 quedan prioritarias. */
export function withDefaultPriorities<T extends { priority?: TablePriority }>(columns: T[]): T[] {
  if (columns.some((column) => column.priority)) {
    return columns
  }
  return columns.map((column, index) => (
    index < 3
      ? { ...column, priority: (index + 1) as TablePriority }
      : column
  ))
}

type ResponsiveTableShellProps = {
  children: ReactNode
  cards: ReactNode
  empty?: boolean
  emptyMessage?: string
}

/** Tabla + cards: CSS muestra 3 cols en móvil y cards bajo 640px. */
export function ResponsiveTableShell({
  children,
  cards,
  empty = false,
  emptyMessage = 'No hay resultados para mostrar',
}: ResponsiveTableShellProps) {
  if (empty) {
    return (
      <div className="admin-table-wrap">
        <div className="admin-empty">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className="admin-table-wrap admin-table-wrap--responsive">
      {children}
      <div className="admin-table-cards" aria-label="Vista de tarjetas">
        {cards}
      </div>
    </div>
  )
}

type RowCardField = {
  label: string
  value: ReactNode
  primary?: boolean
}

type AdminRowCardProps = {
  title: ReactNode
  fields: RowCardField[]
  actions?: ReactNode
}

/** Tarjeta de fila para pantallas ≤640px. */
export function AdminRowCard({ title, fields, actions }: AdminRowCardProps) {
  const primary = fields.filter((field) => field.primary).slice(0, 3)
  const rest = fields.filter((field) => !field.primary)

  return (
    <article className="admin-row-card">
      <div className="admin-row-card__head">
        <h3 className="admin-row-card__title">{title}</h3>
        {actions ? <div className="admin-row-card__actions">{actions}</div> : null}
      </div>
      {primary.length ? (
        <div className="admin-row-card__highlights">
          {primary.map((field) => (
            <div key={field.label} className="admin-row-card__highlight">
              <span className="admin-row-card__label">{field.label}</span>
              <span className="admin-row-card__value">{field.value}</span>
            </div>
          ))}
        </div>
      ) : null}
      {rest.length ? (
        <dl className="admin-row-card__grid">
          {rest.map((field) => (
            <div key={field.label} className="admin-row-card__item">
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  )
}
