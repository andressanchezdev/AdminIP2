import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  createUser,
  deleteUser,
  mockRoles,
  mockUsers,
  setUserStatus,
  updateUser,
  type AdminUser,
} from '@/mocks/data'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { PasswordField } from '@/shared/ui/PasswordField/PasswordField'
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'
import { TablePagination } from '@/shared/ui/TablePagination/TablePagination'
import { useTablePagination } from '@/shared/lib/useTablePagination'
import { useEnterConfirm } from '@/shared/lib/useEnterConfirm'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import {
  isUniqueInsensitive,
  INPUT_CHAR_MAX,
  validateAddress,
  validateEmail,
  validatePassword,
  validatePersonName,
  validatePhone,
  validateUnique,
} from '@/shared/lib/validation'

type UserFormState = {
  fullName: string
  phone: string
  address: string
  email: string
  password: string
  roleId: string
}

type FieldErrors = Partial<Record<keyof UserFormState, string>>

const emptyForm: UserFormState = {
  fullName: '',
  phone: '',
  address: '',
  email: '',
  password: '',
  roleId: '',
}

const STAFF_ROLES = mockRoles.filter((role) => role.id !== 'role_cliente')

function roleLabel(roleId: string) {
  return mockRoles.find((role) => role.id === roleId)?.name ?? roleId
}

function validateUserForm(form: UserFormState, editingId: string | null): FieldErrors {
  const errors: FieldErrors = {}
  const nameError = validatePersonName(form.fullName, 'Nombre completo')
  if (nameError) errors.fullName = nameError

  const phoneError = validatePhone(form.phone)
  if (phoneError) errors.phone = phoneError
  if (!errors.phone) {
    const currentPhone = editingId ? mockUsers.find((user) => user.id === editingId)?.phone : null
    const phoneDup = validateUnique(
      form.phone,
      mockUsers.map((entry) => entry.phone).filter(Boolean) as string[],
      'Teléfono',
      currentPhone,
    )
    if (phoneDup) errors.phone = phoneDup
  }

  const addressError = validateAddress(form.address)
  if (addressError) errors.address = addressError

  const emailError = validateEmail(form.email)
  if (emailError) {
    errors.email = emailError
  } else {
    const emails = mockUsers.map((user) => user.email)
    const current = editingId ? mockUsers.find((user) => user.id === editingId)?.email : null
    if (!isUniqueInsensitive(form.email, emails, current)) {
      errors.email = 'Ya existe un usuario con ese email'
    }
  }

  if (!form.roleId) {
    errors.roleId = 'Seleccione un rol'
  }

  const passwordError = validatePassword(form.password, { required: !editingId })
  if (passwordError) errors.password = passwordError

  return errors
}

