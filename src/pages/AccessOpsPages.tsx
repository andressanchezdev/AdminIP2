import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { DetailView } from '@/shared/ui/DetailView/DetailView'
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'
import { clearRolesCache } from '@/shared/permissions/permissionEvaluator'
import { useEnterConfirm } from '@/shared/lib/useEnterConfirm'
import {
  appendAuditLog,
  createRole,
  deleteRole,
  mockPermissionsCatalog,
  mockRoles,
  mockSettings,
  mockUsers,
  updateRole,
  updateUser,
  type RoleRecord,
} from '@/mocks/data'
import { RolePermissionsChecklist } from '@/features/roles/RolePermissionsChecklist'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import {
  isUniqueInsensitive,
  validateAddress,
  validateEmail,
  validatePersonName,
  validatePhone,
  validateRoleName,
  validateDescription,
  validateReason,
  INPUT_CHAR_MAX,
} from '@/shared/lib/validation'

type RoleFormState = {
  name: string
  description: string
}

const emptyRoleForm: RoleFormState = {
  name: '',
  description: '',
}

function validateRoleForm(form: RoleFormState, editingId: string | null) {
  const errors: Partial<Record<'name' | 'description', string>> = {}
  const nameError = validateRoleName(form.name)
  if (nameError) {
    errors.name = nameError
  } else if (!isUniqueInsensitive(form.name, mockRoles.map((role) => role.name), editingId ? mockRoles.find((r) => r.id === editingId)?.name : null)) {
    errors.name = 'Ya existe un rol con ese nombre'
  }

  if (!form.description.trim()) {
    errors.description = 'La descripción es obligatoria'
  } else {
    const descError = validateDescription(form.description, 'Descripción')
    if (descError) errors.description = descError
  }

  return errors
}

