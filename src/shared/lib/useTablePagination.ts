import { useEffect, useMemo, useState } from 'react'

/** Registros por página en tablas de gestión. */
export const TABLE_PAGE_SIZE = 12

type UseTablePaginationOptions = {
  pageSize?: number
  /** Cambia al filtrar/buscar para volver a la página 1. */
  resetKey?: string | number
}

export function useTablePagination<T>(
  items: readonly T[],
  options: UseTablePaginationOptions = {},
) {
  const pageSize = options.pageSize ?? TABLE_PAGE_SIZE
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [options.resetKey, pageSize])

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, pageSize, safePage])

  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, total)

  return {
    page: safePage,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems,
    rangeStart,
    rangeEnd,
  }
}