export function UsersPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('users:create')
  const canUpdate = hasPermission('users:update')
  const canDelete = hasPermission('users:delete')
  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [viewUser, setViewUser] = useState<AdminUser | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ user: AdminUser; next: 'activo' | 'inactivo' } | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [statusError, setStatusError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const setField = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      setErrors(validateUserForm(next, editing?.id ?? null))
      return next
    })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (entry: AdminUser) => {
    if (entry.status === 'inactivo') return
    setEditing(entry)
    setForm({
      fullName: entry.fullName,
      phone: entry.phone,
      address: entry.address,
      email: entry.email,
      password: '',
      roleId: entry.roles[0] ?? '',
    })
    setErrors({})
    setFormOpen(true)
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    const nextErrors = validateUserForm(form, editing?.id ?? null)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Revise el formulario', Object.values(nextErrors)[0])
      return
    }

    if (editing) {
      const updated = updateUser(editing.id, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        roleId: form.roleId,
        ...(form.password ? { password: form.password } : {}),
      })
      if (!updated) {
        notifyError('No se pudo actualizar', 'Correo duplicado o rol inválido')
        return
      }
      appendAuditLog({
        action: 'user.update',
        entity: 'user',
        entityId: editing.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó usuario administrativo ${updated.email}`,
        kind: 'change',
      })
      notifySuccess('Usuario actualizado', updated.email)
    } else {
      const result = createUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        roleId: form.roleId,
      })
      if (!result.ok) {
        notifyError('No se pudo crear', result.error)
        return
      }
      appendAuditLog({
        action: 'user.create',
        entity: 'user',
        entityId: result.user.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó usuario administrativo ${result.user.email}`,
        kind: 'change',
      })
      notifySuccess('Usuario creado', result.user.email)
    }

    setFormOpen(false)
    refresh()
  }

  const confirmStatus = () => {
    if (!statusTarget) return
    if (!statusReason.trim()) {
      setStatusError('El motivo es obligatorio')
      return
    }
    const result = setUserStatus(statusTarget.user.id, statusTarget.next, statusReason)
    if (!result.ok) {
      setStatusError(result.error)
      notifyError('No se pudo cambiar el estado', result.error)
      return
    }
    appendAuditLog({
      action: statusTarget.next === 'activo' ? 'user.activate' : 'user.deactivate',
      entity: 'user',
      entityId: statusTarget.user.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `${statusTarget.next === 'activo' ? 'Activó' : 'Desactivó'} usuario ${statusTarget.user.email}. Motivo: ${result.reason}`,
      kind: 'change',
    })
    notifySuccess(
      statusTarget.next === 'activo' ? 'Usuario activado' : 'Usuario desactivado',
      statusTarget.user.email,
    )
    setStatusTarget(null)
    setStatusReason('')
    setStatusError('')
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const result = deleteUser(deleteTarget.id, deleteReason)
    if (!result.ok) {
      setDeleteError(result.error)
      notifyError('No se pudo eliminar', result.error)
      return
    }
    appendAuditLog({
      action: 'user.delete',
      entity: 'user',
      entityId: deleteTarget.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Eliminó usuario ${deleteTarget.email}. Motivo: ${result.reason}`,
      kind: 'change',
    })
    notifySuccess('Usuario eliminado', deleteTarget.email)
    setDeleteTarget(null)
    setDeleteReason('')
    setDeleteError('')
    refresh()
  }

  useEnterConfirm(formOpen, () => handleSubmit())
  useEnterConfirm(Boolean(statusTarget), confirmStatus)
  useEnterConfirm(Boolean(deleteTarget), confirmDelete)

  const emailHint = useMemo(() => {
    if (!form.email.trim() || errors.email) return null
    return 'Email disponible'
  }, [form.email, errors.email])

  const [query, setQuery] = useState('')
  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return mockUsers
    return mockUsers.filter((entry) => (
      entry.fullName.toLowerCase().includes(normalized)
      || entry.email.toLowerCase().includes(normalized)
      || entry.phone.toLowerCase().includes(normalized)
      || roleLabel(entry.roles[0] ?? '').toLowerCase().includes(normalized)
    ))
  }, [query, mockUsers.length, mockUsers.map((u) => u.status).join()])

  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSize,
  } = useTablePagination(filteredUsers, { resetKey: query })

  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <SearchInput
            appliedValue={query}
            placeholder="Buscar por nombre, correo o teléfono… (pulse Enter)"
            onSearch={setQuery}
          />
        </div>
        <div className="admin-toolbar__create">
          <button type="button" className="admin-btn" disabled={!canCreate} onClick={openCreate}>
            Crear usuario
          </button>
        </div>
      </div>

      <ResponsiveTableShell
        empty={filteredUsers.length === 0}
        cards={pageItems.map((entry) => {
          const inactive = entry.status === 'inactivo'
          const statusCell = (
            <select
              className="admin-input admin-input--status"
              value={entry.status}
              disabled={!canUpdate}
              onChange={(event) => {
                const next = event.target.value as 'activo' | 'inactivo'
                if (next === entry.status) return
                setStatusTarget({ user: entry, next })
                setStatusReason('')
                setStatusError('')
              }}
              aria-label={`Estado ${entry.fullName}`}
            >
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          )
          const actions = (
            <div className="admin-row-actions">
              <IconAction label="Ver" variant="view" onClick={() => setViewUser(entry)} />
              <IconAction
                label="Editar"
                variant="edit"
                disabled={!canUpdate || inactive}
                title={inactive ? 'Usuario inactivo' : 'Editar'}
                onClick={() => openEdit(entry)}
              />
              <IconAction
                label="Eliminar"
                variant="delete"
                disabled={!canDelete || entry.id === user?.id || inactive}
                title={
                  inactive
                    ? 'Usuario inactivo'
                    : entry.id === user?.id
                      ? 'No puede eliminarse a sí mismo'
                      : 'Eliminar'
                }
                onClick={() => {
                  if (inactive) return
                  setDeleteTarget(entry)
                  setDeleteReason('')
                  setDeleteError('')
                }}
              />
            </div>
          )
          return (
            <AdminRowCard
              key={entry.id}
              title={entry.fullName}
              actions={actions}
              fields={[
                { label: 'Nombre', value: entry.fullName, primary: true },
                { label: 'Correo', value: entry.email, primary: true },
                { label: 'Estado', value: statusCell, primary: true },
                { label: 'Teléfono', value: entry.phone },
                { label: 'Rol', value: roleLabel(entry.roles[0] ?? '') },
              ]}
            />
          )
        })}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th data-priority="1">Nombre</th>
              <th data-priority="2">Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th data-priority="3">Estado</th>
              <th className="admin-table__actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((entry) => {
              const inactive = entry.status === 'inactivo'
              return (
              <tr key={entry.id}>
                <td data-priority="1">{entry.fullName}</td>
                <td data-priority="2">{entry.email}</td>
                <td>{entry.phone}</td>
                <td>{roleLabel(entry.roles[0] ?? '')}</td>
                <td data-priority="3">
                  <select
                    className="admin-input admin-input--status"
                    value={entry.status}
                    disabled={!canUpdate}
                    onChange={(event) => {
                      const next = event.target.value as 'activo' | 'inactivo'
                      if (next === entry.status) return
                      setStatusTarget({ user: entry, next })
                      setStatusReason('')
                      setStatusError('')
                    }}
                    aria-label={`Estado ${entry.fullName}`}
                  >
                    <option value="activo">activo</option>
                    <option value="inactivo">inactivo</option>
                  </select>
                </td>
                <td className="admin-table__actions-col">
                  <div className="admin-row-actions">
                    <IconAction label="Ver" variant="view" onClick={() => setViewUser(entry)} />
                    <IconAction
                      label="Editar"
                      variant="edit"
                      disabled={!canUpdate || inactive}
                      title={inactive ? 'Usuario inactivo' : 'Editar'}
                      onClick={() => openEdit(entry)}
                    />
                    <IconAction
                      label="Eliminar"
                      variant="delete"
                      disabled={!canDelete || entry.id === user?.id || inactive}
                      title={
                        inactive
                          ? 'Usuario inactivo'
                          : entry.id === user?.id
                            ? 'No puede eliminarse a sí mismo'
                            : 'Eliminar'
                      }
                      onClick={() => {
                        if (inactive) return
                        setDeleteTarget(entry)
                        setDeleteReason('')
                        setDeleteError('')
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
        isOpen={formOpen}
        title={editing ? 'Actualizar usuario' : 'Crear usuario'}
        onClose={() => setFormOpen(false)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="user-form" className="admin-btn">
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        )}
      >
        <form id="user-form" className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="admin-form__field">
            Nombre completo
            <input
              className={`admin-input ${errors.fullName ? 'admin-input--error' : ''}`}
              value={form.fullName} maxLength={INPUT_CHAR_MAX}
              onChange={(event) => setField('fullName', event.target.value)}
            />
            {errors.fullName ? <span className="admin-form__error">{errors.fullName}</span> : null}
          </label>
          <label className="admin-form__field">
            Teléfono
            <input
              className={`admin-input ${errors.phone ? 'admin-input--error' : ''}`}
              value={form.phone} maxLength={INPUT_CHAR_MAX}
              onChange={(event) => setField('phone', event.target.value)}
              inputMode="tel"
            />
            {errors.phone ? <span className="admin-form__error">{errors.phone}</span> : null}
          </label>
          <label className="admin-form__field">
            Dirección
            <input
              className={`admin-input ${errors.address ? 'admin-input--error' : ''}`}
              value={form.address} maxLength={INPUT_CHAR_MAX}
              onChange={(event) => setField('address', event.target.value)}
            />
            {errors.address ? <span className="admin-form__error">{errors.address}</span> : null}
          </label>
          <label className="admin-form__field">
            Email
            <input
              className={`admin-input ${errors.email ? 'admin-input--error' : ''}`}
              type="email"
              value={form.email} maxLength={INPUT_CHAR_MAX}
              onChange={(event) => setField('email', event.target.value)}
            />
            {errors.email ? <span className="admin-form__error">{errors.email}</span> : null}
            {emailHint ? <span className="admin-form__hint">{emailHint}</span> : null}
          </label>
          <PasswordField
            label={editing ? 'Password (dejar vacío para no cambiar)' : 'Password'}
            value={form.password}
            onChange={(value) => setField('password', value)}
            error={errors.password}
            required={!editing}
            showRequirements
            hint={editing ? 'Solo complete si desea cambiar la clave' : undefined}
          />
          <label className="admin-form__field">
            Rol
            <select
              className={`admin-input ${errors.roleId ? 'admin-input--error' : ''}`}
              value={form.roleId}
              onChange={(event) => setField('roleId', event.target.value)}
            >
              <option value="">Seleccione un rol…</option>
              {STAFF_ROLES.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {errors.roleId ? <span className="admin-form__error">{errors.roleId}</span> : null}
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewUser)}
        title="Detalle del usuario"
        size="lg"
        onClose={() => setViewUser(null)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setViewUser(null)}>Cerrar</button>
        )}
      >
        {viewUser ? (
          <DetailView
            title={viewUser.fullName}
            subtitle="Usuario administrativo del panel"
            sections={[
              {
                title: 'Identificación',
                fields: [
                  { label: 'ID', value: viewUser.id },
                  { label: 'Email', value: viewUser.email },
                  { label: 'Rol', value: roleLabel(viewUser.roles[0] ?? '') },
                  { label: 'Estado', value: viewUser.status },
                ],
              },
              {
                title: 'Contacto',
                fields: [
                  { label: 'Teléfono', value: viewUser.phone },
                  { label: 'Dirección', value: viewUser.address },
                  { label: 'Último acceso', value: viewUser.lastLogin?.slice(0, 16).replace('T', ' ') ?? '—' },
                ],
              },
            ]}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.next === 'activo' ? '¿Activar usuario?' : '¿Desactivar usuario?'}
        onClose={() => setStatusTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setStatusTarget(null)}>
              Volver
            </button>
            <button type="button" className="admin-btn" onClick={confirmStatus}>
              {statusTarget?.next === 'activo' ? 'Confirmar activación' : 'Confirmar desactivación'}
            </button>
          </>
        )}
      >
        <p className="admin-meta">
          Va a cambiar el estado de <strong>{statusTarget?.user.fullName}</strong> ({statusTarget?.user.email}) a <strong>{statusTarget?.next}</strong>.
        </p>
        <label className="admin-form__field">
          Motivo (obligatorio)
          <textarea
            className={`admin-input admin-textarea ${statusError ? 'admin-input--error' : ''}`}
            value={statusReason}
            onChange={(event) => setStatusReason(event.target.value)}
            rows={3}
          />
          {statusError ? <span className="admin-form__error">{statusError}</span> : null}
        </label>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar usuario"
        onClose={() => setDeleteTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </button>
            <button type="button" className="admin-btn" onClick={confirmDelete}>
              Confirmar eliminación
            </button>
          </>
        )}
      >
        <p className="admin-meta">
          Va a eliminar al usuario <strong>{deleteTarget?.email}</strong>.
        </p>
        <label className="admin-form__field">
          Motivo (obligatorio)
          <textarea
            className={`admin-input admin-textarea ${deleteError ? 'admin-input--error' : ''}`}
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            rows={3}
          />
          {deleteError ? <span className="admin-form__error">{deleteError}</span> : null}
        </label>
      </Modal>
    </section>
  )
}
