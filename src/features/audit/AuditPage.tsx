import { useMemo, useState } from 'react'
import { getAuditLogs, mockUsers, type AuditLog } from '@/mocks/data'
import { formatAuditAction, formatAuditEntity } from '@/shared/lib/auditLabels'
import { useTablePagination } from '@/shared/lib/useTablePagination'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'
import { TablePagination } from '@/shared/ui/TablePagination/TablePagination'

type AuditBucket = {
  id: string
  title: string
  description: string
  match: (log: AuditLog) => boolean
}

const BUCKETS: AuditBucket[] = [
  {
    id: 'orders',
    title: 'Logs de pedidos',
    description: 'Creación, edición, estados y cancelaciones',
    match: (log) => log.entity === 'order' || log.action.startsWith('order.'),
  },
  {
    id: 'products',
    title: 'Logs de productos',
    description: 'Altas, cambios de estado y bajas',
    match: (log) => log.entity === 'product' || log.action.startsWith('product.'),
  },
  {
    id: 'people',
    title: 'Logs de usuarios / clientes',
    description: 'Usuarios del panel y clientes comerciales',
    match: (log) => (
      log.entity === 'user'
      || log.entity === 'client'
      || log.action.startsWith('user.')
      || log.action.startsWith('client.')
      || log.action.startsWith('profile.')
    ),
  },
  {
    id: 'categories',
    title: 'Logs de categorías',
    description: 'Creación, migración y eliminación',
    match: (log) => log.entity === 'category' || log.action.startsWith('category.'),
  },
]

function actorName(actorId: string) {
  return mockUsers.find((entry) => entry.id === actorId)?.fullName ?? actorId
}

function AuditBucketTable({
  items,
  onSelect,
}: {
  items: AuditLog[]
  onSelect: (log: AuditLog) => void
}) {
  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSize,
  } = useTablePagination(items, { resetKey: items.length })

  return (
    <>
      <ResponsiveTableShell
        empty={items.length === 0}
        cards={pageItems.map((log) => (
          <AdminRowCard
            key={log.id}
            title={formatAuditAction(log.action)}
            actions={(
              <IconAction label="Ver" variant="view" onClick={() => onSelect(log)} />
            )}
            fields={[
              { label: 'Fecha', value: log.timestamp.slice(0, 16).replace('T', ' '), primary: true },
              { label: 'Usuario', value: actorName(log.actorId), primary: true },
              { label: 'Acción', value: formatAuditAction(log.action), primary: true },
              { label: 'Entidad', value: formatAuditEntity(log.entity, log.entityId) },
            ]}
          />
        ))}
      >
        <table className="admin-table admin-table--compact">
          <thead>
            <tr>
              <th data-priority="1">Fecha</th>
              <th data-priority="2">Usuario</th>
              <th data-priority="3">Acción</th>
              <th>Entidad</th>
              <th className="admin-table__actions-col" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((log) => (
              <tr key={log.id}>
                <td data-priority="1">{log.timestamp.slice(0, 16).replace('T', ' ')}</td>
                <td data-priority="2">{actorName(log.actorId)}</td>
                <td data-priority="3">{formatAuditAction(log.action)}</td>
                <td>{formatAuditEntity(log.entity, log.entityId)}</td>
                <td className="admin-table__actions-col">
                  <IconAction label="Ver" variant="view" onClick={() => onSelect(log)} />
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
    </>
  )
}

export function AuditPage() {
  const logs = getAuditLogs()
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const grouped = useMemo(() => (
    BUCKETS.map((bucket) => ({
      ...bucket,
      items: logs.filter(bucket.match),
    }))
  ), [logs])

  return (
    <section className="admin-page">
      <div className="admin-audit-grid">
        {grouped.map((bucket) => (
          <article key={bucket.id} className="admin-audit-card">
            <header className="admin-audit-card__header">
              <div>
                <h3 className="admin-audit-card__title">{bucket.title}</h3>
                <p className="admin-meta">{bucket.description}</p>
              </div>
              <span className="admin-badge">{bucket.items.length}</span>
            </header>
            <div className="admin-audit-card__body">
              {bucket.items.length === 0 ? (
                <p className="admin-empty">Sin registros</p>
              ) : (
                <AuditBucketTable items={bucket.items} onSelect={setSelected} />
              )}
            </div>
          </article>
        ))}
      </div>

      <Modal
        isOpen={Boolean(selected)}
        title="Detalle de auditoría"
        size="lg"
        onClose={() => setSelected(null)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setSelected(null)}>Cerrar</button>
        )}
      >
        {selected ? (
          <DetailView
            title={formatAuditAction(selected.action)}
            subtitle={formatAuditEntity(selected.entity, selected.entityId)}
            sections={[
              {
                title: 'Evento',
                fields: [
                  { label: 'Fecha', value: selected.timestamp },
                  { label: 'Tipo de evento', value: selected.kind === 'denial' ? 'Acceso denegado' : 'Cambio registrado' },
                  { label: 'Qué ocurrió', value: selected.details },
                ],
              },
              {
                title: 'Quién lo realizó',
                fields: [
                  { label: 'Usuario', value: actorName(selected.actorId) },
                  { label: 'Rol', value: selected.actorRole },
                ],
              },
            ]}
          />
        ) : null}
      </Modal>
    </section>
  )
}
