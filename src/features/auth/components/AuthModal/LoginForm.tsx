import type { LoginAudience } from '@/app/providers/AuthProvider'
import { useAuthForm } from '@/features/auth/hooks/useAuthForm'
import { AuthField } from '@/features/auth/components/AuthModal/AuthField'
import { namedControl } from '@/shared/lib/namedControl'

type LoginFormValues = {
  email: string
  password: string
  rememberMe: boolean
}

type LoginFormProps = {
  onSubmit: (form: LoginFormValues) => void
  authError?: string
  audience?: LoginAudience
}

const AUDIENCE_COPY: Record<LoginAudience, { title: string; subtitle: string }> = {
  client: {
    title: 'Clientes premium',
    subtitle: 'Accede a tu cuenta de cliente Importadora Premium',
  },
  staff: {
    title: 'Administrativos premium',
    subtitle: 'Accede al panel administrativo de Importadora Premium',
  },
}

export function LoginForm({ onSubmit, authError, audience = 'staff' }: LoginFormProps) {
  const { form, setField, validateAll, getError } = useAuthForm()
  const copy = AUDIENCE_COPY[audience]

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateAll()) {
      return
    }
    onSubmit(form)
  }

  return (
    <form className="auth-form auth-form--login" onSubmit={handleSubmit} noValidate>
      <h2 id="auth-modal-title" className="auth-form__title">{copy.title}</h2>
      <p className="auth-form__subtitle">{copy.subtitle}</p>

      <AuthField
        id="auth-email"
        label="Correo"
        type="email"
        value={form.email}
        error={getError('email')}
        onChange={(value) => setField('email', value)}
      />
      <AuthField
        id="auth-password"
        label="Contraseña"
        type="password"
        value={form.password}
        error={getError('password')}
        onChange={(value) => setField('password', value)}
      />

      <label className="auth-form__remember">
        <input
          type="checkbox"
          checked={form.rememberMe}
          onChange={(event) => setField('rememberMe', event.target.checked)}
          {...namedControl('Recordarme')}
        />
        <span>Recordarme</span>
      </label>

      {authError ? (
        <div className="auth-field__error" role="alert">{authError}</div>
      ) : null}

      <div className="auth-form__actions">
        <button type="submit" className="auth-form__submit" {...namedControl('Ingresar')}>
          Ingresar
        </button>
      </div>
    </form>
  )
}
