import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  createVacancy,
  deleteVacancy,
  listVacancies,
  mockVacancies,
  setVacancyStatus,
  updateVacancy,
  type VacancyRecord,
  type VacancyStatus,
} from '@/mocks/data'
import { confirmAction, notifyError, notifySuccess } from '@/shared/lib/notify'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'

type VacancyFormState = {
  title: string
  location: string
  employmentType: string
  summary: string
  description: string
  requirements: string
  status: VacancyStatus
}

const emptyForm: VacancyFormState = {
  title: '',
  location: 'Medellín, Colombia',
  employmentType: 'Tiempo completo',
  summary: '',
  description: '',
  requirements: '',
  status: 'borrador',
}

const STATUS_OPTIONS: Array<VacancyStatus | 'all'> = ['all', 'borrador', 'publicado', 'cerrado', 'archivado']

export function VacanciesAdminPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('vacancies:create')
  const canUpdate = hasPermission('vacancies:update')
  const canDelete = hasPermission('vacancies:delete')
  const canPublish = hasPermission('vacancies:publish')

  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [statusFilter, setStatusFilter] = useState<VacancyStatus | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<VacancyRecord | null>(null)
  const [form, setForm] = useState<VacancyFormState>(emptyForm)

  const vacancies = useMemo(
    () => listVacancies(statusFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mock array mutates in place
    [statusFilter, mockVacancies.length, mockVacancies.map((v) => `${v.status}:${v.updatedAt}`).join()],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (vacancy: VacancyRecord) => {
    setEditing(vacancy)
    setForm({
      title: vacancy.title,
      location: vacancy.location,
      employmentType: vacancy.employmentType,
      summary: vacancy.summary,
      description: vacancy.description,
      requirements: vacancy.requirements,
      status: vacancy.status,
    })
    setFormOpen(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (form.title.trim().length < 3) {
      notifyError('Revise el formulario', 'Indique un título válido')
      return
    }

    if (editing) {
      if (!canUpdate) return
      const updated = updateVacancy(editing.id, form)
      if (!updated) {
        notifyError('No se pudo actualizar')
        return
      }
      appendAuditLog({
        action: 'vacancy.update',
        entity: 'vacancy',
        entityId: updated.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó vacante ${updated.title}`,
        kind: 'change',
      })
      notifySuccess('Vacante actualizada', updated.title)
    } else {
      if (!canCreate) return
      const result = createVacancy(form)
      if (!result.ok) {
        notifyError('No se pudo crear', result.error)
        return
      }
      appendAuditLog({
        action: 'vacancy.create',
        entity: 'vacancy',
        entityId: result.vacancy.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó vacante ${result.vacancy.title}`,
        kind: 'change',
      })
      notifySuccess('Vacante creada', result.vacancy.title)
    }

    setFormOpen(false)
    refresh()
  }

  const changeStatus = async (vacancy: VacancyRecord, status: VacancyStatus) => {
    if (!canPublish && !canUpdate) return
    const updated = setVacancyStatus(vacancy.id, status)
    if (!updated) return
    appendAuditLog({
      action: 'vacancy.status',
      entity: 'vacancy',
      entityId: updated.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Estado ${vacancy.status} → ${status} (${updated.title})`,
      kind: 'change',
    })
    notifySuccess('Estado actualizado', status)
    refresh()
  }

  const handleDelete = async (vacancy: VacancyRecord) => {
    if (!canDelete) return
    const confirmed = await confirmAction({
      title: '¿Eliminar vacante?',
      text: `Se eliminará “${vacancy.title}”.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    })
    if (!confirmed) return
    deleteVacancy(vacancy.id)
    appendAuditLog({
      action: 'vacancy.delete',
      entity: 'vacancy',
      entityId: vacancy.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Eliminó vacante ${vacancy.title}`,
      kind: 'change',
    })
    notifySuccess('Vacante eliminada')
    refresh()
  }

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <select
            className="admin-input"
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as VacancyStatus | 'all')}
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
              Nueva vacante
            </button>
          </div>
        ) : null}
      </div>

      <ResponsiveTableShell
        empty={vacancies.length === 0}
        emptyMessage="No hay vacantes para mostrar"
        cards={vacancies.map((vacancy) => (
          <AdminRowCard
            key={vacancy.id}
            title={vacancy.title}
            fields={[
              { label: 'Ubicación', value: vacancy.location, primary: true },
              { label: 'Tipo', value: vacancy.employmentType, primary: true },
              { label: 'Estado', value: vacancy.status, primary: true },
              { label: 'Resumen', value: vacancy.summary },
            ]}
            actions={(
              <>
                {canUpdate ? (
                  <IconAction label="Editar" variant="edit" onClick={() => openEdit(vacancy)} />
                ) : null}
                {canPublish || canUpdate ? (
                  <IconAction
                    label={vacancy.status === 'publicado' ? 'Cerrar' : 'Publicar'}
                    variant={vacancy.status === 'publicado' ? 'toggle-off' : 'toggle-on'}
                    onClick={() => void changeStatus(
                      vacancy,
                      vacancy.status === 'publicado' ? 'cerrado' : 'publicado',
                    )}
                  />
                ) : null}
                {canDelete ? (
                  <IconAction label="Eliminar" variant="delete" onClick={() => void handleDelete(vacancy)} />
                ) : null}
              </>
            )}
          />
        ))}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Ubicación</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vacancies.map((vacancy) => (
              <tr key={vacancy.id}>
                <td>{vacancy.title}</td>
                <td>{vacancy.location}</td>
                <td>{vacancy.employmentType}</td>
                <td>{vacancy.status}</td>
                <td>
                  <div className="admin-table__actions">
                    {canUpdate ? (
                      <IconAction label="Editar" variant="edit" onClick={() => openEdit(vacancy)} />
                    ) : null}
                    {canPublish || canUpdate ? (
                      <IconAction
                        label={vacancy.status === 'publicado' ? 'Cerrar' : 'Publicar'}
                        variant={vacancy.status === 'publicado' ? 'toggle-off' : 'toggle-on'}
                        onClick={() => void changeStatus(
                          vacancy,
                          vacancy.status === 'publicado' ? 'cerrado' : 'publicado',
                        )}
                      />
                    ) : null}
                    {canDelete ? (
                      <IconAction label="Eliminar" variant="delete" onClick={() => void handleDelete(vacancy)} />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableShell>

      <Modal
        isOpen={formOpen}
        title={editing ? 'Editar vacante' : 'Nueva vacante'}
        onClose={() => setFormOpen(false)}
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-form__field">
            Título
            <input
              className="admin-input"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="admin-form__field">
            Ubicación
            <input
              className="admin-input"
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            />
          </label>
          <label className="admin-form__field">
            Tipo de contrato
            <input
              className="admin-input"
              value={form.employmentType}
              onChange={(event) => setForm((current) => ({ ...current, employmentType: event.target.value }))}
            />
          </label>
          <label className="admin-form__field">
            Resumen
            <textarea
              className="admin-input admin-textarea"
              rows={2}
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            />
          </label>
          <label className="admin-form__field">
            Descripción
            <textarea
              className="admin-input admin-textarea"
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <label className="admin-form__field">
            Requisitos
            <textarea
              className="admin-input admin-textarea"
              rows={3}
              value={form.requirements}
              onChange={(event) => setForm((current) => ({ ...current, requirements: event.target.value }))}
            />
          </label>
          <label className="admin-form__field"> 
            <select
              className="admin-input"
              value={form.status}
              onChange={(event) => setForm((current) => ({
                ...current,
                status: event.target.value as VacancyStatus,
              }))}
            >
              <option value="borrador">borrador</option>
              <option value="publicado">publicado</option>
              <option value="cerrado">cerrado</option>
              <option value="archivado">archivado</option>
            </select>
          </label>
          <div className="admin-form__actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn">
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
