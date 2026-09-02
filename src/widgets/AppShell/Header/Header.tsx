import { namedControl } from '@/shared/lib/namedControl'
import type { ReactNode } from 'react'
import './Header.css'

type HeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  leading?: ReactNode
}

export function Header({ title, subtitle, actions, leading }: HeaderProps) {
  return (
    <header className="admin-header" {...namedControl('Encabezado')}>
      <div className="admin-header__start">
        {leading}
        <div className="admin-header__titles">
          <h1 className="admin-header__title">{title}</h1>
          {subtitle ? <p className="admin-header__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="admin-header__actions">{actions}</div> : null}
    </header>
  )
}
