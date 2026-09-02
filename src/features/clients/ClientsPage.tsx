import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  CLIENT_TYPES,
  createClient,
  deleteClient,
  mockClients,
  mockOrders,
  updateClient,
  type ClientRecord,
  type ClientType,
} from '@/mocks/data'
import { formatCOP, formatMoneyInput } from '@/shared/lib/formatMoney'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { useEnterConfirm } from '@/shared/lib/useEnterConfirm'
import {
  INPUT_CHAR_MAX,
  isUniqueInsensitive,
  validateAddress,
  validateEmail,
  validateMoney,
  validatePersonName,
  validatePhone,
} from '@/shared/lib/validation'
import { ResourcePage } from '@/pages/ResourcePage'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { Modal } from '@/shared/ui/Modal/Modal'
import { MoneyInput, parseMoneyInput } from '@/shared/ui/MoneyInput/MoneyInput'

type ClientForm = {
  name: string
  address: string
  contactName: string
  email: string
  phone: string
  creditAvailable: string
  clientType: ClientType | ''
}

const emptyForm: ClientForm = {
  name: '',
  address: '',
  contactName: '',
  email: '',
  phone: '',
  creditAvailable: '0.00',
  clientType: '',
}

export function ClientsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('clients:create')
  const canUpdate = hasPermission('clients:update')
  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ClientRecord | null>(null)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientForm, string>>>({})
  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const rows = useMemo(
    () => mockClients.map((client) => ({
      id: client.id,
      name: client.name,
      contact: client.contact.name,
      email: client.contact.email,
      phone: client.contact.phone,
      address: client.address,
      status: client.status,
      clientType: client.clientType,
      creditAvailable: formatCOP(client.creditAvailable ?? 0),
      createdAt: client.createdAt.slice(0, 10),
      activeOrders: mockOrders.filter((order) => (
        order.clientId === client.id
        && order.status !== 'envio'
        && order.status !== 'cancelado'
      )).length,
    })),
    [mockClients.length, mockClients.map((c) => `${c.status}:${c.clientType}`).join()],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (client: ClientRecord) => {
    if (client.status === 'inactivo') return
    setEditing(client)
    setForm({
      name: client.name,
      address: client.address,
      contactName: client.contact.name,
      email: client.contact.email,
      phone: client.contact.phone,
      creditAvailable: Number.isFinite(client.creditAvailable)
        ? formatMoneyInput(client.creditAvailable)
        : formatMoneyInput(0),
      clientType: client.clientType,
    })
    setErrors({})
    setFormOpen(true)
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    const nextErrors: Partial<Record<keyof ClientForm, string>> = {
      name: validatePersonName(form.name, 'Nombre') ?? undefined,
      address: validateAddress(form.address) ?? undefined,
      contactName: validatePersonName(form.contactName, 'Contacto') ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      phone: validatePhone(form.phone) ?? undefined,
      creditAvailable: validateMoney(form.creditAvailable, 'Crédito disponible') ?? undefined,
      clientType: form.clientType ? undefined : 'Seleccione el tipo de cliente',
    }
    if (!nextErrors.email && !isUniqueInsensitive(
      form.email,
      mockClients.map((client) => client.contact.email),
      editing?.contact.email,
    )) {
      nextErrors.email = 'Ya existe un cliente con ese correo'
    }
    if (!nextErrors.phone && !isUniqueInsensitive(
      form.phone,
      mockClients.map((client) => client.contact.phone),
      editing?.contact.phone,
    )) {
      nextErrors.phone = 'Ya existe un cliente con ese teléfono'
    }
    const cleaned = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value)),
    ) as typeof errors
    setErrors(cleaned)
    if (Object.keys(cleaned).length > 0) {
      notifyError('Revise el formulario', Object.values(cleaned)[0])
      return
    }

    const credit = parseMoneyInput(form.creditAvailable || '0')

    if (editing) {
      const updated = updateClient(editing.id, {
        name: form.name,
        address: form.address,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        creditAvailable: credit,
        clientType: form.clientType as ClientType,
      })
      if (!updated) {
        notifyError('No se pudo actualizar', 'Ese correo ya está en uso')
        return
      }
      appendAuditLog({
        action: 'client.update',
        entity: 'client',
        entityId: editing.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó el cliente ${updated.name}`,
        kind: 'change',
      })
      notifySuccess('Cliente actualizado', updated.name)
    } else {
      if (!canCreate) return
      const result = createClient({
        name: form.name,
        address: form.address,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        creditAvailable: credit,
        clientType: form.clientType as ClientType,
      })
      if (!result.ok) {
        notifyError('No se pudo crear', result.error)
        return
      }
      appendAuditLog({
        action: 'client.create',
        entity: 'client',
        entityId: result.client.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó el cliente ${result.client.name}`,
        kind: 'change',
      })
      notifySuccess('Cliente creado', result.client.name)
    }
    setFormOpen(false)
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const result = deleteClient(deleteTarget.id, deleteReason)
    if (!result.ok) {
      setDeleteError(result.error)
      notifyError('No se pudo eliminar', result.error)
      return
    }
    appendAuditLog({
      action: 'client.delete',
      entity: 'client',
      entityId: deleteTarget.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Eliminó el cliente ${deleteTarget.name}. Motivo: ${result.reason}`,
      kind: 'change',
    })
    notifySuccess('Cliente eliminado', deleteTarget.name)
    setDeleteTarget(null)
    setDeleteReason('')
    setDeleteError('')
    refresh()
  }

  useEnterConfirm(formOpen, () => handleSubmit())
  useEnterConfirm(Boolean(deleteTarget), confirmDelete)

  return (
    <>
      <ResourcePage
        createLabel="Crear cliente"
        createPermission="clients:create"
        updatePermission="clients:update"
        deletePermission="clients:delete"
        detailTitle="Detalle del cliente"
        searchPlaceholder="Buscar por nombre, correo o teléfono… (pulse Enter)"
        searchKeys={['name', 'email', 'phone', 'contact', 'id', 'clientType']}
        statusOptions={['activo', 'inactivo']}
        onCreate={openCreate}
        onEdit={(row) => {
          const client = mockClients.find((entry) => entry.id === row.id)
          if (client) openEdit(client)
        }}
        onDelete={(row) => {
          const client = mockClients.find((entry) => entry.id === row.id)
          if (!client || client.status === 'inactivo') return
          setDeleteTarget(client)
          setDeleteReason('')
          setDeleteError('')
        }}
        onStatusChange={(row, nextStatus) => {
          if (!canUpdate) return
          updateClient(String(row.id), { status: nextStatus })
          appendAuditLog({
            action: 'client.status',
            entity: 'client',
            entityId: String(row.id),
            actorId: user?.id ?? 'unknown',
            actorRole: user?.roles[0] ?? 'UNKNOWN',
            details: `Cambió el estado del cliente ${row.name} a ${nextStatus}`,
            kind: 'change',
          })
          notifySuccess('Estado actualizado', `${row.name} → ${nextStatus}`)
          refresh()
        }}
        getDeletionBlocker={(row) => (
          Number(row.activeOrders) > 0
            ? `Tiene ${row.activeOrders} pedido(s) activo(s)`
            : null
        )}
        columns={[
          { key: 'name', label: 'Nombre', priority: 1 },
          { key: 'clientType', label: 'Tipo', badge: true, priority: 2 },
          { key: 'status', label: 'Estado', statusSelect: true, priority: 3 },
          { key: 'id', label: 'ID' },
          { key: 'email', label: 'Correo' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'creditAvailable', label: 'Crédito' },
        ]}
        renderDetail={(row) => {
          const client = mockClients.find((entry) => entry.id === row.id)
          const clientOrders = mockOrders.filter((order) => order.clientId === row.id)
          return (
            <DetailView
              title={String(row.name)}
              subtitle="Cliente comercial"
              sections={[
                {
                  title: 'Datos',
                  fields: [
                    { label: 'ID', value: row.id },
                    { label: 'Tipo de cliente', value: row.clientType },
                    { label: 'Estado', value: row.status },
                    { label: 'Dirección', value: row.address },
                    { label: 'Crédito', value: formatCOP(client?.creditAvailable ?? 0) },
                  ],
                },
                {
                  title: 'Contacto',
                  fields: [
                    { label: 'Nombre', value: client?.contact.name },
                    { label: 'Email', value: row.email },
                    { label: 'Teléfono', value: row.phone },
                  ],
                },
                {
                  title: 'Pedidos',
                  fields: clientOrders.length
                    ? clientOrders.map((order) => ({
                      label: order.id,
                      value: `${order.status} · ${formatCOP(order.total)}`,
                    }))
                    : [{ label: 'Pedidos', value: 'Sin pedidos' }],
                },
              ]}
            />
          )
        }}
        rows={rows}
      />

      <Modal
        isOpen={formOpen}
        title={editing ? 'Actualizar cliente' : 'Crear cliente'}
        onClose={() => setFormOpen(false)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="client-form" className="admin-btn">
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        )}
      >
        <form id="client-form" className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="admin-form__field">
            Nombre
            <input className={`admin-input ${errors.name ? 'admin-input--error' : ''}`} value={form.name} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
            {errors.name ? <span className="admin-form__error">{errors.name}</span> : null}
          </label>
          <label className="admin-form__field">
            Contacto
            <input className={`admin-input ${errors.contactName ? 'admin-input--error' : ''}`} value={form.contactName} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, contactName: e.target.value }))} />
            {errors.contactName ? <span className="admin-form__error">{errors.contactName}</span> : null}
          </label>
          <label className="admin-form__field">
            Email
            <input className={`admin-input ${errors.email ? 'admin-input--error' : ''}`} value={form.email} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
            {errors.email ? <span className="admin-form__error">{errors.email}</span> : null}
          </label>
          <label className="admin-form__field">
            Teléfono
            <input className={`admin-input ${errors.phone ? 'admin-input--error' : ''}`} value={form.phone} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
            {errors.phone ? <span className="admin-form__error">{errors.phone}</span> : null}
          </label>
          <label className="admin-form__field">
            Dirección
            <input className={`admin-input ${errors.address ? 'admin-input--error' : ''}`} value={form.address} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} />
            {errors.address ? <span className="admin-form__error">{errors.address}</span> : null}
          </label>
          <label className="admin-form__field">
            Tipo de cliente
            <select
              className={`admin-input ${errors.clientType ? 'admin-input--error' : ''}`}
              value={form.clientType}
              onChange={(e) => setForm((c) => ({ ...c, clientType: e.target.value as ClientType | '' }))}
            >
              <option value="">Seleccione…</option>
              {CLIENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.clientType ? <span className="admin-form__error">{errors.clientType}</span> : null}
          </label>
          <label className="admin-form__field">
            Crédito disponible
            <MoneyInput
              className={errors.creditAvailable ? 'admin-money--error' : ''}
              value={form.creditAvailable}
              aria-label="Crédito disponible en pesos"
              onChange={(creditAvailable) => setForm((c) => ({ ...c, creditAvailable }))}
            />
            {errors.creditAvailable ? <span className="admin-form__error">{errors.creditAvailable}</span> : null}
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar cliente"
        onClose={() => setDeleteTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setDeleteTarget(null)}>Cancelar</button>
            <button type="button" className="admin-btn" onClick={confirmDelete}>Confirmar eliminación</button>
          </>
        )}
      >
        <p className="admin-meta">Va a eliminar a <strong>{deleteTarget?.name}</strong>.</p>
        <label className="admin-form__field">
          Motivo (obligatorio)
          <textarea className={`admin-input admin-textarea ${deleteError ? 'admin-input--error' : ''}`} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={3} />
          {deleteError ? <span className="admin-form__error">{deleteError}</span> : null}
        </label>
      </Modal>
    </>
  )
}
