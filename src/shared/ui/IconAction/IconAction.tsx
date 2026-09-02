import type { LucideIcon } from 'lucide-react'
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Eye,
  Pencil,
  Settings,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

type IconActionProps = {
  label: string
  onClick?: () => void
  disabled?: boolean
  title?: string
  variant?: 'view' | 'edit' | 'delete' | 'cancel' | 'toggle-on' | 'toggle-off' | 'settings' | 'move-up' | 'move-down'
}

const ICONS: Record<NonNullable<IconActionProps['variant']>, LucideIcon> = {
  view: Eye,
  edit: Pencil,
  delete: Trash2,
  cancel: Ban,
  'toggle-on': ToggleRight,
  'toggle-off': ToggleLeft,
  settings: Settings,
  'move-up': ArrowUp,
  'move-down': ArrowDown,
}

export function IconAction({
  label,
  onClick,
  disabled,
  title,
  variant = 'view',
}: IconActionProps) {
  const Icon = ICONS[variant]

  return (
    <button
      type="button"
      className={`admin-icon-btn admin-icon-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title ?? label}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
    </button>
  )
}
