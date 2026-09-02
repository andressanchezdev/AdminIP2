import { INPUT_CHAR_MAX } from '@/shared/lib/validation'
import { useState } from 'react'
import eyeIcon from '@/assets/icons/eye.svg'
import eyeOffIcon from '@/assets/icons/eye-off.svg'
import { namedControl, namedImage } from '@/shared/lib/namedControl'

type AuthFieldProps = {
  id: string
  label: string
  type?: string
  value: string
  error?: string
  onChange: (value: string) => void
}

export function AuthField({ id, label, type = 'text', value, error, onChange }: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <label className="auth-field" htmlFor={id}>
      <span className="auth-field__label">{label}</span>
      <div className="auth-field__control">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`auth-field__input ${isPassword ? 'auth-field__input--password' : ''} ${error ? 'auth-field__input--error' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={isPassword ? 'current-password' : 'email'}
          maxLength={INPUT_CHAR_MAX}
          {...namedControl(label)}
        />
        {isPassword ? (
          <button
            type="button"
            className="auth-field__toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-pressed={showPassword}
            {...namedControl(showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña')}
          >
            <img
              src={showPassword ? eyeOffIcon : eyeIcon}
              className="auth-field__toggle-icon"
              {...namedImage(showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña')}
            />
          </button>
        ) : null}
      </div>
      {error ? (
        <span id={`${id}-error`} className="auth-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}
