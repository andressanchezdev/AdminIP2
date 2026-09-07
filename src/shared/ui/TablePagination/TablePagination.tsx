import { TABLE_PAGE_SIZE } from '@/shared/lib/useTablePagination'
import './TablePagination.css'

type TablePaginationProps = {
  page: number
  totalPages: number
  total: number
  rangeStart: number
  rangeEnd: number
  pageSize?: number
  onPageChange: (page: number) => void
}

/** Controles de paginación (12 registros por página por defecto). */
export function TablePagination({
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  pageSize = TABLE_PAGE_SIZE,
  onPageChange,
}: TablePaginationProps) {
  if (total === 0) return null

  return (
    <div className="admin-pagination" role="navigation" aria-label="Paginación de la tabla">
      <p className="admin-pagination__summary">
        Mostrando {rangeStart}–{rangeEnd} de {total}
        <span className="admin-pagination__size"> ({pageSize} por página)</span>
      </p>
      {totalPages > 1 ? (
        <div className="admin-pagination__controls">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </button>
          <span className="admin-pagination__page" aria-current="page">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  )
}
