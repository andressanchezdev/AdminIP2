import type { LandingTeamGroup, LandingTeamStatus } from '@/mocks/data'

export type LandingTeamFormInput = {
  imageUrl: string
  fullName: string
  role: string
  phoneDisplay: string
  group: LandingTeamGroup | ''
  status: LandingTeamStatus
}

export function validateLandingTeamForm(form: LandingTeamFormInput) {
  const errors: Partial<Record<keyof LandingTeamFormInput, string>> = {}
  if (!form.imageUrl.trim()) errors.imageUrl = 'Suba la imagen del colaborador'
  if (form.fullName.trim().length < 2) errors.fullName = 'Indique nombre y apellido'
  if (form.role.trim().length < 2) errors.role = 'Indique el cargo'
  if (form.phoneDisplay.trim().replace(/\D/g, '').length < 7) {
    errors.phoneDisplay = 'Indique un teléfono válido'
  }
  if (form.group !== 'asesor' && form.group !== 'administrativo') {
    errors.group = 'Seleccione el grupo (Asesores o Administrativos)'
  }
  return errors
}
