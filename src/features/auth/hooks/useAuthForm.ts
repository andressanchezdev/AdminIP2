import { useCallback, useState } from 'react'
import { validateField, validateLogin } from '@/features/auth/utils/authValidation'

const LOGIN_INITIAL = {
  email: '',
  password: '',
  rememberMe: false,
}

export function useAuthForm() {
  const [form, setForm] = useState(LOGIN_INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const setField = useCallback((field: keyof typeof LOGIN_INITIAL, value: string | boolean) => {
    setTouched((current) => ({ ...current, [field]: true }))

    setForm((current) => {
      const nextForm = { ...current, [field]: value }
      if (field === 'email' || field === 'password') {
        setErrors((prev) => {
          const message = validateField(field, nextForm)
          const nextErrors = { ...prev }
          if (message) {
            nextErrors[field] = message
          } else {
            delete nextErrors[field]
          }
          return nextErrors
        })
      }
      return nextForm
    })
  }, [])

  const validateAll = useCallback(() => {
    const result = validateLogin(form)
    setErrors(result.errors)
    setTouched(
      Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<string, boolean>),
    )
    return result.isValid
  }, [form])

  const getError = useCallback(
    (field: string) => (touched[field] ? errors[field] : ''),
    [errors, touched],
  )

  return {
    form,
    setField,
    validateAll,
    getError,
    errors,
  }
}
