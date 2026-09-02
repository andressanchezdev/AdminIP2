/**
 * Smoke: routeKeys módulo/subgestión + firstPermittedStaffPath.
 * node scripts/smoke-routes.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = (name) => JSON.parse(readFileSync(join(root, 'jsonMocks', name), 'utf8'))

const users = load('users.json')
const roles = load('roles.json')
const menu = load('menuConfig.json')

const ROUTE_MAP = {
  'dashboard/medicion': 'metrics:view',
  'acceso/roles': 'roles:manage',
  'acceso/auditoria': 'audit:view',
  'operacion/pedidos': 'orders:read',
  'operacion/clientes': 'clients:read',
  'operacion/envios': 'shipments:read',
  'operacion/productos': 'products:read',
  'configuracion/ajustes': 'settings:manage',
  'configuracion/perfil': 'profile:edit',
}

const PRIORITY = Object.keys(ROUTE_MAP)

function derive(roleIds) {
  const set = new Set()
  roleIds.forEach((id) => {
    const role = roles.find((r) => r.id === id)
    ;(role?.permissions ?? []).forEach((p) => set.add(p))
  })
  return set
}

function hasRoute(perms, routeKey) {
  const code = ROUTE_MAP[routeKey]
  return Boolean(code && perms.has(code))
}

function firstHome(perms) {
  for (const key of PRIORITY) {
    if (hasRoute(perms, key)) return `/${key}`
  }
  return '/403'
}

function filterMenu(items, roleIds, perms) {
  return items
    .map((item) => {
      const roleOk = !item.rolesAllowed?.length || item.rolesAllowed.some((r) => roleIds.includes(r))
      if (!roleOk) return null
      const children = item.children ? filterMenu(item.children, roleIds, perms) : undefined
      const keys = item.permissionsAllowed ?? []
      const permOk = !keys.length || keys.some((k) => hasRoute(perms, k.replace(/^\//, '')) || perms.has(k))
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

const checks = [
  ['menu paths module/sub', menu.every((m) => (m.children ?? [m]).every((c) => !c.path || c.path.split('/').filter(Boolean).length >= 1))],
  ['admin home', firstHome(adminPerms) === '/dashboard/medicion'],
  ['viewer home', firstHome(viewerPerms) === '/dashboard/medicion'],
  ['viewer lacks operacion/pedidos', !hasRoute(viewerPerms, 'operacion/pedidos')],
  ['admin has operacion/pedidos', hasRoute(adminPerms, 'operacion/pedidos')],
  ['viewer menu excludes Operación', !filterMenu(menu, viewer.roles, viewerPerms).some((i) => i.id === 'menu_operation')],
  ['admin menu includes Operación', filterMenu(menu, admin.roles, adminPerms).some((i) => i.id === 'menu_operation')],
  ['pedidos path', menu.flatMap((m) => m.children ?? []).some((c) => c.path === '/operacion/pedidos')],
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`)
  if (!ok) failed += 1
}

console.log('viewer home →', firstHome(viewerPerms))
console.log('admin home →', firstHome(adminPerms))
if (failed) process.exit(1)
console.log('\nSmoke routes OK')
