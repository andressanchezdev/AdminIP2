import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { getPasswordChecks, validatePassword } from '@/shared/lib/validation'

type PasswordFieldProps = {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  required?: boolean
  showRequirements?: boolean
  placeholder?: string
  autoComplete?: string
}

export function PasswordField({
  id = 'password-field',
  label,
  value,
  onChange,
  error,
  hint,
  required = true,
  showRequirements = true,
  placeholder,
  autoComplete = 'new-password',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const checks = getPasswordChecks(value)
  const liveError = error ?? (value ? validatePassword(value, { required }) : null)

  return (
    <label className="admin-form__field" htmlFor={id}>
      {label}
      <div className="admin-password">
        <input
          id={id}
          className={`admin-input ${liveError ? 'admin-input--error' : ''}`}
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="admin-password__toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        >
          {visible ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
        </button>
      </div>
      {hint ? <span className="admin-form__hint">{hint}</span> : null}
      {showRequirements ? (
        <ul className="admin-password__rules" aria-label="Requisitos de contraseña">
          <li className={checks.minLength ? 'is-ok' : ''}>Mínimo 8 caracteres</li>
          <li className={checks.upper ? 'is-ok' : ''}>Una mayúscula</li>
          <li className={checks.lower ? 'is-ok' : ''}>Una minúscula</li>
          <li className={checks.number ? 'is-ok' : ''}>Un número</li>
          <li className={checks.special ? 'is-ok' : ''}>Un carácter especial</li>
        </ul>
      ) : null}
      {liveError ? <span className="admin-form__error">{liveError}</span> : null}
    </label>
  )
}
