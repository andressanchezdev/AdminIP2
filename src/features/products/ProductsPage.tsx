import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  createProduct,
  getProductPrices,
  mockProducts,
  productDisplayLabel,
  updateProduct,
  WAREHOUSES,
  type ProductRecord,
} from '@/mocks/data'
import { formatCOP, formatMoneyInput } from '@/shared/lib/formatMoney'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import {
  fileToWebpDataUrl,
  isImageFile,
  isValidImageSource,
} from '@/shared/lib/productImage'
import { useEnterConfirm } from '@/shared/lib/useEnterConfirm'
import {
  INPUT_CHAR_MAX,
  isUniqueInsensitive,
  validateDescription,
  validateNonNegativeInt,
  validatePersonName,
  validatePositiveMoney,
  validateProductModel,
  validateSkuCode,
  validateUnique,
} from '@/shared/lib/validation'
import { ResourcePage } from '@/pages/ResourcePage'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { Modal } from '@/shared/ui/Modal/Modal'
import { MoneyInput, parseMoneyInput } from '@/shared/ui/MoneyInput/MoneyInput'
import { QtyInput } from '@/shared/ui/QtyInput/QtyInput'

type ProductForm = {
  codigo: string
  nombre: string
  descripcion: string
  modelo: string
  cantidad: number
  bodega: string
  precioMayorista: string
  precioMinorista: string
  precioEmpresarial: string
  imagenUrl: string
  imagenDataUrl: string
  imagenNombre: string
}

const emptyForm: ProductForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  modelo: '',
  cantidad: 0,
  bodega: WAREHOUSES[0],
  precioMayorista: '',
  precioMinorista: '',
  precioEmpresarial: '',
  imagenUrl: '',
  imagenDataUrl: '',
  imagenNombre: '',
}

