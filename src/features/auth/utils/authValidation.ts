import { INPUT_CHAR_MAX, validateEmail } from '@/shared/lib/validation'

/**
 * Validación de login (entrada al sistema).
 * No aplica la política de complejidad de creación de usuarios:
 * la contraseña se verifica contra el almacén (mock/API).
 */
export function validateLogin({ email, password }: { email: string; password: string }) {
  const errors: Record<string, string> = {}

  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError

  if (!password.trim()) {
    errors.password = 'La contraseña es obligatoria'
  } else if (password.length > INPUT_CHAR_MAX) {
    errors.password = `Máximo ${INPUT_CHAR_MAX} caracteres`
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

export function validateField(field: string, form: { email: string; password: string }) {
  return validateLogin(form).errors[field] ?? ''
}
