import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  createLandingTeamMember,
  deleteLandingTeamMember,
  listLandingTeam,
  mockLandingTeam,
  reorderLandingTeamMembers,
  setLandingTeamStatus,
  updateLandingTeamMember,
  type LandingTeamGroup,
  type LandingTeamMember,
  type LandingTeamStatus,
} from '@/mocks/data'
import { ImageSourceField } from '@/features/blog/components/ImageSourceField'
import { confirmAction, notifyError, notifySuccess } from '@/shared/lib/notify'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'
import { TablePagination } from '@/shared/ui/TablePagination/TablePagination'
import { useTablePagination } from '@/shared/lib/useTablePagination'
import {
  validateLandingTeamForm,
  type LandingTeamFormInput,
} from './landingTeamValidation'
import './LandingTeamAdminPage.css'

type FormState = LandingTeamFormInput

const emptyForm: FormState = {
  imageUrl: '',
  fullName: '',
  role: '',
  phoneDisplay: '',
  group: '',
  status: 'borrador',
}

const STATUS_OPTIONS: Array<LandingTeamStatus | 'all'> = ['all', 'borrador', 'publicado', 'archivado']
const GROUP_OPTIONS: Array<LandingTeamGroup | 'all'> = ['all', 'asesor', 'administrativo']

const GROUP_LABEL: Record<LandingTeamGroup, string> = {
  asesor: 'Asesores',
  administrativo: 'Administrativos',
}

