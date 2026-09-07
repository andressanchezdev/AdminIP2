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
import { TablePagination } from '@/shared/ui/TablePagination/TablePagination'
import { useTablePagination } from '@/shared/lib/useTablePagination'
import {
  VACANCY_EMPLOYMENT_TYPES,
  validateVacancyForm,
  type VacancyFormInput,
} from './vacancyValidation'

type VacancyFormState = VacancyFormInput

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
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VacancyFormState, string>>>({})

  const vacancies = useMemo(
    () => listVacancies(statusFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mock array mutates in place
    [statusFilter, mockVacancies.length, mockVacancies.map((v) => `${v.status}:${v.updatedAt}`).join()],
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
  } = useTablePagination(vacancies, { resetKey: statusFilter })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (vacancy: VacancyRecord, errors: Partial<Record<keyof VacancyFormState, string>> = {}) => {
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
    setFormErrors(errors)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setFormErrors({})
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const validation = validateVacancyForm(form)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      notifyError('Revise el formulario', validation.firstError ?? 'Complete los campos obligatorios')
      return
    }
    setFormErrors({})

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
    setFormErrors({})
    refresh()
  }

  const changeStatus = async (vacancy: VacancyRecord, status: VacancyStatus) => {
    if (!canPublish && !canUpdate) return

    if (status === 'publicado') {
      const validation = validateVacancyForm({
        title: vacancy.title,
        location: vacancy.location,
        employmentType: vacancy.employmentType,
        summary: vacancy.summary,
        description: vacancy.description,
        requirements: vacancy.requirements,
        status,
      })
      if (!validation.isValid) {
        notifyError(
          'No se puede publicar',
          validation.firstError ?? 'Complete todos los campos antes de publicar',
        )
        openEdit(vacancy, validation.errors)
        return
      }
    }

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

  const renderStatusSelect = (vacancy: VacancyRecord) => (
    <select
      className="admin-input"
      aria-label={`Estado de ${vacancy.title}`}
      value={vacancy.status}
      disabled={!canPublish && !canUpdate}
      onChange={(event) => void changeStatus(vacancy, event.target.value as VacancyStatus)}
    >
      <option value="borrador">borrador</option>
      <option value="publicado">publicado</option>
      <option value="cerrado">cerrado</option>
      <option value="archivado">archivado</option>
    </select>
  )

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
        cards={pageItems.map((vacancy) => (
          <AdminRowCard
            key={vacancy.id}
            title={vacancy.title}
            fields={[
              { label: 'Ubicación', value: vacancy.location, primary: true },
              { label: 'Tipo', value: vacancy.employmentType, primary: true },
              { label: 'Estado', value: renderStatusSelect(vacancy), primary: true },
              { label: 'Resumen', value: vacancy.summary },
            ]}
            actions={(
              <>
                {canUpdate ? (
                  <IconAction label="Editar" variant="edit" onClick={() => openEdit(vacancy)} />
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
            {pageItems.map((vacancy) => (
              <tr key={vacancy.id}>
                <td>{vacancy.title}</td>
                <td>{vacancy.location}</td>
                <td>{vacancy.employmentType}</td>
                <td>{renderStatusSelect(vacancy)}</td>
                <td>
                  <div className="admin-table__actions">
                    {canUpdate ? (
                      <IconAction label="Editar" variant="edit" onClick={() => openEdit(vacancy)} />
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
        title={editing ? 'Editar vacante' : 'Nueva vacante'}
        onClose={closeForm}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>
              Cancelar
            </button>
            <button type="submit" form="vacancy-form" className="admin-btn">
              Guardar
            </button>
          </>
        )}
      >
        <form id="vacancy-form" className="admin-form" onSubmit={handleSubmit} noValidate>
          <p className="admin-form__hint">
            Complete todos los campos que se muestran en la vista pública de vacantes.
          </p>

          <label className="admin-form__field">
            Título
            <input
              className="admin-input"
              value={form.title}
              maxLength={80}
              placeholder="Ej. Asesor comercial"
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <span className="admin-form__hint">Se muestra como título principal en el listado.</span>
            {formErrors.title ? <span className="admin-form__error">{formErrors.title}</span> : null}
          </label>

          <label className="admin-form__field">
            Resumen
            <textarea
              className="admin-input admin-textarea"
              rows={2}
              maxLength={180}
              placeholder="Breve descripción visible en el listado"
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            />
            <span className="admin-form__hint">Texto corto bajo el título en la vista pública.</span>
            {formErrors.summary ? <span className="admin-form__error">{formErrors.summary}</span> : null}
          </label>

          <label className="admin-form__field">
            Ubicación
            <input
              className="admin-input"
              value={form.location}
              maxLength={80}
              placeholder="Ej. Medellín, Colombia"
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            />
            <span className="admin-form__hint">Aparece con el icono de ubicación en cada vacante.</span>
            {formErrors.location ? <span className="admin-form__error">{formErrors.location}</span> : null}
          </label>

          <label className="admin-form__field">
            Tipo de contrato
            <select
              className="admin-input"
              value={form.employmentType}
              onChange={(event) => setForm((current) => ({ ...current, employmentType: event.target.value }))}
            >
              {!(VACANCY_EMPLOYMENT_TYPES as readonly string[]).includes(form.employmentType) ? (
                <option value={form.employmentType}>{form.employmentType}</option>
              ) : null}
              {VACANCY_EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <span className="admin-form__hint">Aparece con el icono de maletín en cada vacante.</span>
            {formErrors.employmentType ? <span className="admin-form__error">{formErrors.employmentType}</span> : null}
          </label>

          <label className="admin-form__field">
            Descripción
            <textarea
              className="admin-input admin-textarea"
              rows={4}
              maxLength={2000}
              placeholder="Detalle de funciones y responsabilidades del cargo"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <span className="admin-form__hint">Se muestra al expandir el detalle de la vacante.</span>
            {formErrors.description ? <span className="admin-form__error">{formErrors.description}</span> : null}
          </label>

          <label className="admin-form__field">
            Requisitos
            <textarea
              className="admin-input admin-textarea"
              rows={3}
              maxLength={2000}
              placeholder="Experiencia, habilidades y requisitos del perfil"
              value={form.requirements}
              onChange={(event) => setForm((current) => ({ ...current, requirements: event.target.value }))}
            />
            <span className="admin-form__hint">Se muestra en la sección de requisitos al ver el detalle.</span>
            {formErrors.requirements ? <span className="admin-form__error">{formErrors.requirements}</span> : null}
          </label>

          <label className="admin-form__field">
            Estado
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
            <span className="admin-form__hint">Solo las vacantes en estado publicado se muestran en /explorar/vacantes.</span>
            {formErrors.status ? <span className="admin-form__error">{formErrors.status}</span> : null}
          </label>
        </form>
      </Modal>
    </div>
  )
}