export function ProductsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('products:create')
  const canUpdate = hasPermission('products:update')
  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRecord | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm | 'imagen', string>>>({})
  const [converting, setConverting] = useState(false)

  const rows = useMemo(
    () => mockProducts.map((product) => ({
      id: product.id,
      codigo: product.codigo,
      producto: productDisplayLabel(product),
      nombre: product.nombre,
      descripcion: product.descripcion,
      modelo: product.modelo,
      bodega: product.bodega,
      cantidad: product.cantidad,
      status: product.status,
      imagen: product.imagen ?? '',
    })),
    [mockProducts.length, mockProducts.map((p) => `${p.status}:${p.cantidad}:${p.nombre}:${p.imagen}`).join()],
  )

  const previewSrc = form.imagenDataUrl || form.imagenUrl.trim()

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (product: ProductRecord) => {
    if (product.status === 'inactivo') return
    const prices = getProductPrices(product)
    const imagen = product.imagen ?? ''
    const isData = imagen.startsWith('data:image/')
    setEditing(product)
    setForm({
      codigo: product.codigo,
      nombre: product.nombre,
      descripcion: product.descripcion,
      modelo: product.modelo,
      cantidad: product.cantidad,
      bodega: product.bodega,
      precioMayorista: formatMoneyInput(prices.mayorista),
      precioMinorista: formatMoneyInput(prices.minorista),
      precioEmpresarial: formatMoneyInput(prices.empresarial),
      imagenUrl: isData ? '' : imagen,
      imagenDataUrl: isData ? imagen : '',
      imagenNombre: isData ? 'imagen.webp' : '',
    })
    setErrors({})
    setFormOpen(true)
  }

  const onImageFileChange = async (file: File | null) => {
    if (!file) {
      setForm((current) => ({ ...current, imagenDataUrl: '', imagenNombre: '' }))
      return
    }
    if (!isImageFile(file)) {
      setErrors((current) => ({
        ...current,
        imagen: 'El archivo debe ser una imagen (JPG, PNG, WebP, GIF, AVIF, etc.)',
      }))
      notifyError('Archivo no válido', 'Solo se permiten imágenes')
      return
    }
    setConverting(true)
    try {
      const webp = await fileToWebpDataUrl(file)
      setForm((current) => ({
        ...current,
        imagenDataUrl: webp,
        imagenNombre: file.name.replace(/\.[^.]+$/, '') + '.webp',
        imagenUrl: '',
      }))
      setErrors((current) => ({ ...current, imagen: undefined }))
      notifySuccess('Imagen lista', 'Convertida a WebP')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo procesar la imagen'
      setErrors((current) => ({ ...current, imagen: message }))
      notifyError('Imagen no procesada', message)
    } finally {
      setConverting(false)
    }
  }

  const resolveImagen = () => {
    if (form.imagenDataUrl) return form.imagenDataUrl
    const url = form.imagenUrl.trim()
    if (!url) return null
    if (!isValidImageSource(url)) return undefined
    return url
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    const imagenValue = resolveImagen()
    const nextErrors: Partial<Record<keyof ProductForm | 'imagen', string>> = {
      codigo: validateSkuCode(form.codigo, 'Código') ?? undefined,
      nombre: validatePersonName(form.nombre, 'Nombre') ?? undefined,
      descripcion: validateDescription(form.descripcion, 'Descripción') ?? undefined,
      modelo: validateProductModel(form.modelo) ?? undefined,
      bodega: form.bodega ? undefined : 'Seleccione bodega',
      precioMayorista: validatePositiveMoney(form.precioMayorista, 'Precio mayorista') ?? undefined,
      precioMinorista: validatePositiveMoney(form.precioMinorista, 'Precio minorista') ?? undefined,
      precioEmpresarial: validatePositiveMoney(form.precioEmpresarial, 'Precio empresarial') ?? undefined,
      cantidad: validateNonNegativeInt(form.cantidad, 'Cantidad') ?? undefined,
      imagen: imagenValue === undefined
        ? 'Indique una URL válida o cargue un archivo de imagen'
        : undefined,
    }
    if (!nextErrors.codigo && !isUniqueInsensitive(
      form.codigo,
      mockProducts.map((product) => product.codigo),
      editing?.codigo,
    )) {
      nextErrors.codigo = 'Ya existe un producto con ese código'
    }
    if (!nextErrors.nombre) {
      const nameDup = validateUnique(
        form.nombre,
        mockProducts.map((product) => product.nombre),
        'Nombre',
        editing?.nombre,
      )
      if (nameDup) nextErrors.nombre = nameDup
    }
    const cleaned = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value)),
    ) as typeof errors
    setErrors(cleaned)
    if (Object.keys(cleaned).length > 0) {
      notifyError('Revise el formulario', Object.values(cleaned)[0])
      return
    }

    const precios = {
      mayorista: parseMoneyInput(form.precioMayorista),
      minorista: parseMoneyInput(form.precioMinorista),
      empresarial: parseMoneyInput(form.precioEmpresarial),
    }
    const imagen = imagenValue ?? null

    if (editing) {
      const updated = updateProduct(editing.id, {
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion,
        modelo: form.modelo,
        cantidad: form.cantidad,
        bodega: form.bodega,
        precios: [precios],
        imagen,
      })
      if (!updated) {
        notifyError('No se pudo actualizar el producto')
        return
      }
      appendAuditLog({
        action: 'product.update',
        entity: 'product',
        entityId: editing.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó el producto ${updated.nombre}`,
        kind: 'change',
      })
      notifySuccess('Producto actualizado', updated.nombre)
    } else {
      if (!canCreate) return
      const result = createProduct({
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion,
        modelo: form.modelo,
        cantidad: form.cantidad,
        bodega: form.bodega,
        precios,
        imagen,
      })
      if (!result.ok) {
        notifyError('No se pudo crear el producto', result.error)
        return
      }
      appendAuditLog({
        action: 'product.create',
        entity: 'product',
        entityId: result.product.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó el producto ${result.product.nombre}`,
        kind: 'change',
      })
      notifySuccess('Producto creado', result.product.nombre)
    }
    setFormOpen(false)
    refresh()
  }

  useEnterConfirm(formOpen, () => handleSubmit())

  return (
    <>
      <ResourcePage
        createLabel="Crear producto"
        createPermission="products:create"
        updatePermission="products:update"
        detailTitle="Detalle del producto"
        searchPlaceholder="Buscar por código, producto o bodega… (pulse Enter)"
        searchKeys={['codigo', 'producto', 'bodega', 'modelo', 'id']}
        statusFilterKey="status"
        filterAllLabel="Todos los estados"
        statusOptions={['activo', 'inactivo']}
        hideDelete
        onCreate={openCreate}
        onEdit={(row) => {
          const product = mockProducts.find((entry) => entry.id === row.id)
          if (product) openEdit(product)
        }}
        onStatusChange={(row, nextStatus) => {
          if (!canUpdate) return
          updateProduct(String(row.id), { status: nextStatus })
          appendAuditLog({
            action: 'product.status',
            entity: 'product',
            entityId: String(row.id),
            actorId: user?.id ?? 'unknown',
            actorRole: user?.roles[0] ?? 'UNKNOWN',
            details: `Cambió el estado del producto ${row.nombre} a ${nextStatus}`,
            kind: 'change',
          })
          notifySuccess('Estado actualizado', `${row.nombre} → ${nextStatus}`)
          refresh()
        }}
        columns={[
          { key: 'codigo', label: 'Código', priority: 1 },
          { key: 'producto', label: 'Producto', priority: 2 },
          { key: 'status', label: 'Estado', statusSelect: true, priority: 3 },
          { key: 'id', label: 'ID' },
          { key: 'bodega', label: 'Bodega' },
        ]}
        renderDetail={(row) => {
          const product = mockProducts.find((entry) => entry.id === row.id)
          const prices = product ? getProductPrices(product) : null
          return (
            <DetailView
              title={String(row.nombre)}
              subtitle={`${row.codigo} · ${row.modelo}`}
              media={product?.imagen ? (
                <img className="detail-view__thumb" src={product.imagen} alt={String(row.nombre)} />
              ) : (
                <div className="detail-view__thumb detail-view__thumb--empty" aria-hidden />
              )}
              sections={[
                {
                  title: 'Información',
                  fields: [
                    { label: 'Código', value: row.codigo },
                    { label: 'Bodega', value: row.bodega },
                    { label: 'Cantidad', value: row.cantidad },
                    { label: 'Estado', value: row.status },
                  ],
                },
                {
                  title: 'Precios',
                  fields: [
                    { label: 'Minorista', value: formatCOP(prices?.minorista) },
                    { label: 'Mayorista', value: formatCOP(prices?.mayorista) },
                    { label: 'Empresarial', value: formatCOP(prices?.empresarial) },
                  ],
                },
              ]}
            />
          )
        }}
        rows={rows}
      />

      <Modal
        isOpen={formOpen}
        title={editing ? 'Actualizar producto' : 'Crear producto'}
        size="lg"
        onClose={() => setFormOpen(false)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>Volver</button>
            <button type="submit" form="product-form" className="admin-btn" disabled={converting}>
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        )}
      >
        <form id="product-form" className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="admin-form__field">
            Código
            <input className={`admin-input ${errors.codigo ? 'admin-input--error' : ''}`} value={form.codigo} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, codigo: e.target.value }))} />
            {errors.codigo ? <span className="admin-form__error">{errors.codigo}</span> : null}
          </label>
          <label className="admin-form__field">
            Nombre
            <input className={`admin-input ${errors.nombre ? 'admin-input--error' : ''}`} value={form.nombre} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))} />
            {errors.nombre ? <span className="admin-form__error">{errors.nombre}</span> : null}
          </label>
          <label className="admin-form__field">
            Descripción
            <textarea className={`admin-input admin-textarea ${errors.descripcion ? 'admin-input--error' : ''}`} value={form.descripcion} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, descripcion: e.target.value }))} rows={3} />
            {errors.descripcion ? <span className="admin-form__error">{errors.descripcion}</span> : null}
          </label>
          <label className="admin-form__field">
            Modelo
            <input className={`admin-input ${errors.modelo ? 'admin-input--error' : ''}`} value={form.modelo} maxLength={INPUT_CHAR_MAX} onChange={(e) => setForm((c) => ({ ...c, modelo: e.target.value }))} />
            {errors.modelo ? <span className="admin-form__error">{errors.modelo}</span> : null}
          </label>
          <label className="admin-form__field">
            Cantidad
            <QtyInput
              className={`admin-input admin-input--qty ${errors.cantidad ? 'admin-input--error' : ''}`}
              min={0}
              value={form.cantidad}
              aria-label="Cantidad en inventario"
              onChange={(cantidad) => setForm((c) => ({ ...c, cantidad }))}
            />
            {errors.cantidad ? <span className="admin-form__error">{errors.cantidad}</span> : null}
          </label>
          <label className="admin-form__field">
            Bodega
            <select className={`admin-input ${errors.bodega ? 'admin-input--error' : ''}`} value={form.bodega} onChange={(e) => setForm((c) => ({ ...c, bodega: e.target.value }))}>
              {WAREHOUSES.map((bodega) => (
                <option key={bodega} value={bodega}>{bodega}</option>
              ))}
            </select>
            {errors.bodega ? <span className="admin-form__error">{errors.bodega}</span> : null}
          </label>

          <div className="admin-form__field admin-image-field">
            <span>Imagen del producto</span>
            <div className="admin-image-field__row">
              <input
                className="admin-input"
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.svg,.tif,.tiff,.heic,.heif,.ico"
                disabled={converting}
                onChange={(event) => {
                  void onImageFileChange(event.target.files?.[0] ?? null)
                  event.target.value = ''
                }}
              />
              {previewSrc ? (
                <img className="admin-image-field__preview" src={previewSrc} alt="Vista previa del producto" />
              ) : (
                <div className="admin-image-field__preview admin-image-field__preview--empty">Sin imagen</div>
              )}
            </div>
            {form.imagenNombre ? <span className="admin-form__hint">Archivo: {form.imagenNombre}</span> : null}
            <label className="admin-form__field">
              O URL de la imagen
              <input
                className={`admin-input ${errors.imagen ? 'admin-input--error' : ''}`}
                value={form.imagenUrl}
                placeholder="https://… o /ruta/local.webp"
                onChange={(e) => setForm((c) => ({
                  ...c,
                  imagenUrl: e.target.value,
                  imagenDataUrl: e.target.value.trim() ? '' : c.imagenDataUrl,
                  imagenNombre: e.target.value.trim() ? '' : c.imagenNombre,
                }))}
              />
            </label>
            {errors.imagen ? <span className="admin-form__error">{errors.imagen}</span> : null}
            {(form.imagenDataUrl || form.imagenUrl) ? (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => setForm((c) => ({
                  ...c,
                  imagenDataUrl: '',
                  imagenUrl: '',
                  imagenNombre: '',
                }))}
              >
                Quitar imagen
              </button>
            ) : null}
          </div>

          <label className="admin-form__field">
            Precio minorista
            <MoneyInput className={errors.precioMinorista ? 'admin-money--error' : ''} value={form.precioMinorista} onChange={(precioMinorista) => setForm((c) => ({ ...c, precioMinorista }))} />
            {errors.precioMinorista ? <span className="admin-form__error">{errors.precioMinorista}</span> : null}
          </label>
          <label className="admin-form__field">
            Precio mayorista
            <MoneyInput className={errors.precioMayorista ? 'admin-money--error' : ''} value={form.precioMayorista} onChange={(precioMayorista) => setForm((c) => ({ ...c, precioMayorista }))} />
            {errors.precioMayorista ? <span className="admin-form__error">{errors.precioMayorista}</span> : null}
          </label>
          <label className="admin-form__field">
            Precio empresarial
            <MoneyInput className={errors.precioEmpresarial ? 'admin-money--error' : ''} value={form.precioEmpresarial} onChange={(precioEmpresarial) => setForm((c) => ({ ...c, precioEmpresarial }))} />
            {errors.precioEmpresarial ? <span className="admin-form__error">{errors.precioEmpresarial}</span> : null}
          </label>
        </form>
      </Modal>
    </>
  )
}
