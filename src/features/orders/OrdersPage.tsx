import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  cancelOrder,
  createOrder,
  mockClients,
  mockOrders,
  mockProducts,
  mockUsers,
  productPriceForClient,
  setOrderStatus,
  updateOrderEditableFields,
  type OrderItem,
  type OrderRecord,
} from '@/mocks/data'
import { formatCOP } from '@/shared/lib/formatMoney'
import {
  ORDER_STATUSES,
  canEditOrder,
  orderEditBlockedReason,
} from '@/shared/lib/orderRules'
import { useEnterConfirm } from '@/shared/lib/useEnterConfirm'
import { notifyBrief, notifyError, notifySuccess } from '@/shared/lib/notify'
import { fetchClientCredit } from '@/shared/lib/clientCredit'
import {
  validateAddress,
  validatePhone,
  validatePositiveInt,
  validatePositiveMoney,
} from '@/shared/lib/validation'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput'
import { QtyInput } from '@/shared/ui/QtyInput/QtyInput'
import { MoneyInput, parseMoneyInput } from '@/shared/ui/MoneyInput/MoneyInput'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'

function userLabel(userId: string | null | undefined) {
  if (!userId) return 'Sin asignar'
  return mockUsers.find((entry) => entry.id === userId)?.fullName ?? userId
}

function clientById(clientId: string) {
  return mockClients.find((client) => client.id === clientId)
}

type PaymentMethod = 'efectivo' | 'transferencia' | 'credito'

type EditFormState = {
  deliveryAddress: string
  contactPhone: string
  items: OrderItem[]
}

type CreateFormState = {
  clientId: string
  deliveryAddress: string
  contactPhone: string
  items: OrderItem[]
  paymentMethod: PaymentMethod | ''
  cashAmount: string
  receiptName: string
  receiptDataUrl: string
}

const emptyCreate: CreateFormState = {
  clientId: '',
  deliveryAddress: '',
  contactPhone: '',
  items: [],
  paymentMethod: '',
  cashAmount: '',
  receiptName: '',
  receiptDataUrl: '',
}

