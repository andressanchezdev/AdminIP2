import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  cancelShipment,
  createShipment,
  mockOrders,
  mockShipments,
  mockUsers,
  updateShipment,
  type ShipmentRecord,
} from '@/mocks/data'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { useEnterConfirm } from '@/shared/lib/useEnterConfirm'
import {
  INPUT_CHAR_MAX,
  todayISODate,
  validateAddress,
  validateCarrier,
  validateDateNotPast,
  validateReason,
  validateTracking,
  validateUnique,
} from '@/shared/lib/validation'
import { ResourcePage } from '@/pages/ResourcePage'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { Modal } from '@/shared/ui/Modal/Modal'

const SHIPMENT_STATUSES = ['programado', 'en transito', 'entregado', 'cancelado'] as const

type ShipmentForm = {
  orderId: string
  carrier: string
  trackingNumber: string
  address: string
  estimatedDelivery: string
  driverId: string
}

const emptyForm: ShipmentForm = {
  orderId: '',
  carrier: '',
  trackingNumber: '',
  address: '',
  estimatedDelivery: '',
  driverId: '',
}

function userLabel(userId: string | null | undefined) {
  if (!userId) return 'Sin asignar'
  return mockUsers.find((entry) => entry.id === userId)?.fullName ?? userId
}

