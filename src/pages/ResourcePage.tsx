import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePermissions } from '@/app/providers/AuthProvider'
import { confirmAction } from '@/shared/lib/notify'
import { useTablePagination } from '@/shared/lib/useTablePagination'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { PopupSelect } from '@/shared/ui/PopupSelect/PopupSelect'
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput'
import { TablePagination } from '@/shared/ui/TablePagination/TablePagination'
import {
  AdminRowCard,
  ResponsiveTableShell,
  withDefaultPriorities,
  type TablePriority,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'

export type ResourceColumn = {
  key: string
  label: string
  badge?: boolean
  /** Renderiza un select con las opciones de estado existentes en la tabla. */
  statusSelect?: boolean
  /** 1–3: visibles en móvil (modo tabla). */
  priority?: TablePriority
}

export type ResourceRow = Record<string, string | number | null | undefined>

type ResourcePageProps = {
  createLabel?: string
  createPermission?: string
  updatePermission?: string
  deletePermission?: string
  rows: ResourceRow[]
  columns: ResourceColumn[]
  searchPlaceholder?: string
  searchKeys?: string[]
  statusFilterKey?: string
  filterAllLabel?: string
  onDeleteBlockedReason?: string
  getDeletionBlocker?: (row: ResourceRow) => string | null
  /** Si true, editar/eliminar quedan deshabilitados (p. ej. registro inactivo). */
  isRowInactive?: (row: ResourceRow) => boolean
  renderDetail?: (row: ResourceRow) => ReactNode
  onEdit?: (row: ResourceRow) => void
  onDelete?: (row: ResourceRow) => void
  onCreate?: () => void
  onStatusChange?: (row: ResourceRow, nextStatus: string) => void
  detailTitle?: string
  hideCreate?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
  statusOptions?: string[]
  extraToolbar?: ReactNode
}

function cellContent(
  row: ResourceRow,
  col: ResourceColumn,
  statusOptions: string[],
  canUpdate: boolean,
  onStatusChange: (row: ResourceRow, nextStatus: string, key: string) => void,
) {
  const value = String(row[col.key] ?? '—')
  if (col.statusSelect) {
    return (
      <select
        className="admin-input admin-input--status"
        value={value}
        disabled={!canUpdate}
        onChange={(event) => onStatusChange(row, event.target.value, col.key)}
        aria-label={`Estado ${row.id ?? ''}`}
      >
        {statusOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    )
  }
  if (col.badge) {
    return <span className={`admin-badge admin-badge--${value}`}>{value}</span>
  }
  return value
}

export function ResourcePage({
  createLabel = 'Crear',
  createPermission,
  updatePermission,
  deletePermission,
  rows: initialRows,
  columns,
  searchPlaceholder = 'Escriba y pulse Enter para buscar',
  searchKeys,
  statusFilterKey = 'status',
  filterAllLabel = 'Todos los estados',
  onDeleteBlockedReason,
  getDeletionBlocker,
  isRowInactive,
  renderDetail,
  onEdit,
  onDelete,
  onCreate,
  onStatusChange,
  detailTitle = 'Detalle',
  hideCreate = false,
  hideEdit = false,
  hideDelete = false,
  statusOptions: statusOptionsProp,
  extraToolbar,
}: ResourcePageProps) {
  const { hasPermission } = usePermissions()
  const canCreate = createPermission ? hasPermission(createPermission) : false
  const canUpdate = updatePermission ? hasPermission(updatePermission) : false
  const canDelete = deletePermission ? hasPermission(deletePermission) : false
  const showEdit = !hideEdit
  const showDelete = !hideDelete

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<ResourceRow | null>(null)
  const [rows, setRows] = useState(initialRows)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const prioritizedColumns = useMemo(() => withDefaultPriorities(columns), [columns])

  const statusOptions = useMemo(() => {
    if (statusOptionsProp?.length) {
      return statusOptionsProp
    }
    const values = new Set(
      rows
        .map((row) => String(row[statusFilterKey] ?? ''))
        .filter(Boolean),
    )
    return Array.from(values)
  }, [rows, statusFilterKey, statusOptionsProp])

  const filterOptions = useMemo(() => ['all', ...statusOptions], [statusOptions])

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (status !== 'all' && String(row[statusFilterKey] ?? '') !== status) {
        return false
      }
      if (!normalized) {
        return true
      }
      const keys = searchKeys?.length ? searchKeys : columns.map((col) => col.key)
      return keys.some((key) => String(row[key] ?? '').toLowerCase().includes(normalized))
    })
  }, [rows, query, status, statusFilterKey, searchKeys, columns])

  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSize,
  } = useTablePagination(filteredRows, { resetKey: `${query}|${status}` })

  const handleStatusChange = async (row: ResourceRow, nextStatus: string, key: string) => {
    const current = String(row[key] ?? '')
    if (current === nextStatus) return

    const label = String(
      row.nombre
      ?? row.name
      ?? row.producto
      ?? row.codigo
      ?? row.id
      ?? 'este registro',
    )
    const goingInactive = nextStatus === 'inactivo'
    const confirmed = await confirmAction({
      title: goingInactive ? '¿Desactivar registro?' : '¿Activar registro?',
      text: `Va a cambiar el estado de "${label}" de ${current} a ${nextStatus}.`,
      confirmText: goingInactive ? 'Desactivar' : 'Activar',
      cancelText: 'Volver',
    })
    if (!confirmed) return

    setRows((currentRows) => currentRows.map((item) => (
      item.id === row.id ? { ...item, [key]: nextStatus } : item
    )))
    onStatusChange?.(row, nextStatus)
  }

  const renderRowActions = (row: ResourceRow) => {
    const blocker = getDeletionBlocker?.(row) ?? null
    const inactive = isRowInactive?.(row) ?? String(row.status) === 'inactivo'
    const deleteDisabled = !canDelete || Boolean(blocker) || inactive
    const editDisabled = !canUpdate || inactive
    return (
      <div className="admin-row-actions">
        <IconAction
          label="Ver"
          variant="view"
          onClick={() => setSelected(row)}
        />
        {showEdit ? (
          <IconAction
            label="Editar"
            variant="edit"
            disabled={editDisabled}
            title={inactive ? 'No disponible: el registro está inactivo' : 'Editar'}
            onClick={() => onEdit?.(row)}
          />
        ) : null}
        {showDelete ? (
          <IconAction
            label="Eliminar"
            variant="delete"
            disabled={deleteDisabled}
            title={
              inactive
                ? 'No disponible: el registro está inactivo'
                : blocker
                  || (!canDelete ? (onDeleteBlockedReason || 'No tiene permiso para eliminar') : 'Eliminar')
            }
            onClick={() => onDelete?.(row)}
          />
        ) : null}
      </div>
    )
  }

  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <SearchInput
            appliedValue={query}
            placeholder={searchPlaceholder}
            onSearch={setQuery}
          />
          {filterOptions.length > 1 ? (
            <PopupSelect
              aria-label="Filtrar por estado"
              value={status}
              onChange={setStatus}
              options={filterOptions.map((option) => ({
                value: option,
                label: option === 'all' ? filterAllLabel : option,
              }))}
            />
          ) : null}
          {extraToolbar}
        </div>
        {!hideCreate ? (
          <div className="admin-toolbar__create">
            <button
              type="button"
              className="admin-btn"
              disabled={!canCreate}
              onClick={() => onCreate?.()}
            >
              {createLabel}
            </button>
          </div>
        ) : null}
      </div>

      <ResponsiveTableShell
        empty={filteredRows.length === 0}
        cards={pageItems.map((row, index) => {
          const title = String(
            row.nombre
            ?? row.name
            ?? row.producto
            ?? row.codigo
            ?? row.id
            ?? `Registro ${index + 1}`,
          )
          return (
            <AdminRowCard
              key={String(row.id ?? index)}
              title={title}
              actions={renderRowActions(row)}
              fields={prioritizedColumns.map((col) => ({
                label: col.label,
                primary: Boolean(col.priority),
                value: cellContent(row, col, statusOptions, canUpdate, handleStatusChange),
              }))}
            />
          )
        })}
      >
        <table className="admin-table">
          <thead>
            <tr>
              {prioritizedColumns.map((col) => (
                <th
                  key={col.key}
                  {...(col.priority ? { 'data-priority': String(col.priority) } : {})}
                >
                  {col.label}
                </th>
              ))}
              <th className="admin-table__actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {prioritizedColumns.map((col) => (
                  <td
                    key={col.key}
                    {...(col.priority ? { 'data-priority': String(col.priority) } : {})}
                  >
                    {cellContent(row, col, statusOptions, canUpdate, handleStatusChange)}
                  </td>
                ))}
                <td className="admin-table__actions-col">
                  {renderRowActions(row)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableShell>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <Modal
        isOpen={Boolean(selected)}
        title={detailTitle}
        onClose={() => setSelected(null)}
        size="sm"
        footer={(
          <button type="button" className="admin-btn" onClick={() => setSelected(null)}>
            Cerrar
          </button>
        )}
      >
        {selected ? (
          <div className="admin-detail">
            {renderDetail ? renderDetail(selected) : (
              <DetailView
                title={String(selected.name ?? selected.id ?? 'Registro')}
                sections={[
                  {
                    fields: Object.entries(selected).map(([key, value]) => ({
                      label: key,
                      value: String(value ?? '—'),
                    })),
                  },
                ]}
              />
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
