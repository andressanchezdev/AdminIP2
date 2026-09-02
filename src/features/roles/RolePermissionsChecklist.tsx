import { useState } from 'react'
import type { PermissionCatalogEntry } from '@/mocks/data'
import { usePermissionGroups } from '@/shared/lib/groupPermissions'

type RolePermissionsChecklistProps = {
  catalog: PermissionCatalogEntry[]
  selected: string[]
  onToggle: (code: string) => void
  disabled?: boolean
  error?: string
}

/** Checklist de permisos con filtro rápido por gestión. */
export function RolePermissionsChecklist({
  catalog,
  selected,
  onToggle,
  disabled = false,
  error,
}: RolePermissionsChecklistProps) {
  const groups = usePermissionGroups(catalog)
  const [managementFilter, setManagementFilter] = useState('all')

  const visibleGroups = managementFilter === 'all'
    ? groups
    : groups.filter((group) => group.key === managementFilter)

  const toggleGroupAll = (codes: string[], checked: boolean) => {
    codes.forEach((code) => {
      const isSelected = selected.includes(code)
      if (checked && !isSelected) onToggle(code)
      if (!checked && isSelected) onToggle(code)
    })
  }

  return (
    <fieldset className="admin-form__fieldset">
      <legend>Permisos</legend>

      <div className="admin-permission-filters" role="tablist" aria-label="Filtrar permisos por gestión">
        <button
          type="button"
          className={`admin-permission-filter ${managementFilter === 'all' ? 'admin-permission-filter--active' : ''}`}
          onClick={() => setManagementFilter('all')}
        >
          Todas las gestiones
        </button>
        {groups.map((group) => (
          <button
            key={group.key}
            type="button"
            className={`admin-permission-filter ${managementFilter === group.key ? 'admin-permission-filter--active' : ''}`}
            onClick={() => setManagementFilter(group.key)}
          >
            {group.label}
          </button>
        ))}
      </div>

      <div className="admin-permission-groups">
        {visibleGroups.map((group) => {
          const codes = group.permissions.map((permission) => permission.code)
          const allSelected = codes.every((code) => selected.includes(code))
          return (
            <section key={group.key} className="admin-permission-group">
              <div className="admin-permission-group__head">
                <h3 className="admin-permission-group__title">{group.label}</h3>
                <label className="admin-check admin-check--inline">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={disabled}
                    onChange={(event) => toggleGroupAll(codes, event.target.checked)}
                  />
                  <span>Seleccionar gestión</span>
                </label>
              </div>
              <div className="admin-permission-grid">
                {group.permissions.map((permission) => (
                  <label key={permission.code} className="admin-check">
                    <input
                      type="checkbox"
                      checked={selected.includes(permission.code)}
                      disabled={disabled}
                      onChange={() => onToggle(permission.code)}
                    />
                    <span>
                      <strong>{permission.label}</strong>
                      <small>{permission.code}</small>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )
        })}
      </div>
      {error ? <span className="admin-form__error">{error}</span> : null}
    </fieldset>
  )
}