export function ShipmentsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('shipments:create')
  const canUpdate = hasPermission('shipments:update')
  const canCancel = hasPermission('shipments:cancel')
  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ShipmentRecord | null>(null)
  const [form, setForm] = useState<ShipmentForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ShipmentForm, string>>>({})
  const [cancelTarget, setCancelTarget] = useState<ShipmentRecord | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  const rows = useMemo(
    () => mockShipments.map((shipment) => ({
      id: shipment.id,
      orderNumber: shipment.orderNumber ?? shipment.orderId,
      clientName: shipment.clientName ?? '—',
      address: shipment.address,
      status: shipment.status,
      carrier: shipment.carrier,
      tracking: shipment.trackingNumber,
      eta: String(shipment.estimatedDelivery ?? '').slice(0, 10),
      driver: userLabel(shipment.driverId),
    })),
    [mockShipments.length, mockShipments.map((s) => `${s.status}:${s.trackingNumber}`).join()],
  )

  const availableOrders = useMemo(
    () => mockOrders.filter((order) => {
      if (editing && editing.orderId === order.id) return true
      return !mockShipments.some((shipment) => shipment.orderId === order.id && shipment.status !== 'cancelado')
    }),
    [editing, mockOrders.length, mockShipments.length],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (shipment: ShipmentRecord) => {
    if (shipment.status === 'cancelado') return
    setEditing(shipment)
    setForm({
      orderId: shipment.orderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      address: shipment.address,
      estimatedDelivery: String(shipment.estimatedDelivery).slice(0, 10),
      driverId: shipment.driverId ?? '',
    })
    setErrors({})
    setFormOpen(true)
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    const nextErrors: Partial<Record<keyof ShipmentForm, string>> = {
      orderId: form.orderId ? undefined : 'Seleccione pedido',
      carrier: validateCarrier(form.carrier) ?? undefined,
      trackingNumber: validateTracking(form.trackingNumber) ?? undefined,
      address: validateAddress(form.address) ?? undefined,
      estimatedDelivery: validateDateNotPast(form.estimatedDelivery, 'Entrega estimada') ?? undefined,
    }
    if (!nextErrors.trackingNumber) {
      const trackingDup = validateUnique(
        form.trackingNumber,
        mockShipments.map((shipment) => shipment.trackingNumber),
        'Número de seguimiento',
        editing?.trackingNumber,
      )
      if (trackingDup) nextErrors.trackingNumber = trackingDup
    }
    const cleaned = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value)),
    ) as typeof errors
    setErrors(cleaned)
    if (Object.keys(cleaned).length > 0) {
      notifyError('Revise el formulario', Object.values(cleaned)[0])
      return
    }

    if (editing) {
      const updated = updateShipment(editing.id, {
        carrier: form.carrier,
        trackingNumber: form.trackingNumber,
        address: form.address,
        estimatedDelivery: new Date(form.estimatedDelivery).toISOString(),
        driverId: form.driverId || null,
      })
      if (!updated) {
        notifyError('No se pudo actualizar', 'El envío no admite edición')
        return
      }
      appendAuditLog({
        action: 'shipment.update',
        entity: 'shipment',
        entityId: editing.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó el envío ${editing.id}`,
        kind: 'change',
      })
      notifySuccess('Envío actualizado', editing.id)
    } else {
      if (!canCreate) return
      const result = createShipment({
        orderId: form.orderId,
        carrier: form.carrier,
        trackingNumber: form.trackingNumber,
        address: form.address,
        estimatedDelivery: new Date(form.estimatedDelivery).toISOString(),
        driverId: form.driverId || null,
      })
      if (!result.ok) {
        notifyError('No se pudo crear', result.error)
        return
      }
      appendAuditLog({
        action: 'shipment.create',
        entity: 'shipment',
        entityId: result.shipment.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó el envío ${result.shipment.id} para ${result.shipment.orderNumber}`,
        kind: 'change',
      })
      notifySuccess('Envío creado', result.shipment.id)
    }
    setFormOpen(false)
    refresh()
  }

  const confirmCancel = () => {
    if (!cancelTarget) return
    const reasonError = validateReason(cancelReason, 'Motivo')
    if (reasonError) {
      setCancelError(reasonError)
      notifyError('Revise el motivo', reasonError)
      return
    }
    const result = cancelShipment(cancelTarget.id, cancelReason)
    if (!result.ok) {
      setCancelError(result.error)
      notifyError('No se pudo cancelar', result.error)
      return
    }
    appendAuditLog({
      action: 'shipment.cancel',
      entity: 'shipment',
      entityId: cancelTarget.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Canceló el envío ${cancelTarget.id}. Motivo: ${result.reason}`,
      kind: 'change',
    })
    notifySuccess('Envío cancelado', cancelTarget.id)
    setCancelTarget(null)
    setCancelReason('')
    setCancelError('')
    refresh()
  }

  useEnterConfirm(formOpen, () => handleSubmit())
  useEnterConfirm(Boolean(cancelTarget), confirmCancel)

  return (
    <>
      <ResourcePage
        createLabel="Crear envío"
        createPermission="shipments:create"
        updatePermission="shipments:update"
        deletePermission="shipments:cancel"
        detailTitle="Detalle del envío"
        searchPlaceholder="Buscar por pedido, seguimiento o cliente… (pulse Enter)"
        searchKeys={['orderNumber', 'clientName', 'tracking', 'carrier', 'id']}
        statusOptions={[...SHIPMENT_STATUSES]}
        isRowInactive={(row) => String(row.status) === 'cancelado'}
        onCreate={openCreate}
        onEdit={(row) => {
          const shipment = mockShipments.find((entry) => entry.id === row.id)
          if (shipment) openEdit(shipment)
        }}
        onDelete={(row) => {
          if (String(row.status) === 'cancelado' || !canCancel) return
          const shipment = mockShipments.find((entry) => entry.id === row.id)
          if (!shipment) return
          setCancelTarget(shipment)
          setCancelReason('')
          setCancelError('')
        }}
        onStatusChange={(row, nextStatus) => {
          if (!canUpdate || String(row.status) === 'cancelado') return
          const updated = updateShipment(String(row.id), {
            status: nextStatus,
            shippedAt: nextStatus === 'en_transito' || nextStatus === 'entregado'
              ? new Date().toISOString()
              : null,
          })
          if (!updated) return
          appendAuditLog({
            action: 'shipment.status',
            entity: 'shipment',
            entityId: String(row.id),
            actorId: user?.id ?? 'unknown',
            actorRole: user?.roles[0] ?? 'UNKNOWN',
            details: `Cambió el estado del envío ${row.id} a ${nextStatus}`,
            kind: 'change',
          })
          notifySuccess('Estado actualizado', `${row.id} → ${nextStatus}`)
          refresh()
        }}
        columns={[
          { key: 'orderNumber', label: 'Pedido', priority: 1 },
          { key: 'clientName', label: 'Cliente', priority: 2 },
          { key: 'status', label: 'Estado', statusSelect: true, priority: 3 },
          { key: 'id', label: 'ID' },
          { key: 'address', label: 'Dirección' },
          { key: 'carrier', label: 'Transportista' },
          { key: 'tracking', label: 'Seguimiento' },
        ]}
        renderDetail={(row) => (
          <DetailView
            title={String(row.id)}
            subtitle={`Pedido ${row.orderNumber}`}
            sections={[
              {
                title: 'Envío',
                fields: [
                  { label: 'Cliente', value: row.clientName },
                  { label: 'Estado', value: row.status },
                  { label: 'Dirección', value: row.address },
                  { label: 'Transportista', value: row.carrier },
                  { label: 'Seguimiento', value: row.tracking },
                  { label: 'ETA', value: row.eta },
                  { label: 'Repartidor', value: row.driver },
                ],
              },
            ]}
          />
        )}
        rows={rows}
      />

      <Modal
        isOpen={formOpen}
        title={editing ? 'Actualizar envío' : 'Crear envío'}
        size="lg"
        onClose={() => setFormOpen(false)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button type="submit" form="shipment-form" className="admin-btn">{editing ? 'Actualizar' : 'Crear'}</button>
          </>
        )}
      >
        <form id="shipment-form" className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="admin-form__field">
            Pedido
            <select
              className={`admin-input ${errors.orderId ? 'admin-input--error' : ''}`}
              value={form.orderId}
              disabled={Boolean(editing)}
              onChange={(event) => {
                const order = mockOrders.find((entry) => entry.id === event.target.value)
                setForm((current) => ({
                  ...current,
                  orderId: event.target.value,
                  address: order?.deliveryAddress ?? current.address,
                }))
              }}
            >
              <option value="">Seleccione…</option>
              {availableOrders.map((order) => (
                <option key={order.id} value={order.id}>{order.id}</option>
              ))}
            </select>
            {errors.orderId ? <span className="admin-form__error">{errors.orderId}</span> : null}
          </label>
          <label className="admin-form__field">
            Transportista
            <input className={`admin-input ${errors.carrier ? 'admin-input--error' : ''}`} value={form.carrier} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, carrier: e.target.value }))} />
            {errors.carrier ? <span className="admin-form__error">{errors.carrier}</span> : null}
          </label>
          <label className="admin-form__field">
            Nº seguimiento
            <input className={`admin-input ${errors.trackingNumber ? 'admin-input--error' : ''}`} value={form.trackingNumber} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, trackingNumber: e.target.value }))} />
            {errors.trackingNumber ? <span className="admin-form__error">{errors.trackingNumber}</span> : null}
          </label>
          <label className="admin-form__field">
            Dirección
            <input className={`admin-input ${errors.address ? 'admin-input--error' : ''}`} value={form.address} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} />
            {errors.address ? <span className="admin-form__error">{errors.address}</span> : null}
          </label>
          <label className="admin-form__field">
            Entrega estimada
            <input
              className={`admin-input ${errors.estimatedDelivery ? 'admin-input--error' : ''}`}
              type="date"
              min={todayISODate()}
              value={form.estimatedDelivery}
              onChange={(e) => setForm((c) => ({ ...c, estimatedDelivery: e.target.value }))}
            />
            {errors.estimatedDelivery ? <span className="admin-form__error">{errors.estimatedDelivery}</span> : null}
          </label>
          <label className="admin-form__field">
            Repartidor
            <select className="admin-input" value={form.driverId} onChange={(e) => setForm((c) => ({ ...c, driverId: e.target.value }))}>
              <option value="">Sin asignar</option>
              {mockUsers.filter((entry) => entry.status === 'activo').map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.fullName}</option>
              ))}
            </select>
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(cancelTarget)}
        title="Cancelar envío"
        onClose={() => setCancelTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setCancelTarget(null)}>Volver</button>
            <button type="button" className="admin-btn" onClick={confirmCancel}>Confirmar cancelación</button>
          </>
        )}
      >
        <p className="admin-meta">Envío <strong>{cancelTarget?.id}</strong>.</p>
        <label className="admin-form__field">
          Motivo
          <textarea className={`admin-input admin-textarea ${cancelError ? 'admin-input--error' : ''}`} value={cancelReason} maxLength={INPUT_CHAR_MAX} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
          {cancelError ? <span className="admin-form__error">{cancelError}</span> : null}
        </label>
      </Modal>
    </>
  )
}
