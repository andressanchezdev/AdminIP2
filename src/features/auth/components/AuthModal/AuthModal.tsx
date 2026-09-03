import brandImage from '@/assets/images/login-brand.png'
import type { LoginAudience } from '@/app/providers/AuthProvider'
import { OverlayModal } from '@/shared/ui/OverlayModal/OverlayModal'
import { LoginForm } from '@/features/auth/components/AuthModal/LoginForm'
import { namedControl } from '@/shared/lib/namedControl'
import './AuthModalBase.css'
import './AuthModalResponsive.css'

type LoginFormValues = {
  email: string
  password: string
  rememberMe: boolean
}

type AuthModalProps = {
  isOpen: boolean
  onClose?: () => void
  onLogin: (form: LoginFormValues) => void
  authError?: string
  audience?: LoginAudience
}

export function AuthModal({
  isOpen,
  onClose,
  onLogin,
  authError,
  audience = 'staff',
}: AuthModalProps) {
  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="auth-modal-title"
      className="auth-modal"
      backdropClassName="auth-modal-backdrop"
    >
      <button
        type="button"
        className="auth-modal__close"
        onClick={onClose}
        {...namedControl('Cerrar')}
      >
        ×
      </button>

      <div className="auth-modal__split">
        <div
          className="auth-modal__brand"
          style={{ backgroundImage: `url(${brandImage})` }}
          role="img"
          {...namedControl('Importadora Premium Online')}
        />

        <div className="auth-modal__form-col">
          <LoginForm onSubmit={onLogin} authError={authError} audience={audience} />
        </div>
      </div>
    </OverlayModal>
  )
}