export function OrdersPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('orders:create')
  const canUpdate = hasPermission('orders:update')
  const canCancel = hasPermission('orders:cancel')
  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [viewOrder, setViewOrder] = useState<OrderRecord | null>(null)
  const [editTarget, setEditTarget] = useState<OrderRecord | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    deliveryAddress: '',
    contactPhone: '',
    items: [],
  })
  const [editError, setEditError] = useState('')
  const [addProductId, setAddProductId] = useState('')
  const [cancelTarget, setCancelTarget] = useState<OrderRecord | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreate)
  const [productQuery, setProductQuery] = useState('')
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [listQuery, setListQuery] = useState('')

  const activeProducts = useMemo(
    () => mockProducts.filter((product) => product.status === 'activo'),
    [mockProducts.length],
  )

  const filteredOrders = useMemo(() => {
    const normalized = listQuery.trim().toLowerCase()
    if (!normalized) return mockOrders
    return mockOrders.filter((order) => {
      const client = clientById(order.clientId)
      return (
        order.id.toLowerCase().includes(normalized)
        || order.status.toLowerCase().includes(normalized)
        || (client?.name ?? '').toLowerCase().includes(normalized)
        || (order.contactPhone ?? '').toLowerCase().includes(normalized)
      )
    })
  }, [listQuery, mockOrders.length, mockOrders.map((o) => o.status).join()])

  const visibleProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return activeProducts
    return activeProducts.filter((product) => (
      product.nombre.toLowerCase().includes(q)
      || product.codigo.toLowerCase().includes(q)
      || product.id.toLowerCase().includes(q)
      || product.modelo.toLowerCase().includes(q)
      || product.bodega.toLowerCase().includes(q)
    ))
  }, [activeProducts, productQuery])

  const createTotal = createForm.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const selectedClient = clientById(createForm.clientId)
  const createClientType = selectedClient?.clientType ?? 'minorista'
  const creditInfo = fetchClientCredit(createForm.clientId, selectedClient)

  const openEdit = (order: OrderRecord) => {
    const reason = orderEditBlockedReason(order, canUpdate)
    if (reason) {
      void notifyBrief('Edición no disponible', reason, 800)
      return
    }
    setEditTarget(order)
    setEditForm({
      deliveryAddress: order.deliveryAddress,
      contactPhone: order.contactPhone,
      items: order.items.map((item) => ({ ...item })),
    })
    setEditError('')
    setAddProductId('')
  }

  const saveEdit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!editTarget) return
    if (!canEditOrder(editTarget, canUpdate)) {
      const reason = orderEditBlockedReason(editTarget, canUpdate) ?? 'No se puede editar este pedido'
      setEditError(reason)
      void notifyBrief('Edición no disponible', reason, 800)
      return
    }
    const addressError = validateAddress(editForm.deliveryAddress)
    const phoneError = validatePhone(editForm.contactPhone)
    if (addressError || phoneError) {
      setEditError(addressError || phoneError || '')
      notifyError('Datos inválidos', addressError || phoneError || undefined)
      return
    }
    if (!editForm.items.length) {
      setEditError('Agregue al menos un producto')
      return
    }
    for (const item of editForm.items) {
      const qtyError = validatePositiveInt(item.qty, 'Cantidad')
      if (qtyError) {
        setEditError(qtyError)
        return
      }
    }
    const result = updateOrderEditableFields(editTarget.id, editForm)
    if (!result.ok) {
      setEditError(result.error)
      notifyError('No se pudo actualizar', result.error)
      return
    }
    appendAuditLog({
      action: 'order.update',
      entity: 'order',
      entityId: editTarget.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Editó dirección, teléfono o productos del pedido ${editTarget.id}`,
      kind: 'change',
    })
    notifySuccess('Pedido actualizado', editTarget.id)
    setEditTarget(null)
    refresh()
  }

  const toggleCreateProduct = (productId: string) => {
    const product = activeProducts.find((entry) => entry.id === productId)
    if (!product) return
    const unitPrice = productPriceForClient(product, createClientType)
    setCreateForm((current) => {
      const exists = current.items.some((item) => item.productId === productId)
      const items = exists
        ? current.items.filter((item) => item.productId !== productId)
        : [...current.items, { productId, qty: 1, unitPrice }]
      return { ...current, items }
    })
  }

  const setCreateQty = (productId: string, qty: number) => {
    setCreateForm((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.productId === productId ? { ...item, qty } : item
      )),
    }))
  }

  const onReceiptChange = (file: File | null) => {
    if (!file) {
      setCreateForm((current) => ({ ...current, receiptName: '', receiptDataUrl: '' }))
      return
    }
    if (!file.type.startsWith('image/')) {
      notifyError('Comprobante inválido', 'Debe ser una imagen')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCreateForm((current) => ({
        ...current,
        receiptName: file.name,
        receiptDataUrl: String(reader.result ?? ''),
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleCreate = (event?: FormEvent) => {
    event?.preventDefault()
    const client = mockClients.find((entry) => entry.id === createForm.clientId && entry.status === 'activo')
    const nextErrors: Record<string, string> = {}
    if (!client) nextErrors.clientId = 'Seleccione un cliente activo'
    const addressError = validateAddress(createForm.deliveryAddress || client?.address || '')
    if (addressError) nextErrors.deliveryAddress = addressError
    const phoneError = validatePhone(createForm.contactPhone || client?.contact.phone || '')
    if (phoneError) nextErrors.contactPhone = phoneError
    if (!createForm.items.length) nextErrors.items = 'Seleccione al menos un producto'
    for (const item of createForm.items) {
      const qtyError = validatePositiveInt(item.qty, 'Cantidad')
      if (qtyError) {
        nextErrors.items = qtyError
        break
      }
    }
    if (!createForm.paymentMethod) nextErrors.paymentMethod = 'Seleccione método de pago'

    const total = createForm.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
    if (createForm.paymentMethod === 'efectivo') {
      const cashError = validatePositiveMoney(createForm.cashAmount, 'Valor en efectivo')
      const cash = parseMoneyInput(createForm.cashAmount)
      if (cashError) nextErrors.cashAmount = cashError
      else if (cash < total) nextErrors.cashAmount = `El efectivo debe cubrir el total (${formatCOP(total)})`
    }
    if (createForm.paymentMethod === 'transferencia') {
      if (!createForm.receiptDataUrl) nextErrors.receipt = 'Adjunte una imagen del comprobante de transferencia'
    }
    if (createForm.paymentMethod === 'credito') {
      const credit = fetchClientCredit(createForm.clientId, client)
      if (!credit.hasCredit) nextErrors.paymentMethod = 'Este cliente no tiene crédito disponible'
      else if (credit.available < total) {
        nextErrors.paymentMethod = `El crédito disponible (${formatCOP(credit.available)}) no alcanza para este pedido`
      }
    }

    setCreateErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Revise los datos del pedido', Object.values(nextErrors)[0])
      return
    }
    if (!client || !createForm.paymentMethod) return

    const result = createOrder({
      clientId: createForm.clientId,
      createdBy: user?.id ?? 'unknown',
      deliveryAddress: createForm.deliveryAddress || client.address,
      contactPhone: createForm.contactPhone || client.contact.phone,
      items: createForm.items,
      paymentMethod: createForm.paymentMethod,
      paymentCashAmount: createForm.paymentMethod === 'efectivo' ? parseMoneyInput(createForm.cashAmount) : null,
      paymentReceiptName: createForm.paymentMethod === 'transferencia' ? createForm.receiptName : null,
      paymentReceiptDataUrl: createForm.paymentMethod === 'transferencia' ? createForm.receiptDataUrl : null,
    })
    if (!result.ok) {
      notifyError('No se pudo crear el pedido', result.error)
      return
    }
    appendAuditLog({
      action: 'order.create',
      entity: 'order',
      entityId: result.order.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Creó pedido ${result.order.id} (${createForm.paymentMethod}) por ${formatCOP(result.order.total)}`,
      kind: 'change',
    })
    notifySuccess('Pedido creado', `${result.order.id} · ${formatCOP(result.order.total)}`)
    setCreateOpen(false)
    setCreateForm(emptyCreate)
    setProductQuery('')
    setCreateErrors({})
    refresh()
  }

  const confirmCancelOrder = () => {
    if (!cancelTarget) return
    const result = cancelOrder(cancelTarget.id, cancelReason)
    if (!result.ok) {
      setCancelError(result.error)
      notifyError('No se pudo anular el pedido', result.error)
      return
    }
    appendAuditLog({
      action: 'order.cancel',
      entity: 'order',
      entityId: cancelTarget.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Anuló el pedido ${cancelTarget.id}. Motivo: ${result.order.cancelReason}`,
      kind: 'change',
    })
    notifySuccess('Pedido anulado', cancelTarget.id)
    setCancelTarget(null)
    setCancelReason('')
    setCancelError('')
    refresh()
  }

  useEnterConfirm(createOpen, () => handleCreate())
  useEnterConfirm(Boolean(editTarget), () => saveEdit())
  useEnterConfirm(Boolean(cancelTarget), confirmCancelOrder)

  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <SearchInput
            appliedValue={listQuery}
            placeholder="Buscar por pedido o cliente… (pulse Enter)"
            onSearch={setListQuery}
          />
        </div>
        <div className="admin-toolbar__create">
          <button
            type="button"
            className="admin-btn"
            disabled={!canCreate}
            onClick={() => {
              setCreateOpen(true)
              setCreateForm(emptyCreate)
              setProductQuery('')
              setCreateErrors({})
            }}
          >
            Crear pedido
          </button>
        </div>
      </div>

      <ResponsiveTableShell
        empty={filteredOrders.length === 0}
        cards={filteredOrders.map((order) => {
          const client = clientById(order.clientId)
          const editBlocked = orderEditBlockedReason(order, canUpdate)
          const statusCell = order.status === 'cancelado' ? (
            <span className="admin-badge admin-badge--cancelado">Cancelado</span>
          ) : (
            <select
              className="admin-input admin-input--status"
              value={order.status}
              disabled={!canUpdate}
              onChange={(event) => {
                setOrderStatus(order.id, event.target.value)
                appendAuditLog({
                  action: 'order.status',
                  entity: 'order',
                  entityId: order.id,
                  actorId: user?.id ?? 'unknown',
                  actorRole: user?.roles[0] ?? 'UNKNOWN',
                  details: `Cambió el estado del pedido ${order.id} a ${event.target.value}`,
                  kind: 'change',
                })
                notifySuccess('Estado actualizado', `${order.id} → ${event.target.value}`)
                refresh()
              }}
              aria-label={`Estado del pedido ${order.id}`}
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          )
          const actions = (
            <div className="admin-row-actions">
              <IconAction label="Ver detalle" variant="view" onClick={() => setViewOrder(order)} />
              <IconAction
                label="Editar"
                variant="edit"
                disabled={Boolean(editBlocked) || order.status === 'cancelado'}
                title={editBlocked ?? (order.status === 'cancelado' ? 'Este pedido ya fue anulado' : 'Editar pedido')}
                onClick={() => openEdit(order)}
              />
              <IconAction
                label="Anular pedido"
                variant="cancel"
                disabled={!canCancel || order.status === 'cancelado'}
                title={
                  order.status === 'cancelado'
                    ? 'Este pedido ya fue anulado'
                    : !canCancel
                      ? 'No tiene permiso para anular pedidos'
                      : 'Anular / cancelar pedido'
                }
                onClick={() => {
                  if (!canCancel || order.status === 'cancelado') return
                  setCancelTarget(order)
                  setCancelReason('')
                  setCancelError('')
                }}
              />
            </div>
          )
          return (
            <AdminRowCard
              key={order.id}
              title={order.id}
              actions={actions}
              fields={[
                { label: 'ID', value: order.id, primary: true },
                { label: 'Cliente', value: client?.name ?? order.clientId, primary: true },
                { label: 'Estado', value: statusCell, primary: true },
                { label: 'Total', value: formatCOP(order.total) },
                { label: 'Fecha', value: order.createdAt.slice(0, 10) },
                { label: 'Asignado a', value: userLabel(order.assignedTo) },
              ]}
            />
          )
        })}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th data-priority="1">ID</th>
              <th data-priority="2">Cliente</th>
              <th>Total (COP)</th>
              <th data-priority="3">Estado</th>
              <th>Fecha</th>
              <th>Asignado a</th>
              <th className="admin-table__actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const client = clientById(order.clientId)
              const editBlocked = orderEditBlockedReason(order, canUpdate)
              return (
                <tr key={order.id}>
                  <td data-priority="1">{order.id}</td>
                  <td data-priority="2">{client?.name ?? order.clientId}</td>
                  <td>{formatCOP(order.total)}</td>
                  <td data-priority="3">
                    {order.status === 'cancelado' ? (
                      <span className="admin-badge admin-badge--cancelado">Cancelado</span>
                    ) : (
                      <select
                        className="admin-input admin-input--status"
                        value={order.status}
                        disabled={!canUpdate}
                        onChange={(event) => {
                          setOrderStatus(order.id, event.target.value)
                          appendAuditLog({
                            action: 'order.status',
                            entity: 'order',
                            entityId: order.id,
                            actorId: user?.id ?? 'unknown',
                            actorRole: user?.roles[0] ?? 'UNKNOWN',
                            details: `Cambió el estado del pedido ${order.id} a ${event.target.value}`,
                            kind: 'change',
                          })
                          notifySuccess('Estado actualizado', `${order.id} → ${event.target.value}`)
                          refresh()
                        }}
                        aria-label={`Estado del pedido ${order.id}`}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>{order.createdAt.slice(0, 10)}</td>
                  <td>{userLabel(order.assignedTo)}</td>
                  <td className="admin-table__actions-col">
                    <div className="admin-row-actions">
                      <IconAction label="Ver detalle" variant="view" onClick={() => setViewOrder(order)} />
                      <IconAction
                        label="Editar"
                        variant="edit"
                        disabled={Boolean(editBlocked) || order.status === 'cancelado'}
                        title={editBlocked ?? (order.status === 'cancelado' ? 'Este pedido ya fue anulado' : 'Editar pedido')}
                        onClick={() => openEdit(order)}
                      />
                      <IconAction
                        label="Anular pedido"
                        variant="cancel"
                        disabled={!canCancel || order.status === 'cancelado'}
                        title={
                          order.status === 'cancelado'
                            ? 'Este pedido ya fue anulado'
                            : !canCancel
                              ? 'No tiene permiso para anular pedidos'
                              : 'Anular / cancelar pedido'
                        }
                        onClick={() => {
                          if (!canCancel || order.status === 'cancelado') return
                          setCancelTarget(order)
                          setCancelReason('')
                          setCancelError('')
                        }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ResponsiveTableShell>

      <Modal
        isOpen={Boolean(viewOrder)}
        title="Detalle del pedido"
        size="lg"
        onClose={() => setViewOrder(null)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setViewOrder(null)}>Cerrar</button>
        )}
      >
        {viewOrder ? (
          <DetailView
            title={viewOrder.id}
            subtitle={`Cliente ${clientById(viewOrder.clientId)?.name ?? viewOrder.clientId}`}
            sections={[
              {
                title: 'Resumen',
                fields: [
                  { label: 'Estado', value: viewOrder.status === 'cancelado' ? 'Cancelado' : viewOrder.status },
                  { label: 'Total', value: formatCOP(viewOrder.total) },
                  { label: 'Forma de pago', value: viewOrder.paymentMethod ?? '—' },
                  { label: 'Motivo de anulación', value: viewOrder.cancelReason || '—' },
                  { label: 'Creado', value: viewOrder.createdAt.slice(0, 16).replace('T', ' ') },
                ],
              },
              {
                title: 'Entrega',
                fields: [
                  { label: 'Dirección', value: viewOrder.deliveryAddress },
                  { label: 'Teléfono', value: viewOrder.contactPhone },
                ],
              },
              {
                title: 'Productos',
                fields: viewOrder.items.map((item) => {
                  const product = mockProducts.find((entry) => entry.id === item.productId)
                  return {
                    label: product?.nombre ?? item.productId,
                    value: `${item.qty} × ${formatCOP(item.unitPrice)}`,
                  }
                }),
              },
            ]}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(editTarget)}
        title={`Editar pedido ${editTarget?.id ?? ''}`}
        size="lg"
        onClose={() => setEditTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setEditTarget(null)}>
              Cancelar
            </button>
            <button type="submit" form="order-edit-form" className="admin-btn">Actualizar</button>
          </>
        )}
      >
        <form id="order-edit-form" className="admin-form" onSubmit={saveEdit} noValidate>
          <label className="admin-form__field">
            Dirección de entrega
            <input
              className="admin-input"
              value={editForm.deliveryAddress}
              onChange={(event) => setEditForm((current) => ({
                ...current,
                deliveryAddress: event.target.value,
              }))}
            />
          </label>
          <label className="admin-form__field">
            Teléfono de contacto
            <input
              className="admin-input"
              value={editForm.contactPhone}
              onChange={(event) => setEditForm((current) => ({
                ...current,
                contactPhone: event.target.value,
              }))}
            />
          </label>
          <div className="admin-form__field">
            <span>Productos</span>
            <ul className="admin-edit-items">
              {editForm.items.map((item) => {
                const product = mockProducts.find((entry) => entry.id === item.productId)
                return (
                  <li key={item.productId} className="admin-edit-items__row">
                    <span>{product?.nombre ?? item.productId}</span>
                    <QtyInput
                      value={item.qty}
                      min={1}
                      aria-label={`Cantidad de ${product?.nombre ?? item.productId}`}
                      onChange={(qty) => {
                        setEditForm((current) => ({
                          ...current,
                          items: current.items.map((entry) => (
                            entry.productId === item.productId ? { ...entry, qty } : entry
                          )),
                        }))
                      }}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={() => setEditForm((current) => ({
                        ...current,
                        items: current.items.filter((entry) => entry.productId !== item.productId),
                      }))}
                    >
                      Retirar
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="admin-edit-items__add">
              <select
                className="admin-input"
                value={addProductId}
                onChange={(event) => setAddProductId(event.target.value)}
              >
                <option value="">Agregar producto…</option>
                {activeProducts
                  .filter((product) => !editForm.items.some((item) => item.productId === product.id))
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nombre} ({formatCOP(productPriceForClient(product, createClientType))})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  const product = activeProducts.find((entry) => entry.id === addProductId)
                  if (!product) return
                  setEditForm((current) => ({
                    ...current,
                    items: [...current.items, {
                      productId: product.id,
                      qty: 1,
                      unitPrice: productPriceForClient(product, clientById(editTarget?.clientId ?? '')?.clientType ?? 'minorista'),
                    }],
                  }))
                  setAddProductId('')
                }}
              >
                Agregar
              </button>
            </div>
          </div>
          {editError ? <span className="admin-form__error">{editError}</span> : null}
        </form>
      </Modal>

      <Modal
        isOpen={createOpen}
        title="Crear pedido"
        size="lg"
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="order-create-form" className="admin-btn">Crear</button>
          </>
        )}
      >
        <form id="order-create-form" className="admin-form" onSubmit={handleCreate} noValidate>
          <label className="admin-form__field">
            Cliente
            <select
              className={`admin-input ${createErrors.clientId ? 'admin-input--error' : ''}`}
              value={createForm.clientId}
              onChange={(event) => {
                const client = mockClients.find((entry) => entry.id === event.target.value)
                const clientType = client?.clientType ?? 'minorista'
                setCreateForm((current) => ({
                  ...current,
                  clientId: event.target.value,
                  deliveryAddress: client?.address ?? '',
                  contactPhone: client?.contact.phone.trim() ?? '',
                  items: current.items.map((item) => {
                    const product = mockProducts.find((entry) => entry.id === item.productId)
                    return product
                      ? { ...item, unitPrice: productPriceForClient(product, clientType) }
                      : item
                  }),
                }))
              }}
            >
              <option value="">Seleccione…</option>
              {mockClients.filter((client) => client.status === 'activo').map((client) => (
                <option key={client.id} value={client.id}>{client.id} — {client.name}</option>
              ))}
            </select>
            {createErrors.clientId ? <span className="admin-form__error">{createErrors.clientId}</span> : null}
          </label>
          <label className="admin-form__field">
            Dirección de entrega
            <input
              className={`admin-input ${createErrors.deliveryAddress ? 'admin-input--error' : ''}`}
              value={createForm.deliveryAddress}
              onChange={(event) => setCreateForm((current) => ({
                ...current,
                deliveryAddress: event.target.value,
              }))}
            />
            {createErrors.deliveryAddress ? <span className="admin-form__error">{createErrors.deliveryAddress}</span> : null}
          </label>
          <label className="admin-form__field">
            Teléfono de contacto
            <input
              className={`admin-input ${createErrors.contactPhone ? 'admin-input--error' : ''}`}
              value={createForm.contactPhone}
              onChange={(event) => setCreateForm((current) => ({
                ...current,
                contactPhone: event.target.value,
              }))}
            />
            {createErrors.contactPhone ? <span className="admin-form__error">{createErrors.contactPhone}</span> : null}
          </label>

          <div className="admin-form__field">
            <span>Productos del pedido</span>
            <div className="admin-product-picker">
              <SearchInput
                placeholder="Buscar producto… (pulse Enter)"
                appliedValue={productQuery}
                onSearch={setProductQuery}
              />
              <div className="admin-product-picker__list" role="group" aria-label="Seleccionar productos">
                {visibleProducts.length === 0 ? (
                  <p className="admin-meta">No hay productos que coincidan con la búsqueda.</p>
                ) : visibleProducts.map((product) => {
                  const selected = createForm.items.find((item) => item.productId === product.id)
                  return (
                    <div key={product.id} className="admin-product-picker__option">
                      <input
                        type="checkbox"
                        checked={Boolean(selected)}
                        onChange={() => toggleCreateProduct(product.id)}
                        aria-label={`Seleccionar ${product.nombre}`}
                      />
                      <span>
                        <strong>{product.nombre}</strong>
                        <small className="admin-meta">
                          {' '}{product.codigo} · {formatCOP(productPriceForClient(product, createClientType))}
                          {selectedClient ? ` (${createClientType})` : ''}
                        </small>
                      </span>
                      {selected ? (
                        <QtyInput
                          value={selected.qty}
                          min={1}
                          aria-label={`Cantidad ${product.nombre}`}
                          onChange={(qty) => setCreateQty(product.id, qty)}
                        />
                      ) : (
                        <span className="admin-badge">disponible</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="admin-meta">
                Seleccionados: {createForm.items.length} · Total estimado: <strong>{formatCOP(createTotal)}</strong>
              </p>
            </div>
            {createErrors.items ? <span className="admin-form__error">{createErrors.items}</span> : null}
          </div>

          <label className="admin-form__field">
            Método de pago
            <select
              className={`admin-input ${createErrors.paymentMethod ? 'admin-input--error' : ''}`}
              value={createForm.paymentMethod}
              onChange={(event) => setCreateForm((current) => ({
                ...current,
                paymentMethod: event.target.value as PaymentMethod | '',
                cashAmount: '',
                receiptName: '',
                receiptDataUrl: '',
              }))}
            >
              <option value="">Seleccione…</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="credito">Crédito</option>
            </select>
            {createErrors.paymentMethod ? <span className="admin-form__error">{createErrors.paymentMethod}</span> : null}
          </label>

          {createForm.paymentMethod === 'efectivo' ? (
            <label className="admin-form__field">
              Valor recibido en efectivo
              <MoneyInput
                className={createErrors.cashAmount ? 'admin-money--error' : ''}
                value={createForm.cashAmount}
                aria-label="Valor en efectivo"
                onChange={(cashAmount) => setCreateForm((current) => ({
                  ...current,
                  cashAmount,
                }))}
              />
              {createErrors.cashAmount ? <span className="admin-form__error">{createErrors.cashAmount}</span> : null}
            </label>
          ) : null}

          {createForm.paymentMethod === 'transferencia' ? (
            <label className="admin-form__field">
              Comprobante (imagen)
              <input
                className="admin-input"
                type="file"
                accept="image/*"
                onChange={(event) => onReceiptChange(event.target.files?.[0] ?? null)}
              />
              {createForm.receiptName ? <span className="admin-form__hint">{createForm.receiptName}</span> : null}
              {createErrors.receipt ? <span className="admin-form__error">{createErrors.receipt}</span> : null}
            </label>
          ) : null}

          {createForm.paymentMethod === 'credito' ? (
            <div className="admin-form__field">
              <span className="admin-meta">
                {createForm.clientId
                  ? (creditInfo.hasCredit
                    ? `Crédito disponible: ${formatCOP(creditInfo.available)} · Total del pedido: ${formatCOP(createTotal)}`
                    : 'Este cliente no tiene crédito disponible')
                  : 'Primero seleccione un cliente para consultar su crédito'}
              </span>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(cancelTarget)}
        title="Anular pedido"
        onClose={() => setCancelTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setCancelTarget(null)}>
              Volver
            </button>
            <button type="button" className="admin-btn" onClick={confirmCancelOrder}>
              Confirmar anulación
            </button>
          </>
        )}
      >
        <p className="admin-meta">
          Va a anular el pedido <strong>{cancelTarget?.id}</strong>. Pasará a estado <strong>Cancelado</strong>.
        </p>
        <label className="admin-form__field">
          Motivo de la anulación
          <textarea
            className={`admin-input admin-textarea ${cancelError ? 'admin-input--error' : ''}`}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={3}
            placeholder="Explique por qué se anula este pedido"
          />
          {cancelError ? <span className="admin-form__error">{cancelError}</span> : null}
        </label>
      </Modal>
    </section>
  )
}
