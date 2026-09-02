import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  createCategory,
  deactivateCategory,
  deleteCategory,
  mockCategories,
  productsInCategory,
  updateCategory,
  type CategoryRecord,
} from '@/mocks/data'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'
import { useEnterConfirm } from '@/shared/lib/useEnterConfirm'
import { notifyError, notifySuccess, confirmAction } from '@/shared/lib/notify'
import {
  INPUT_CHAR_MAX,
  isUniqueInsensitive,
  validateDescription,
  validatePersonName,
} from '@/shared/lib/validation'

type CategoryFormState = {
  name: string
  description: string
}

const emptyForm: CategoryFormState = { name: '', description: '' }

export function CategoriesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('categories:create')
  const canUpdate = hasPermission('categories:update')
  const canDelete = hasPermission('categories:delete')
  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRecord | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [formError, setFormError] = useState('')
  const [viewTarget, setViewTarget] = useState<CategoryRecord | null>(null)
  const [migrateMode, setMigrateMode] = useState<'deactivate' | 'delete' | null>(null)
  const [migrateTarget, setMigrateTarget] = useState<CategoryRecord | null>(null)
  const [migrateToId, setMigrateToId] = useState('')
  const [migrateError, setMigrateError] = useState('')

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (category: CategoryRecord) => {
    if (category.status === 'inactivo') return
    setEditing(category)
    setForm({ name: category.name, description: category.description })
    setFormError('')
    setFormOpen(true)
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    const nameError = validatePersonName(form.name, 'Nombre')
    const descError = validateDescription(form.description, 'Descripción')
    if (nameError || descError) {
      setFormError(nameError || descError || '')
      notifyError('Revise el formulario', nameError || descError || undefined)
      return
    }
    if (!isUniqueInsensitive(
      form.name,
      mockCategories.map((entry) => entry.name),
      editing?.name,
    )) {
      setFormError('Ya existe una categoría con ese nombre')
      notifyError('Nombre duplicado', 'Ya existe una categoría con ese nombre')
      return
    }
    if (editing) {
      updateCategory(editing.id, form)
      appendAuditLog({
        action: 'category.update',
        entity: 'category',
        entityId: editing.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó categoría ${form.name}`,
        kind: 'change',
      })
      notifySuccess('Categoría actualizada', form.name)
    } else {
      const created = createCategory(form)
      appendAuditLog({
        action: 'category.create',
        entity: 'category',
        entityId: created.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó categoría ${created.name}`,
        kind: 'change',
      })
      notifySuccess('Categoría creada', created.name)
    }
    setFormOpen(false)
    refresh()
  }

  const openMigrate = (category: CategoryRecord, mode: 'deactivate' | 'delete') => {
    setMigrateTarget(category)
    setMigrateMode(mode)
    setMigrateToId('')
    setMigrateError('')
  }

  const confirmMigrate = () => {
    if (!migrateTarget || !migrateMode) return
    const result = migrateMode === 'deactivate'
      ? deactivateCategory(migrateTarget.id, migrateToId)
      : deleteCategory(migrateTarget.id, migrateToId)
    if (!result.ok) {
      setMigrateError(result.error)
      notifyError('Operación fallida', result.error)
      return
    }
    appendAuditLog({
      action: migrateMode === 'deactivate' ? 'category.deactivate' : 'category.delete',
      entity: 'category',
      entityId: migrateTarget.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `${migrateMode === 'deactivate' ? 'Desactivó' : 'Eliminó'} categoría ${migrateTarget.name}. Migró productos a ${migrateToId}`,
      kind: 'change',
    })
    notifySuccess(
      migrateMode === 'deactivate' ? 'Categoría desactivada' : 'Categoría eliminada',
      migrateTarget.name,
    )
    setMigrateTarget(null)
    setMigrateMode(null)
    refresh()
  }

  useEnterConfirm(formOpen, () => handleSubmit())
  useEnterConfirm(Boolean(migrateTarget), confirmMigrate)

  const [query, setQuery] = useState('')
  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return mockCategories
    return mockCategories.filter((category) => (
      category.id.toLowerCase().includes(normalized)
      || category.name.toLowerCase().includes(normalized)
      || category.description.toLowerCase().includes(normalized)
    ))
  }, [query, mockCategories.length, mockCategories.map((c) => `${c.status}:${c.name}`).join()])

  const migrateOptions = mockCategories.filter((entry) => {
    if (!migrateTarget) return false
    if (entry.id === migrateTarget.id) return false
    if (migrateMode === 'deactivate') return entry.status === 'activo'
    return true
  })

  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <SearchInput
            appliedValue={query}
            placeholder="Buscar categoría… (pulse Enter)"
            onSearch={setQuery}
          />
        </div>
        <div className="admin-toolbar__create">
          <button type="button" className="admin-btn" disabled={!canCreate} onClick={openCreate}>
            Crear categoría
          </button>
        </div>
      </div>

      <ResponsiveTableShell
        empty={filteredCategories.length === 0}
        cards={filteredCategories.map((category) => {
          const count = productsInCategory(category.id).length
          const inactive = category.status === 'inactivo'
          const statusCell = (
            <select
              className="admin-input admin-input--status"
              value={category.status}
              disabled={!canUpdate}
              onChange={async (event) => {
                const next = event.target.value
                if (next === category.status) return
                if (next === 'inactivo') {
                  const confirmed = await confirmAction({
                    title: '¿Desactivar categoría?',
                    text: `Va a desactivar "${category.name}". Deberá indicar a qué categoría migrar sus productos.`,
                    confirmText: 'Continuar',
                    cancelText: 'Volver',
                  })
                  if (!confirmed) return
                  openMigrate(category, 'deactivate')
                  return
                }
                const confirmed = await confirmAction({
                  title: '¿Activar categoría?',
                  text: `Va a activar "${category.name}".`,
                  confirmText: 'Activar',
                  cancelText: 'Volver',
                })
                if (!confirmed) return
                category.status = 'activo'
                category.updatedAt = new Date().toISOString()
                appendAuditLog({
                  action: 'category.activate',
                  entity: 'category',
                  entityId: category.id,
                  actorId: user?.id ?? 'unknown',
                  actorRole: user?.roles[0] ?? 'UNKNOWN',
                  details: `Activó categoría ${category.name}`,
                  kind: 'change',
                })
                notifySuccess('Categoría activada', category.name)
                refresh()
              }}
              aria-label={`Estado ${category.name}`}
            >
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          )
          const actions = (
            <div className="admin-row-actions">
              <IconAction label="Ver" variant="view" onClick={() => setViewTarget(category)} />
              <IconAction
                label="Editar"
                variant="edit"
                disabled={!canUpdate || inactive}
                title={inactive ? 'Categoría inactiva' : 'Editar'}
                onClick={() => openEdit(category)}
              />
              <IconAction
                label="Eliminar"
                variant="delete"
                disabled={!canDelete || inactive}
                title={inactive ? 'Categoría inactiva' : 'Eliminar'}
                onClick={() => {
                  if (inactive) return
                  openMigrate(category, 'delete')
                }}
              />
            </div>
          )
          return (
            <AdminRowCard
              key={category.id}
              title={category.name}
              actions={actions}
              fields={[
                { label: 'Nombre', value: category.name, primary: true },
                { label: 'Productos', value: count, primary: true },
                { label: 'Estado', value: statusCell, primary: true },
                { label: 'ID', value: category.id },
                { label: 'Descripción', value: category.description },
              ]}
            />
          )
        })}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th data-priority="1">Nombre</th>
              <th>Descripción</th>
              <th data-priority="2">Productos</th>
              <th data-priority="3">Estado</th>
              <th className="admin-table__actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => {
              const count = productsInCategory(category.id).length
              const inactive = category.status === 'inactivo'
              return (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td data-priority="1">{category.name}</td>
                  <td>{category.description}</td>
                  <td data-priority="2">{count}</td>
                  <td data-priority="3">
                    <select
                      className="admin-input admin-input--status"
                      value={category.status}
                      disabled={!canUpdate}
                      onChange={async (event) => {
                        const next = event.target.value
                        if (next === category.status) return
                        if (next === 'inactivo') {
                          const confirmed = await confirmAction({
                            title: '¿Desactivar categoría?',
                            text: `Va a desactivar "${category.name}". Deberá indicar a qué categoría migrar sus productos.`,
                            confirmText: 'Continuar',
                            cancelText: 'Volver',
                          })
                          if (!confirmed) return
                          openMigrate(category, 'deactivate')
                          return
                        }
                        const confirmed = await confirmAction({
                          title: '¿Activar categoría?',
                          text: `Va a activar "${category.name}".`,
                          confirmText: 'Activar',
                          cancelText: 'Volver',
                        })
                        if (!confirmed) return
                        category.status = 'activo'
                        category.updatedAt = new Date().toISOString()
                        appendAuditLog({
                          action: 'category.activate',
                          entity: 'category',
                          entityId: category.id,
                          actorId: user?.id ?? 'unknown',
                          actorRole: user?.roles[0] ?? 'UNKNOWN',
                          details: `Activó categoría ${category.name}`,
                          kind: 'change',
                        })
                        notifySuccess('Categoría activada', category.name)
                        refresh()
                      }}
                      aria-label={`Estado ${category.name}`}
                    >
                      <option value="activo">activo</option>
                      <option value="inactivo">inactivo</option>
                    </select>
                  </td>
                  <td className="admin-table__actions-col">
                    <div className="admin-row-actions">
                      <IconAction label="Ver" variant="view" onClick={() => setViewTarget(category)} />
                      <IconAction
                        label="Editar"
                        variant="edit"
                        disabled={!canUpdate || inactive}
                        title={inactive ? 'Categoría inactiva' : 'Editar'}
                        onClick={() => openEdit(category)}
                      />
                      <IconAction
                        label="Eliminar"
                        variant="delete"
                        disabled={!canDelete || inactive}
                        title={inactive ? 'Categoría inactiva' : 'Eliminar'}
                        onClick={() => {
                          if (inactive) return
                          openMigrate(category, 'delete')
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
        isOpen={formOpen}
        title={editing ? 'Actualizar categoría' : 'Crear categoría'}
        onClose={() => setFormOpen(false)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="category-form" className="admin-btn">
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        )}
      >
        <form id="category-form" className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="admin-form__field">
            Nombre
            <input
              className="admin-input"
              value={form.name} maxLength={INPUT_CHAR_MAX}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="admin-form__field">
            Descripción
            <textarea
              className="admin-input admin-textarea"
              value={form.description} maxLength={INPUT_CHAR_MAX}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
            />
          </label>
          {formError ? <span className="admin-form__error">{formError}</span> : null}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewTarget)}
        title="Detalle de categoría"
        size="lg"
        onClose={() => setViewTarget(null)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setViewTarget(null)}>Cerrar</button>
        )}
      >
        {viewTarget ? (
          <DetailView
            title={viewTarget.name}
            subtitle={viewTarget.id}
            sections={[
              {
                title: 'Información',
                fields: [
                  { label: 'Estado', value: viewTarget.status },
                  { label: 'Descripción', value: viewTarget.description },
                  { label: 'Actualizado', value: viewTarget.updatedAt.slice(0, 16).replace('T', ' ') },
                ],
              },
              {
                title: 'Productos vinculados',
                fields: productsInCategory(viewTarget.id).length
                  ? productsInCategory(viewTarget.id).map((product) => ({
                    label: product.id,
                    value: product.nombre,
                  }))
                  : [{ label: 'Productos', value: 'Sin productos' }],
              },
            ]}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(migrateTarget)}
        title={migrateMode === 'delete' ? 'Eliminar categoría' : 'Desactivar categoría'}
        onClose={() => setMigrateTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setMigrateTarget(null)}>
              Cancelar
            </button>
            <button type="button" className="admin-btn" onClick={confirmMigrate}>
              Confirmar
            </button>
          </>
        )}
      >
        <p className="admin-meta">
          {migrateMode === 'delete' ? 'Eliminar' : 'Desactivar'} <strong>{migrateTarget?.name}</strong> requiere
          migrar sus productos a otra categoría
          {migrateMode === 'deactivate' ? ' activa' : ' existente'}.
        </p>
        <p className="admin-meta">
          Productos afectados: {migrateTarget ? productsInCategory(migrateTarget.id).length : 0}
        </p>
        <label className="admin-form__field">
          Migrar a
          <select
            className={`admin-input ${migrateError ? 'admin-input--error' : ''}`}
            value={migrateToId}
            onChange={(event) => setMigrateToId(event.target.value)}
          >
            <option value="">Seleccione…</option>
            {migrateOptions.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.id} — {entry.name}</option>
            ))}
          </select>
          {migrateError ? <span className="admin-form__error">{migrateError}</span> : null}
        </label>
      </Modal>
    </section>
  )
}