export function RolesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('roles:create')
  const canUpdate = hasPermission('roles:update')
  const canDelete = hasPermission('roles:delete')
  const canManagePerms = hasPermission('permissions:manage')
  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoleRecord | null>(null)
  const [form, setForm] = useState<RoleFormState>(emptyRoleForm)
  const [errors, setErrors] = useState<Partial<Record<'name' | 'description', string>>>({})
  const [viewRole, setViewRole] = useState<RoleRecord | null>(null)
  const [permsRole, setPermsRole] = useState<RoleRecord | null>(null)
  const [permsSelection, setPermsSelection] = useState<string[]>([])
  const [permsError, setPermsError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteMigrateTo, setDeleteMigrateTo] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const filteredRoles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return mockRoles
    return mockRoles.filter((role) => (
      role.name.toLowerCase().includes(normalized)
      || role.description.toLowerCase().includes(normalized)
      || role.id.toLowerCase().includes(normalized)
    ))
  }, [query, mockRoles.length, mockRoles.map((r) => r.name).join()])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyRoleForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (role: RoleRecord) => {
    setEditing(role)
    setForm({
      name: role.name,
      description: role.description,
    })
    setErrors({})
    setFormOpen(true)
  }

  const openManagePermissions = (role: RoleRecord) => {
    setPermsRole(role)
    setPermsSelection([...role.permissions])
    setPermsError('')
  }

  const togglePermsModal = (code: string) => {
    setPermsSelection((current) => (
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    ))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateRoleForm(form, editing?.id ?? null)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Revise el formulario', Object.values(nextErrors)[0])
      return
    }

    if (editing) {
      updateRole(editing.id, {
        name: form.name,
        description: form.description,
        permissions: editing.permissions,
      })
      clearRolesCache()
      appendAuditLog({
        action: 'role.update',
        entity: 'role',
        entityId: editing.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó rol ${form.name}`,
        kind: 'change',
      })
      notifySuccess('Rol actualizado', form.name)
    } else {
      const created = createRole({
        name: form.name,
        description: form.description,
        permissions: [],
      })
      clearRolesCache()
      appendAuditLog({
        action: 'role.create',
        entity: 'role',
        entityId: created.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó rol ${created.name}`,
        kind: 'change',
      })
      notifySuccess('Rol creado', created.name)
    }

    setFormOpen(false)
    setEditing(null)
    setForm(emptyRoleForm)
    refresh()
  }

  const saveRolePermissions = () => {
    if (!permsRole) return
    if (permsSelection.length === 0) {
      setPermsError('Seleccione al menos un permiso')
      notifyError('Permisos incompletos', 'Seleccione al menos un permiso')
      return
    }
    updateRole(permsRole.id, {
      name: permsRole.name,
      description: permsRole.description,
      permissions: permsSelection,
    })
    clearRolesCache()
    appendAuditLog({
      action: 'role.permissions.update',
      entity: 'role',
      entityId: permsRole.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Actualizó permisos del rol ${permsRole.name}`,
      kind: 'change',
    })
    notifySuccess('Permisos guardados', permsRole.name)
    setPermsRole(null)
    setPermsSelection([])
    setPermsError('')
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const reasonError = validateReason(deleteReason, 'Motivo')
    if (reasonError) {
      setDeleteError(reasonError)
      notifyError('Revise el motivo', reasonError)
      return
    }
    const result = deleteRole(deleteTarget.id, deleteReason, deleteMigrateTo || undefined)
    if (!result.ok) {
      setDeleteError(result.error)
      notifyError('No se pudo eliminar el rol', result.error)
      return
    }
    clearRolesCache()
    const migrateLabel = result.migrateToRoleId
      ? mockRoles.find((role) => role.id === result.migrateToRoleId)?.name ?? result.migrateToRoleId
      : null
    appendAuditLog({
      action: 'role.delete',
      entity: 'role',
      entityId: deleteTarget.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: result.migratedCount
        ? `Eliminó el rol ${deleteTarget.name}. Migró ${result.migratedCount} usuario(s) a ${migrateLabel}. Motivo: ${result.reason}`
        : `Eliminó el rol ${deleteTarget.name}. Motivo: ${result.reason}`,
      kind: 'change',
    })
    notifySuccess(
      'Rol eliminado',
      result.migratedCount
        ? `${deleteTarget.name}. ${result.migratedCount} usuario(s) pasaron a ${migrateLabel}`
        : deleteTarget.name,
    )
    setDeleteTarget(null)
    setDeleteReason('')
    setDeleteMigrateTo('')
    setDeleteError('')
    refresh()
  }

  useEnterConfirm(formOpen, () => {
    const fakeEvent = { preventDefault() {} } as FormEvent
    handleSubmit(fakeEvent)
  })
  useEnterConfirm(Boolean(permsRole), saveRolePermissions)
  useEnterConfirm(Boolean(deleteTarget), confirmDelete)

  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <SearchInput
            appliedValue={query}
            placeholder="Buscar por nombre del rol… (pulse Enter)"
            onSearch={setQuery}
          />
        </div>
        <div className="admin-toolbar__create">
          <button type="button" className="admin-btn" disabled={!canCreate} onClick={openCreate}>
            Crear rol
          </button>
        </div>
      </div>

      <ResponsiveTableShell
        empty={filteredRoles.length === 0}
        cards={filteredRoles.map((role) => {
          const assignedUsers = mockUsers.filter((entry) => entry.roles.includes(role.id)).length
          const actions = (
            <div className="admin-row-actions">
              <IconAction label="Ver" variant="view" onClick={() => setViewRole(role)} />
              <IconAction
                label="Editar"
                variant="edit"
                disabled={!canUpdate}
                onClick={() => openEdit(role)}
              />
              <IconAction
                label="Eliminar"
                variant="delete"
                disabled={!canDelete || role.id === 'role_admin'}
                title={role.id === 'role_admin' ? 'No se puede eliminar ADMIN' : 'Eliminar'}
                onClick={() => {
                  setDeleteTarget(role)
                  setDeleteReason('')
                  setDeleteMigrateTo('')
                  setDeleteError('')
                }}
              />
            </div>
          )
          return (
            <AdminRowCard
              key={role.id}
              title={role.name}
              actions={actions}
              fields={[
                { label: 'Rol', value: role.name, primary: true },
                { label: 'Permisos', value: role.permissions.length, primary: true },
                { label: 'Usuarios', value: assignedUsers, primary: true },
                { label: 'Descripción', value: role.description },
                {
                  label: 'Gestionar',
                  value: (
                    <IconAction
                      label="Gestionar permisos del rol"
                      variant="settings"
                      disabled={!canManagePerms}
                      onClick={() => openManagePermissions(role)}
                    />
                  ),
                },
              ]}
            />
          )
        })}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th data-priority="1">Nombre del rol</th>
              <th>Descripción</th>
              <th data-priority="2">N° permisos</th>
              <th data-priority="3">Usuarios asignados</th>
              <th>Gestionar permisos del rol</th>
              <th className="admin-table__actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => {
              const assignedUsers = mockUsers.filter((entry) => entry.roles.includes(role.id)).length
              return (
                <tr key={role.id}>
                  <td data-priority="1">{role.name}</td>
                  <td>{role.description}</td>
                  <td data-priority="2">{role.permissions.length}</td>
                  <td data-priority="3">{assignedUsers}</td>
                  <td>
                    <IconAction
                      label="Gestionar permisos del rol"
                      variant="settings"
                      disabled={!canManagePerms}
                      onClick={() => openManagePermissions(role)}
                    />
                  </td>
                  <td className="admin-table__actions-col">
                    <div className="admin-row-actions">
                      <IconAction label="Ver" variant="view" onClick={() => setViewRole(role)} />
                      <IconAction
                        label="Editar"
                        variant="edit"
                        disabled={!canUpdate}
                        onClick={() => openEdit(role)}
                      />
                      <IconAction
                        label="Eliminar"
                        variant="delete"
                        disabled={!canDelete || role.id === 'role_admin'}
                        title={role.id === 'role_admin' ? 'No se puede eliminar ADMIN' : 'Eliminar'}
                        onClick={() => {
                          setDeleteTarget(role)
                          setDeleteReason('')
                          setDeleteMigrateTo('')
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

      <Modal
        isOpen={formOpen}
        title={editing ? 'Actualizar rol' : 'Crear rol'}
        onClose={() => setFormOpen(false)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="role-form" className="admin-btn">
              {editing ? 'Actualizar rol' : 'Crear rol'}
            </button>
          </>
        )}
      >
        <form id="role-form" className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="admin-form__field">
            Nombre del rol
            <input
              className={`admin-input ${errors.name ? 'admin-input--error' : ''}`}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej. SUPERVISOR"
              maxLength={INPUT_CHAR_MAX}
            />
            {errors.name ? <span className="admin-form__error">{errors.name}</span> : null}
          </label>

          <label className="admin-form__field">
            Descripción
            <textarea
              className={`admin-input admin-textarea ${errors.description ? 'admin-input--error' : ''}`}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe el alcance del rol"
              rows={3}
              maxLength={INPUT_CHAR_MAX}
            />
            {errors.description ? <span className="admin-form__error">{errors.description}</span> : null}
          </label>
          <p className="admin-meta">
            Los permisos se asignan con la acción <strong>Gestionar permisos del rol</strong>.
          </p>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(permsRole)}
        title={`Permisos — ${permsRole?.name ?? ''}`}
        onClose={() => setPermsRole(null)}
        size="lg"
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setPermsRole(null)}>
              Cancelar
            </button>
            <button type="button" className="admin-btn" onClick={saveRolePermissions}>
              Guardar permisos
            </button>
          </>
        )}
      >
        <div className="admin-form">
          <p className="admin-meta">
            Marque las acciones que este rol podrá realizar en cada módulo.
            La opción de <strong>ver / consultar</strong> también define si el módulo aparece en el menú lateral.
          </p>
          <RolePermissionsChecklist
            catalog={mockPermissionsCatalog}
            selected={permsSelection}
            onToggle={togglePermsModal}
            disabled={!canManagePerms}
            error={permsError}
          />
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewRole)}
        title="Detalle del rol"
        onClose={() => setViewRole(null)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setViewRole(null)}>Cerrar</button>
        )}
      >
        {viewRole ? (
          <DetailView
            title={viewRole.name}
            subtitle={viewRole.description}
            sections={[
              {
                title: 'Permisos asignados',
                fields: viewRole.permissions.map((code) => ({
                  label: code,
                  value: mockPermissionsCatalog.find((entry) => entry.code === code)?.label ?? code,
                })),
              },
            ]}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar rol"
        onClose={() => setDeleteTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setDeleteTarget(null)}>
              Volver
            </button>
            <button type="button" className="admin-btn" onClick={confirmDelete}>
              Confirmar eliminación
            </button>
          </>
        )}
      >
        <p className="admin-meta">
          Va a eliminar el rol <strong>{deleteTarget?.name}</strong>.
        </p>
        {deleteTarget ? (() => {
          const assignedCount = mockUsers.filter((entry) => entry.roles.includes(deleteTarget.id)).length
          const migrateOptions = mockRoles.filter((role) => (
            role.id !== deleteTarget.id && role.id !== 'role_cliente'
          ))
          return (
            <>
              {assignedCount > 0 ? (
                <label className="admin-form__field">
                  Reasignar {assignedCount} usuario(s) a otro rol
                  <select
                    className={`admin-input ${deleteError && !deleteMigrateTo ? 'admin-input--error' : ''}`}
                    value={deleteMigrateTo}
                    onChange={(event) => setDeleteMigrateTo(event.target.value)}
                  >
                    <option value="">Seleccione el rol de destino…</option>
                    {migrateOptions.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <span className="admin-form__hint">
                    Los usuarios con este rol pasarán automáticamente al rol elegido.
                  </span>
                </label>
              ) : (
                <p className="admin-meta">Ningún usuario tiene este rol asignado.</p>
              )}
            </>
          )
        })() : null}
        <label className="admin-form__field">
          Motivo de la eliminación
          <textarea
            className={`admin-input admin-textarea ${deleteError ? 'admin-input--error' : ''}`}
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            rows={3}
            maxLength={INPUT_CHAR_MAX}
            placeholder="Explique por qué elimina este rol"
          />
          {deleteError ? <span className="admin-form__error">{deleteError}</span> : null}
        </label>
      </Modal>
    </section>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission('profile:update')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  })
  const [snapshot, setSnapshot] = useState(form)
  const [errors, setErrors] = useState<Partial<Record<'fullName' | 'email' | 'phone' | 'address', string>>>({})

  const startEdit = () => {
    if (!canEdit) {
      notifyError('Sin permiso', 'No puede actualizar su perfil')
      return
    }
    setSnapshot(form)
    setErrors({})
    setEditing(true)
  }

  const cancelEdit = () => {
    setForm(snapshot)
    setErrors({})
    setEditing(false)
  }

  const saveProfile = () => {
    if (!user) return
    const nextErrors = {
      fullName: validatePersonName(form.fullName, 'Nombre completo') ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      phone: validatePhone(form.phone) ?? undefined,
      address: validateAddress(form.address) ?? undefined,
    }
    if (nextErrors.email === undefined
      && !isUniqueInsensitive(form.email, mockUsers.map((entry) => entry.email), user.email)) {
      nextErrors.email = 'Ya existe un usuario con ese correo'
    }
    const cleaned = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value)),
    ) as typeof errors
    setErrors(cleaned)
    if (Object.keys(cleaned).length > 0) {
      notifyError('Revise su información', Object.values(cleaned)[0])
      return
    }
    const updated = updateUser(user.id, form)
    if (!updated) {
      notifyError('No se pudo guardar', 'Ese correo ya está en uso')
      return
    }
    appendAuditLog({
      action: 'profile.update',
      entity: 'user',
      entityId: user.id,
      actorId: user.id,
      actorRole: user.roles[0] ?? 'UNKNOWN',
      details: 'Actualizó datos propios de perfil',
      kind: 'change',
    })
    notifySuccess('Información actualizada')
    setSnapshot(form)
    setEditing(false)
  }

  const roleName = mockRoles.find((role) => role.id === user?.roles[0])?.name ?? user?.roles[0] ?? '—'

  return (
    <section className="admin-page">
      <div className="admin-profile">
        <header className="admin-profile__hero">
          <div className="admin-profile__hero-main">
            <div className="admin-profile__avatar" aria-hidden>
              {(form.fullName || 'U').trim().charAt(0).toUpperCase()}
            </div>
            <div className="admin-profile__intro">
              <h2 className="admin-profile__title">{form.fullName || 'Mi perfil'}</h2>
              <p className="admin-meta">{form.email}</p>
              <p className="admin-meta">Rol: {roleName}</p>
            </div>
            <div className="admin-profile__actions">
              {!editing ? (
                <button type="button" className="admin-btn" disabled={!canEdit} onClick={startEdit}>
                  Actualizar información
                </button>
              ) : (
                <>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelEdit}>
                    Cancelar
                  </button>
                  <button type="button" className="admin-btn" onClick={saveProfile}>
                    Confirmar actualización
                  </button>
                </>
              )}
            </div>
          </div>
          {editing ? (
            <p className="admin-profile__hero-hint" role="status" aria-live="polite">
              Los campos están habilitados. Revise la información y pulse{' '}
              <strong>Confirmar actualización</strong> para guardar.
            </p>
          ) : null}
        </header>

        <div className="admin-profile__grid">
          <article className="admin-profile__card">
            <h3>Datos personales</h3>
            <label className="admin-form__field">
              Nombre completo
              <input
                className={`admin-input ${errors.fullName ? 'admin-input--error' : ''}`}
                value={form.fullName}
                disabled={!editing}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              />
              {errors.fullName ? <span className="admin-form__error">{errors.fullName}</span> : null}
            </label>
            <label className="admin-form__field">
              Correo electrónico
              <input
                className={`admin-input ${errors.email ? 'admin-input--error' : ''}`}
                value={form.email}
                disabled={!editing}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
              {errors.email ? <span className="admin-form__error">{errors.email}</span> : null}
            </label>
          </article>

          <article className="admin-profile__card">
            <h3>Contacto</h3>
            <label className="admin-form__field">
              Teléfono
              <input
                className={`admin-input ${errors.phone ? 'admin-input--error' : ''}`}
                value={form.phone}
                disabled={!editing}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              {errors.phone ? <span className="admin-form__error">{errors.phone}</span> : null}
            </label>
            <label className="admin-form__field">
              Dirección
              <input
                className={`admin-input ${errors.address ? 'admin-input--error' : ''}`}
                value={form.address}
                disabled={!editing}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
              {errors.address ? <span className="admin-form__error">{errors.address}</span> : null}
            </label>
          </article>
        </div>
      </div>
    </section>
  )
}

export function SettingsPage() {
  return (
    <section className="admin-page">
      <div className="admin-card">
        <pre className="admin-pre">{JSON.stringify(mockSettings, null, 2)}</pre>
      </div>
    </section>
  )
}

export function ForbiddenPage() {
  return (
    <section className="admin-page">
      <div className="admin-card admin-empty">No tiene permisos para esta ruta.</div>
    </section>
  )
}

export function LoginPage() {
  const { login, isAuthenticated, staffHome } = useAuth()
  const [authError, setAuthError] = useState('')
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to={staffHome || '/'} replace />
  }

  return (
    <div className="login-page login-page--auth-modal">
      <AuthModal
        isOpen
        onClose={() => navigate('/')}
        authError={authError}
        onLogin={(form) => {
          setAuthError('')
          const result = login(form.email, form.password)
          if (!result.ok) {
            setAuthError(result.error || 'Credenciales inválidas')
            notifyError('No se pudo iniciar sesión', result.error)
            return
          }
          notifySuccess('Bienvenido')
          navigate(result.home || staffHome || '/')
        }}
      />
    </div>
  )
}

