import type { VacancyStatus } from '@/mocks/data'

export const VACANCY_EMPLOYMENT_TYPES = [
  'Tiempo completo',
  'Medio tiempo',
  'Por contrato',
  'Prácticas',
  'Remoto',
] as const

export type VacancyFormInput = {
  title: string
  location: string
  employmentType: string
  summary: string
  description: string
  requirements: string
  status: VacancyStatus
}

export type VacancyFormErrors = Partial<Record<keyof VacancyFormInput, string>>

const TITLE_MIN = 3
const TEXT_MIN = 10
const SUMMARY_MAX = 180
const TEXT_MAX = 2000

function minText(value: string, min: number, label: string) {
  const text = value.trim()
  if (!text) return `${label} es obligatorio`
  if (text.length < min) return `${label}: mínimo ${min} caracteres`
  return null
}

export function validateVacancyForm(input: VacancyFormInput) {
  const errors: VacancyFormErrors = {}
  const isPublished = input.status === 'publicado'

  const titleError = minText(input.title, TITLE_MIN, 'Título')
  if (titleError) errors.title = titleError
  else if (input.title.trim().length > 80) errors.title = 'Título: máximo 80 caracteres'

  const locationError = minText(input.location, 3, 'Ubicación')
  if (locationError) errors.location = locationError
  else if (input.location.trim().length > 80) errors.location = 'Ubicación: máximo 80 caracteres'

  if (!input.employmentType.trim()) {
    errors.employmentType = 'Seleccione el tipo de contrato'
  }

  if (isPublished) {
    const summaryError = minText(input.summary, TEXT_MIN, 'Resumen')
    if (summaryError) errors.summary = summaryError
    else if (input.summary.trim().length > SUMMARY_MAX) {
      errors.summary = `Resumen: máximo ${SUMMARY_MAX} caracteres`
    }

    const descriptionError = minText(input.description, TEXT_MIN, 'Descripción')
    if (descriptionError) errors.description = descriptionError
    else if (input.description.trim().length > TEXT_MAX) {
      errors.description = `Descripción: máximo ${TEXT_MAX} caracteres`
    }

    const requirementsError = minText(input.requirements, TEXT_MIN, 'Requisitos')
    if (requirementsError) errors.requirements = requirementsError
    else if (input.requirements.trim().length > TEXT_MAX) {
      errors.requirements = `Requisitos: máximo ${TEXT_MAX} caracteres`
    }
  } else {
    if (input.summary.trim().length > SUMMARY_MAX) {
      errors.summary = `Resumen: máximo ${SUMMARY_MAX} caracteres`
    }
    if (input.description.trim().length > TEXT_MAX) {
      errors.description = `Descripción: máximo ${TEXT_MAX} caracteres`
    }
    if (input.requirements.trim().length > TEXT_MAX) {
      errors.requirements = `Requisitos: máximo ${TEXT_MAX} caracteres`
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: Object.values(errors)[0] ?? null,
  }
}