/** Administración tipo WordPress del equipo del carrusel landing. */
export function LandingTeamAdminPage({ onBack }: { onBack?: () => void }) {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('landing:create')
  const canUpdate = hasPermission('landing:update')
  const canDelete = hasPermission('landing:delete')
  const canPublish = hasPermission('landing:publish')

  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [statusFilter, setStatusFilter] = useState<LandingTeamStatus | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState<LandingTeamGroup | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LandingTeamMember | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const members = useMemo(
    () => listLandingTeam({ status: statusFilter, group: groupFilter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mock array mutates in place
    [statusFilter, groupFilter, mockLandingTeam.length, mockLandingTeam.map((m) => `${m.status}:${m.updatedAt}`).join()],
  )

  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSize,
  } = useTablePagination(members, { resetKey: `${statusFilter}|${groupFilter}` })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (member: LandingTeamMember) => {
    setEditing(member)
    setForm({
      imageUrl: member.imageUrl,
      fullName: member.fullName,
      role: member.role,
      phoneDisplay: member.phoneDisplay,
      group: member.group,
      status: member.status,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const errors = validateLandingTeamForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length) {
      notifyError('Revise el formulario', Object.values(errors)[0])
      return
    }

    if (editing) {
      if (!canUpdate) return
      const updated = updateLandingTeamMember(editing.id, {
        imageUrl: form.imageUrl,
        fullName: form.fullName,
        role: form.role,
        phoneDisplay: form.phoneDisplay,
        group: form.group as LandingTeamGroup,
        status: form.status,
      })
      if (!updated) {
        notifyError('No se pudo actualizar')
        return
      }
      appendAuditLog({
        action: 'landing.team.update',
        entity: 'landing_team',
        entityId: updated.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó colaborador ${updated.fullName}`,
        kind: 'change',
      })
      notifySuccess('Colaborador actualizado', updated.fullName)
    } else {
      if (!canCreate) return
      const result = createLandingTeamMember({
        imageUrl: form.imageUrl,
        fullName: form.fullName,
        role: form.role,
        phoneDisplay: form.phoneDisplay,
        group: form.group as LandingTeamGroup,
        status: form.status,
      })
      if (!result.ok) {
        notifyError('No se pudo crear', result.error)
        return
      }
      appendAuditLog({
        action: 'landing.team.create',
        entity: 'landing_team',
        entityId: result.member.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó colaborador ${result.member.fullName}`,
        kind: 'change',
      })
      notifySuccess('Colaborador creado', result.member.fullName)
    }

    setFormOpen(false)
    refresh()
  }

  const handleDelete = async (member: LandingTeamMember) => {
    if (!canDelete) return
    const confirmed = await confirmAction({
      title: '¿Eliminar colaborador?',
      text: `Se quitará a ${member.fullName} del carrusel.`,
      confirmText: 'Eliminar',
    })
    if (!confirmed) return
    if (!deleteLandingTeamMember(member.id)) {
      notifyError('No se pudo eliminar')
      return
    }
    appendAuditLog({
      action: 'landing.team.delete',
      entity: 'landing_team',
      entityId: member.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Eliminó colaborador ${member.fullName}`,
      kind: 'change',
    })
    notifySuccess('Colaborador eliminado', member.fullName)
    refresh()
  }

  const changeStatus = async (member: LandingTeamMember, status: LandingTeamStatus) => {
    if (!canPublish && !canUpdate) return
    const updated = setLandingTeamStatus(member.id, status)
    if (!updated) {
      notifyError('No se pudo cambiar el estado')
      return
    }
    appendAuditLog({
      action: 'landing.team.status',
      entity: 'landing_team',
      entityId: member.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Cambió estado de ${member.fullName} a ${status}`,
      kind: 'change',
    })
    notifySuccess(status === 'publicado' ? 'Publicado en el carrusel' : 'Estado actualizado', member.fullName)
    refresh()
  }

  /** Misma lógica que `movePost` en Gestión Blog → `reorderBlogPosts`. */
  const moveMember = (memberId: string, direction: -1 | 1) => {
    if (!canUpdate) return
    const ordered = listLandingTeam({ status: statusFilter, group: groupFilter })
    const index = ordered.findIndex((member) => member.id === memberId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    const next = [...ordered]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    reorderLandingTeamMembers(next.map((member) => member.id))
    appendAuditLog({
      action: 'landing.team.reorder',
      entity: 'landing_team',
      entityId: memberId,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: 'Reordenó jerarquía del equipo landing',
      kind: 'change',
    })
    refresh()
  }

  const renderStatusSelect = (member: LandingTeamMember) => (
    <select
      className="admin-input"
      aria-label={`Estado de ${member.fullName}`}
      value={member.status}
      disabled={!canPublish && !canUpdate}
      onChange={(event) => void changeStatus(member, event.target.value as LandingTeamStatus)}
    >
      <option value="borrador">borrador</option>
      <option value="publicado">publicado</option>
      <option value="archivado">archivado</option>
    </select>
  )

  return (
    <div className="admin-page">
      {onBack ? (
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onBack}>
          Volver a secciones
        </button>
      ) : null}
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <select
            className="admin-input"
            aria-label="Filtrar por grupo"
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value as LandingTeamGroup | 'all')}
          >
            {GROUP_OPTIONS.map((group) => (
              <option key={group} value={group}>
                {group === 'all' ? 'Todos los grupos' : GROUP_LABEL[group]}
              </option>
            ))}
          </select>
          <select
            className="admin-input"
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as LandingTeamStatus | 'all')}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'Todos los estados' : status}
              </option>
            ))}
          </select>
        </div>
        {canCreate ? (
          <div className="admin-toolbar__create">
            <button type="button" className="admin-btn" onClick={openCreate}>
              Añadir nuevo
            </button>
          </div>
        ) : null}
      </div>

      <ResponsiveTableShell
        empty={members.length === 0}
        emptyMessage="No hay colaboradores para mostrar"
        cards={pageItems.map((member) => (
          <AdminRowCard
            key={member.id}
            title={member.fullName}
            fields={[
              { label: 'Cargo', value: member.role, primary: true },
              { label: 'Grupo', value: GROUP_LABEL[member.group], primary: true },
              { label: 'Estado', value: renderStatusSelect(member), primary: true },
              { label: 'Teléfono', value: member.phoneDisplay },
            ]}
            actions={(
              <>
                {canUpdate ? (
                  <>
                    <IconAction
                      label="Subir"
                      variant="move-up"
                      title="Subir en jerarquía"
                      onClick={() => moveMember(member.id, -1)}
                    />
                    <IconAction
                      label="Bajar"
                      variant="move-down"
                      title="Bajar en jerarquía"
                      onClick={() => moveMember(member.id, 1)}
                    />
                    <IconAction label="Editar" variant="edit" onClick={() => openEdit(member)} />
                  </>
                ) : null}
                {canDelete ? (
                  <IconAction label="Eliminar" variant="delete" onClick={() => void handleDelete(member)} />
                ) : null}
              </>
            )}
          />
        ))}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((member) => (
              <tr key={member.id}>
                <td data-priority="1">
                  <img
                    className="landing-team-admin__thumb"
                    src={member.imageUrl}
                    alt=""
                    width={40}
                    height={40}
                  />
                </td>
                <td data-priority="1">{member.fullName}</td>
                <td data-priority="2">{member.role}</td>
                <td data-priority="2">{GROUP_LABEL[member.group]}</td>
                <td data-priority="1">{renderStatusSelect(member)}</td>
                <td data-priority="1">
                  <div className="admin-table__actions">
                    {canUpdate ? (
                      <>
                        <IconAction
                          label="Subir"
                          variant="move-up"
                          title="Subir en jerarquía"
                          onClick={() => moveMember(member.id, -1)}
                        />
                        <IconAction
                          label="Bajar"
                          variant="move-down"
                          title="Bajar en jerarquía"
                          onClick={() => moveMember(member.id, 1)}
                        />
                        <IconAction label="Editar" variant="edit" onClick={() => openEdit(member)} />
                      </>
                    ) : null}
                    {canDelete ? (
                      <IconAction label="Eliminar" variant="delete" onClick={() => void handleDelete(member)} />
                    ) : null}
                  </div>
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
        isOpen={formOpen}
        title={editing ? 'Editar colaborador' : 'Añadir nuevo colaborador'}
        onClose={() => setFormOpen(false)}
        size="md"
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="landing-team-form" className="admin-btn">
              {editing ? 'Actualizar' : 'Publicar en lista'}
            </button>
          </>
        )}
      >
        <form id="landing-team-form" className="landing-team-admin__form" onSubmit={handleSubmit}>
          <section className="landing-team-admin__step">
            <h3 className="landing-team-admin__step-title">1. Imagen</h3>
            <p className="landing-team-admin__step-hint">Suba la silueta o foto que se verá en el carrusel.</p>
            <ImageSourceField
              value={form.imageUrl}
              onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))}
              placeholder="URL o suba un archivo"
            />
            {formErrors.imageUrl ? <p className="admin-form__error">{formErrors.imageUrl}</p> : null}
          </section>

          <section className="landing-team-admin__step">
            <h3 className="landing-team-admin__step-title">2. Datos</h3>
            <label className="admin-form__field">
              Nombre completo
              <input
                className="admin-input"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Nombre y apellido"
              />
              {formErrors.fullName ? <span className="admin-form__error">{formErrors.fullName}</span> : null}
            </label>
            <label className="admin-form__field">
              Cargo
              <input
                className="admin-input"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                placeholder="Ej. Asesor comercial"
              />
              {formErrors.role ? <span className="admin-form__error">{formErrors.role}</span> : null}
            </label>
            <label className="admin-form__field">
              Teléfono
              <input
                className="admin-input"
                value={form.phoneDisplay}
                onChange={(event) => setForm((current) => ({ ...current, phoneDisplay: event.target.value }))}
                placeholder="+57 300 000 0000"
              />
              {formErrors.phoneDisplay ? <span className="admin-form__error">{formErrors.phoneDisplay}</span> : null}
            </label>
          </section>

          <section className="landing-team-admin__step">
            <h3 className="landing-team-admin__step-title">3. Grupo</h3>
            <p className="landing-team-admin__step-hint">Defina en qué pestaña del carrusel aparecerá.</p>
            <div className="landing-team-admin__group-picks" role="radiogroup" aria-label="Grupo del colaborador">
              {(['asesor', 'administrativo'] as const).map((group) => (
                <button
                  key={group}
                  type="button"
                  role="radio"
                  aria-checked={form.group === group}
                  className={`landing-team-admin__group-pick${form.group === group ? ' is-active' : ''}`}
                  onClick={() => setForm((current) => ({ ...current, group }))}
                >
                  {GROUP_LABEL[group]}
                </button>
              ))}
            </div>
            {formErrors.group ? <p className="admin-form__error">{formErrors.group}</p> : null}

            <label className="admin-form__field">
              Estado
              <select
                className="admin-input"
                value={form.status}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  status: event.target.value as LandingTeamStatus,
                }))}
              >
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
                <option value="archivado">Archivado</option>
              </select>
            </label>
          </section>
        </form>
      </Modal>
    </div>
  )
}
