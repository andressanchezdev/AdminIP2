/**
 * Smoke checks for AdminIP RBAC (no browser).
 * Run: node --experimental-strip-types scripts/smoke-rbac.mjs
 * Or via vite-node / tsx. Plain JS version below.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = (name) => JSON.parse(readFileSync(join(root, 'jsonMocks', name), 'utf8'))

const users = load('users.json')
const roles = load('roles.json')
const menu = load('menuConfig.json')

function derive(roleIds) {
  const set = new Set()
  roleIds.forEach((id) => {
    const role = roles.find((r) => r.id === id)
    ;(role?.permissions ?? []).forEach((p) => set.add(p))
  })
  return set
}

function can(perms, required) {
  const list = Array.isArray(required) ? required : [required]
  return list.every((code) => perms.has(code))
}

function filterMenu(items, roleIds, perms) {
  return items
    .map((item) => {
      const roleOk = !item.rolesAllowed?.length || item.rolesAllowed.some((r) => roleIds.includes(r))
      if (!roleOk) return null
      const children = item.children ? filterMenu(item.children, roleIds, perms) : undefined
      const permOk = !item.permissionsAllowed?.length || can(perms, item.permissionsAllowed)
      if (item.children) {
        if (!children?.length) return null
        return { ...item, children }
      }
      return permOk ? item : null
    })
    .filter(Boolean)
}

const admin = users.find((u) => u.id === 'user_1')
const viewer = users.find((u) => u.id === 'user_4')
const adminPerms = derive(admin.roles)
const viewerPerms = derive(viewer.roles)

const adminMenu = filterMenu(menu, admin.roles, adminPerms)
const viewerMenu = filterMenu(menu, viewer.roles, viewerPerms)

const checks = [
  ['admin password', admin.password === 'admin123'],
  ['viewer password', viewer.password === 'viewer123'],
  ['admin has orders:read', adminPerms.has('orders:read')],
  ['viewer lacks orders:read', !viewerPerms.has('orders:read')],
  ['viewer has metrics:view', viewerPerms.has('metrics:view')],
  ['admin menu includes Operación', adminMenu.some((i) => i.id === 'menu_operation')],
  ['viewer menu excludes Acceso', !viewerMenu.some((i) => i.id === 'menu_access')],
  ['viewer menu excludes Operación', !viewerMenu.some((i) => i.id === 'menu_operation')],
  ['viewer menu includes Dashboard', viewerMenu.some((i) => i.id === 'menu_dashboard')],
  ['viewer blocked /ops/orders', !can(viewerPerms, 'orders:read')],
  ['admin allowed /ops/orders', can(adminPerms, 'orders:read')],
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`)
  if (!ok) failed += 1
}

console.log(`\nViewer menu titles: ${viewerMenu.map((i) => i.title).join(', ')}`)
console.log(`Admin menu titles: ${adminMenu.map((i) => i.title).join(', ')}`)

if (failed) {
  process.exit(1)
}
console.log('\nSmoke RBAC OK')
