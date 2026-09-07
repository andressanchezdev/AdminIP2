import usersJson from './users.json'
import rolesJson from './roles.json'
import productsJson from './products.json'
import ordersJson from './orders.json'
import clientsJson from './clientes.json'
import shipmentsJson from './shipments.json'
import auditLogsJson from './auditLogs.json'
import metricsJson from './metrics_data.json'
import settingsJson from './settings.json'
import menuConfigJson from './menuConfig.json'
import permissionsCatalogJson from './permissions_catalog.json'
import categoriesJson from './categories.json'
import blogLayoutsJson from './blogLayouts.json'
import blogPostsJson from './blogPosts.json'
import vacanciesJson from './vacancies.json'
import landingTeamJson from './landingTeam.json'

export type AdminUser = {
  id: string
  fullName: string
  email: string
  password: string
  phone: string
  address: string
  /** Un solo rol por usuario administrativo (`roles[0]`). */
  roles: string[]
  status: string
  lastLogin: string | null
  avatar: string
}

export type AuditLog = {
  id: string
  action: string
  entity: string
  entityId: string
  actorId: string
  actorRole: string
  details: string
  timestamp: string
  kind?: 'change' | 'denial' | 'auth'
  route?: string
  requiredPermissions?: string[]
  userPermissions?: string[]
}

export type MenuNode = {
  id: string
  title: string
  path: string
  icon?: string
  routeKey?: string
  rolesAllowed?: string[]
  permissionsAllowed?: string[]
  children?: MenuNode[]
}

export type ClientType = 'minorista' | 'mayorista' | 'empresarial'

export const CLIENT_TYPES: ClientType[] = ['minorista', 'mayorista', 'empresarial']

export const WAREHOUSES = ['Bodega 1', 'Bodega 2', 'Bodega 3', 'Bodega 4'] as const
export type WarehouseName = (typeof WAREHOUSES)[number]

export type ClientRecord = {
  id: string
  name: string
  status: string
  address: string
  createdAt: string
  clientType: ClientType
  creditAvailable?: number
  contact: {
    name: string
    email: string
    phone: string
  }
}

export type CategoryRecord = {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

export type ProductPrices = {
  mayorista: number
  minorista: number
  empresarial: number
}

export type ProductRecord = {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  modelo: string
  precios: ProductPrices[]
  cantidad: number
  bodega: string
  /** Data URL WebP o URL externa de la imagen del producto. */
  imagen?: string | null
  status: string
  creado_en: string
  actualizado_en: string
  /** Opcional: vínculo legado con categorías. */
  categoryId?: string
  category?: string
}

export function getProductPrices(product: ProductRecord): ProductPrices {
  return product.precios[0] ?? { mayorista: 0, minorista: 0, empresarial: 0 }
}

export function productPriceForClient(product: ProductRecord, clientType: ClientType = 'minorista') {
  return getProductPrices(product)[clientType] ?? 0
}

/** Texto de listado: nombre + descripción + modelo. */
export function productDisplayLabel(product: ProductRecord) {
  return [product.nombre, product.descripcion, product.modelo].filter(Boolean).join(' ')
}

export type OrderItem = {
  productId: string
  qty: number
  unitPrice: number
}

export type OrderRecord = {
  id: string
  orderNumber: string
  clientId: string
  items: OrderItem[]
  total: number
  status: string
  deliveryAddress: string
  contactPhone: string
  paymentMethod?: 'efectivo' | 'transferencia' | 'credito' | null
  paymentCashAmount?: number | null
  paymentReceiptName?: string | null
  paymentReceiptDataUrl?: string | null
  createdAt: string
  updatedAt: string
  assignedTo: string | null
  createdBy?: string | null
  cancelReason?: string | null
}

export type ShipmentRecord = {
  id: string
  orderId: string
  orderNumber?: string
  clientName?: string
  status: string
  carrier: string
  trackingNumber: string
  address: string
  estimatedDelivery: string
  shippedAt: string | null
  driverId?: string | null
}

export type MetricsData = {
  sales_over_time: Array<{ date: string; total: number }>
  top_products: Array<{ productId: string; name: string; sold: number }>
}

export type RoleRecord = {
  id: string
  name: string
  description: string
  permissions: string[]
}

export type PermissionCatalogEntry = {
  code: string
  label: string
  management: string
  action: string
  description: string
  aliases?: string[]
  enabled: boolean
}

export type BlogSlotType = 'image' | 'text' | 'heading' | 'carousel'

export type BlogSlot = {
  id: string
  type: BlogSlotType
  label: string
  area: string
}

export type BlogLayout = {
  id: string
  name: string
  orientation: 'row' | 'column'
  gridTemplateAreas: string
  gridTemplateColumns: string
  gridTemplateRows: string
  slots: BlogSlot[]
}

export type BlogFontSize = 'sm' | 'md' | 'lg' | 'xl'
export type BlogFontColor = 'c1' | 'c2' | 'c3' | 'c4'

/** Estilo tipográfico avanzado (título / texto). */
export type BlogTextStyle = {
  color?: string
  fontSizePx?: number
  backgroundColor?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  uppercase?: boolean
  shadow?: boolean
  /** Resaltado tipo marcador. */
  highlight?: boolean
  /** Contorno de letra. */
  outline?: boolean
  /** Tachado. */
  strike?: boolean
  paddingPx?: number
  letterSpacingPx?: number
  lineHeight?: number
}

export type BlogBlockContent = {
  text?: string
  imageUrl?: string
  /** Carrusel Post IG: 1–8 URLs. */
  imageUrls?: string[]
  /** @deprecated Preferir textStyle */
  fontSize?: BlogFontSize
  /** @deprecated Preferir textStyle */
  fontColor?: BlogFontColor
  textStyle?: BlogTextStyle
}

export type BlogPostStatus = 'borrador' | 'publicado' | 'archivado' | 'programado'

export type BlogItemKind = 'post' | 'separator'

export type BlogSeparatorVariant =
  | 'gold-line'
  | 'dark-band'
  | 'split-rule'
  | 'dot-accent'
  | 'gold-dash'
  | 'brand-frame'
  | 'lineas-ip'

export type BlogPost = {
  id: string
  slug: string
  title: string
  /** Estilo tipográfico del título de la publicación. */
  titleStyle?: BlogTextStyle
  status: BlogPostStatus
  sortOrder: number
  kind: BlogItemKind
  separatorVariant?: BlogSeparatorVariant
  layoutId: string
  layoutSnapshot: BlogLayout
  blocks: Record<string, BlogBlockContent>
  /** ISO: publicar automáticamente a partir de esta fecha/hora. */
  scheduledAt: string | null
  /** ISO: dejar de mostrar en el blog público tras esta fecha/hora. */
  unpublishAt: string | null
  createdAt: string
  updatedAt: string
}

export type BlogComment = {
  id: string
  postId: string
  authorName: string
  body: string
  createdAt: string
}

export type BlogSubmissionStatus = 'pendiente' | 'aprobada' | 'rechazada'

export type BlogSubmission = {
  id: string
  authorName: string
  authorEmail: string
  title: string
  content: string
  imageUrls: string[]
  status: BlogSubmissionStatus
  createdAt: string
}

export const BLOG_FONT_COLORS: Record<BlogFontColor, string> = {
  c1: '#333333',
  c2: '#2D3238',
  c3: '#FFC629',
  c4: '#757575',
}

export const BLOG_FONT_SIZES: Record<BlogFontSize, string> = {
  sm: '0.875rem',
  md: '1rem',
  lg: '1.25rem',
  xl: '1.5rem',
}

export const mockUsers: AdminUser[] = (usersJson as AdminUser[]).map((user) => ({ ...user }))
export const mockRoles: RoleRecord[] = (rolesJson as RoleRecord[]).map((role) => ({
  ...role,
  permissions: [...role.permissions],
}))
export const mockProducts = productsJson as ProductRecord[]
export const mockOrders = ordersJson as OrderRecord[]
export const mockClients = clientsJson as ClientRecord[]
export const mockShipments = shipmentsJson as ShipmentRecord[]
export const mockMetrics = metricsJson as MetricsData
export const mockSettings = settingsJson as Record<string, unknown>
export const mockMenu = menuConfigJson as MenuNode[]
export const mockCategories: CategoryRecord[] = (categoriesJson as CategoryRecord[]).map((entry) => ({ ...entry }))
export const mockPermissionsCatalog: PermissionCatalogEntry[] = (
  permissionsCatalogJson as Array<Omit<PermissionCatalogEntry, 'enabled'>>
).map((entry) => ({
  ...entry,
  enabled: true,
}))

export const blogLayouts: BlogLayout[] = (blogLayoutsJson as BlogLayout[]).map((layout) => ({
  ...layout,
  slots: layout.slots.map((slot) => ({ ...slot })),
}))

export const mockBlogPosts: BlogPost[] = (blogPostsJson as BlogPost[]).map((post) => ({
  ...post,
  kind: post.kind ?? 'post',
  titleStyle: post.titleStyle ?? undefined,
  scheduledAt: post.scheduledAt ?? null,
  unpublishAt: post.unpublishAt ?? null,
  layoutSnapshot: {
    ...post.layoutSnapshot,
    slots: post.layoutSnapshot.slots.map((slot) => ({ ...slot })),
  },
  blocks: { ...post.blocks },
}))

export const mockBlogComments: BlogComment[] = []
export const mockBlogSubmissions: BlogSubmission[] = []

let auditLogsState: AuditLog[] = [...(auditLogsJson as AuditLog[])]

export function getAuditLogs() {
  return auditLogsState
}

export function appendAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
  const next: AuditLog = {
    id: entry.id ?? `audit_${Date.now()}`,
    timestamp: entry.timestamp ?? new Date().toISOString(),
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    details: entry.details,
    kind: entry.kind,
    route: entry.route,
    requiredPermissions: entry.requiredPermissions,
    userPermissions: entry.userPermissions,
  }
  auditLogsState = [next, ...auditLogsState]
  return next
}

export function createRole(input: { name: string; description: string; permissions: string[] }) {
  const role: RoleRecord = {
    id: `role_${Date.now()}`,
    name: input.name.trim(),
    description: input.description.trim(),
    permissions: [...input.permissions],
  }
  mockRoles.push(role)
  return role
}

export function updateRole(
  roleId: string,
  input: { name: string; description: string; permissions: string[] },
) {
  const index = mockRoles.findIndex((role) => role.id === roleId)
  if (index < 0) {
    return null
  }
  mockRoles[index] = {
    ...mockRoles[index],
    name: input.name.trim(),
    description: input.description.trim(),
    permissions: [...input.permissions],
  }
  return mockRoles[index]
}

export function deleteRole(roleId: string, reason: string, migrateToRoleId?: string) {
  const index = mockRoles.findIndex((role) => role.id === roleId)
  if (index < 0) {
    return { ok: false as const, error: 'No encontramos ese rol' }
  }
  if (!reason.trim()) {
    return { ok: false as const, error: 'Indique el motivo de la eliminación' }
  }
  if (roleId === 'role_admin') {
    return { ok: false as const, error: 'El rol Administrador no se puede eliminar' }
  }

  const assignedUsers = mockUsers.filter((user) => user.roles.includes(roleId))
  if (assignedUsers.length > 0) {
    if (!migrateToRoleId) {
      return {
        ok: false as const,
        error: `Hay ${assignedUsers.length} usuario(s) con este rol. Elija otro rol para reasignarlos`,
      }
    }
    if (migrateToRoleId === roleId) {
      return { ok: false as const, error: 'Elija un rol distinto al que está eliminando' }
    }
    if (migrateToRoleId === 'role_cliente') {
      return { ok: false as const, error: 'No se puede migrar a un rol de cliente' }
    }
    const target = mockRoles.find((role) => role.id === migrateToRoleId)
    if (!target) {
      return { ok: false as const, error: 'El rol de destino no existe' }
    }
    assignedUsers.forEach((user) => {
      const nextRoles = user.roles.filter((id) => id !== roleId)
      if (!nextRoles.includes(migrateToRoleId)) {
        nextRoles.push(migrateToRoleId)
      }
      user.roles = nextRoles
    })
  }

  const [removed] = mockRoles.splice(index, 1)
  return {
    ok: true as const,
    role: removed,
    reason: reason.trim(),
    migratedCount: assignedUsers.length,
    migrateToRoleId: assignedUsers.length ? migrateToRoleId : undefined,
  }
}

export function createUser(input: {
  fullName: string
  email: string
  password: string
  phone: string
  address: string
  roleId: string
}) {
  const email = input.email.trim().toLowerCase()
  if (mockUsers.some((user) => user.email.toLowerCase() === email)) {
    return { ok: false as const, error: 'Ya existe un usuario con ese correo' }
  }
  if (!input.roleId || input.roleId === 'role_cliente') {
    return { ok: false as const, error: 'Seleccione un rol administrativo válido' }
  }
  const user: AdminUser = {
    id: `user_${Date.now()}`,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    password: input.password,
    phone: input.phone.trim(),
    address: input.address.trim(),
    roles: [input.roleId],
    status: 'activo',
    lastLogin: null,
    avatar: '',
  }
  mockUsers.push(user)
  return { ok: true as const, user }
}

export function updateUser(
  userId: string,
  input: Partial<Pick<AdminUser, 'fullName' | 'email' | 'phone' | 'address' | 'password'> & { roleId: string }>,
) {
  const index = mockUsers.findIndex((user) => user.id === userId)
  if (index < 0) return null
  const email = input.email?.trim()
  if (email && mockUsers.some((user) => user.email.toLowerCase() === email.toLowerCase() && user.id !== userId)) {
    return null
  }
  if (input.roleId === 'role_cliente') {
    return null
  }
  mockUsers[index] = {
    ...mockUsers[index],
    fullName: input.fullName?.trim() ?? mockUsers[index].fullName,
    email: email ?? mockUsers[index].email,
    phone: input.phone?.trim() ?? mockUsers[index].phone,
    address: input.address?.trim() ?? mockUsers[index].address,
    roles: input.roleId ? [input.roleId] : mockUsers[index].roles,
    password: input.password ?? mockUsers[index].password,
  }
  return mockUsers[index]
}

export function deleteUser(userId: string, reason: string) {
  if (!reason.trim()) {
    return { ok: false as const, error: 'El motivo de eliminación es obligatorio' }
  }
  const index = mockUsers.findIndex((user) => user.id === userId)
  if (index < 0) {
    return { ok: false as const, error: 'Usuario no encontrado' }
  }
  const [removed] = mockUsers.splice(index, 1)
  return { ok: true as const, user: removed, reason: reason.trim() }
}

export function setUserStatus(userId: string, status: 'activo' | 'inactivo', reason: string) {
  if (!reason.trim()) {
    return { ok: false as const, error: 'El motivo es obligatorio' }
  }
  const index = mockUsers.findIndex((user) => user.id === userId)
  if (index < 0) {
    return { ok: false as const, error: 'Usuario no encontrado' }
  }
  mockUsers[index] = { ...mockUsers[index], status }
  return { ok: true as const, user: mockUsers[index], reason: reason.trim() }
}

export function createCategory(input: { name: string; description: string }) {
  const nextNum = mockCategories.reduce((max, entry) => {
    const num = Number(entry.id.replace(/\D/g, ''))
    return Number.isFinite(num) ? Math.max(max, num) : max
  }, 0) + 1
  const category: CategoryRecord = {
    id: `CAT${String(nextNum).padStart(3, '0')}`,
    name: input.name.trim(),
    description: input.description.trim(),
    status: 'activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockCategories.push(category)
  return category
}

export function updateCategory(
  categoryId: string,
  input: { name: string; description: string },
) {
  const index = mockCategories.findIndex((entry) => entry.id === categoryId)
  if (index < 0) return null
  mockCategories[index] = {
    ...mockCategories[index],
    name: input.name.trim(),
    description: input.description.trim(),
    updatedAt: new Date().toISOString(),
  }
  mockProducts.forEach((product) => {
    if (product.categoryId === categoryId) {
      product.category = mockCategories[index].name
      product.actualizado_en = new Date().toISOString()
    }
  })
  return mockCategories[index]
}

export function migrateProductsCategory(fromId: string, toId: string) {
  const target = mockCategories.find((entry) => entry.id === toId)
  if (!target) {
    return { ok: false as const, error: 'Categoría destino no encontrada' }
  }
  mockProducts.forEach((product) => {
    if (product.categoryId === fromId) {
      product.categoryId = toId
      product.category = target.name
      product.actualizado_en = new Date().toISOString()
    }
  })
  return { ok: true as const }
}

export function productsInCategory(categoryId: string) {
  return mockProducts.filter((product) => product.categoryId === categoryId)
}

export function deactivateCategory(categoryId: string, migrateToId: string) {
  const target = mockCategories.find((entry) => entry.id === migrateToId && entry.status === 'activo')
  if (!target || migrateToId === categoryId) {
    return { ok: false as const, error: 'Debe migrar a otra categoría activa' }
  }
  const migrated = migrateProductsCategory(categoryId, migrateToId)
  if (!migrated.ok) return migrated
  const index = mockCategories.findIndex((entry) => entry.id === categoryId)
  if (index < 0) return { ok: false as const, error: 'Categoría no encontrada' }
  mockCategories[index] = {
    ...mockCategories[index],
    status: 'inactivo',
    updatedAt: new Date().toISOString(),
  }
  return { ok: true as const }
}

export function deleteCategory(categoryId: string, migrateToId: string) {
  const target = mockCategories.find((entry) => entry.id === migrateToId)
  if (!target || migrateToId === categoryId) {
    return { ok: false as const, error: 'Debe migrar a otra categoría existente' }
  }
  const migrated = migrateProductsCategory(categoryId, migrateToId)
  if (!migrated.ok) return migrated
  const index = mockCategories.findIndex((entry) => entry.id === categoryId)
  if (index < 0) return { ok: false as const, error: 'Categoría no encontrada' }
  const [removed] = mockCategories.splice(index, 1)
  return { ok: true as const, category: removed }
}

export function createOrder(input: {
  clientId: string
  items: OrderItem[]
  createdBy: string
  deliveryAddress: string
  contactPhone: string
  assignedTo?: string | null
  paymentMethod: 'efectivo' | 'transferencia' | 'credito'
  paymentCashAmount?: number | null
  paymentReceiptName?: string | null
  paymentReceiptDataUrl?: string | null
}) {
  if (!input.items.length) {
    return { ok: false as const, error: 'El pedido debe tener al menos un producto' }
  }
  const nextNum = mockOrders.reduce((max, order) => {
    const num = Number(order.id.replace(/\D/g, ''))
    return Number.isFinite(num) ? Math.max(max, num) : max
  }, 0) + 1
  const id = `P${String(nextNum).padStart(3, '0')}`
  const total = input.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const client = mockClients.find((entry) => entry.id === input.clientId)
  const order: OrderRecord = {
    id,
    orderNumber: id,
    clientId: input.clientId,
    items: input.items.map((item) => ({ ...item })),
    total,
    status: 'verificar',
    deliveryAddress: input.deliveryAddress.trim() || client?.address || '',
    contactPhone: input.contactPhone.trim() || client?.contact.phone || '',
    paymentMethod: input.paymentMethod,
    paymentCashAmount: input.paymentCashAmount ?? null,
    paymentReceiptName: input.paymentReceiptName ?? null,
    paymentReceiptDataUrl: input.paymentReceiptDataUrl ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTo: input.assignedTo ?? null,
    createdBy: input.createdBy,
    cancelReason: null,
  }
  mockOrders.unshift(order)
  return { ok: true as const, order }
}

export function updateOrderEditableFields(
  orderId: string,
  input: {
    deliveryAddress: string
    contactPhone: string
    items: OrderItem[]
  },
) {
  const index = mockOrders.findIndex((order) => order.id === orderId)
  if (index < 0) {
    return { ok: false as const, error: 'Pedido no encontrado' }
  }
  if (!input.items.length) {
    return { ok: false as const, error: 'El pedido debe tener al menos un producto' }
  }
  const total = input.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  mockOrders[index] = {
    ...mockOrders[index],
    deliveryAddress: input.deliveryAddress.trim(),
    contactPhone: input.contactPhone.trim(),
    items: input.items.map((item) => ({ ...item })),
    total,
    updatedAt: new Date().toISOString(),
  }
  return { ok: true as const, order: mockOrders[index] }
}

export function setOrderStatus(orderId: string, status: string) {
  const index = mockOrders.findIndex((order) => order.id === orderId)
  if (index < 0) return null
  mockOrders[index] = {
    ...mockOrders[index],
    status,
    updatedAt: new Date().toISOString(),
  }
  return mockOrders[index]
}

export function cancelOrder(orderId: string, reason: string) {
  if (!reason.trim()) {
    return { ok: false as const, error: 'El motivo de cancelación es obligatorio' }
  }
  const index = mockOrders.findIndex((order) => order.id === orderId)
  if (index < 0) {
    return { ok: false as const, error: 'Pedido no encontrado' }
  }
  if (mockOrders[index].status === 'cancelado') {
    return { ok: false as const, error: 'El pedido ya está cancelado' }
  }
  mockOrders[index] = {
    ...mockOrders[index],
    status: 'cancelado',
    cancelReason: reason.trim(),
    updatedAt: new Date().toISOString(),
  }
  return { ok: true as const, order: mockOrders[index] }
}

export function updateProduct(
  productId: string,
  input: Partial<{
    codigo: string
    nombre: string
    descripcion: string
    modelo: string
    precios: ProductPrices[]
    cantidad: number
    bodega: string
    imagen: string | null
    status: string
  }>,
) {
  const index = mockProducts.findIndex((product) => product.id === productId)
  if (index < 0) return null
  mockProducts[index] = {
    ...mockProducts[index],
    ...input,
    actualizado_en: new Date().toISOString(),
  }
  return mockProducts[index]
}

export function createProduct(input: {
  codigo: string
  nombre: string
  descripcion: string
  modelo: string
  precios: ProductPrices
  cantidad: number
  bodega: string
  imagen?: string | null
}) {
  if (mockProducts.some((product) => product.codigo.toLowerCase() === input.codigo.trim().toLowerCase())) {
    return { ok: false as const, error: 'Ya existe un producto con ese código' }
  }
  if (!WAREHOUSES.includes(input.bodega as WarehouseName)) {
    return { ok: false as const, error: 'Seleccione una bodega válida' }
  }
  const nextNum = mockProducts.reduce((max, product) => {
    const num = Number(product.id.replace(/\D/g, ''))
    return Number.isFinite(num) ? Math.max(max, num) : max
  }, 0) + 1
  const now = new Date().toISOString()
  const product: ProductRecord = {
    id: `PR${String(nextNum).padStart(3, '0')}`,
    codigo: input.codigo.trim(),
    nombre: input.nombre.trim(),
    descripcion: input.descripcion.trim(),
    modelo: input.modelo.trim(),
    precios: [{ ...input.precios }],
    cantidad: input.cantidad,
    bodega: input.bodega,
    imagen: input.imagen?.trim() || null,
    status: 'activo',
    creado_en: now,
    actualizado_en: now,
  }
  mockProducts.unshift(product)
  return { ok: true as const, product }
}

export function createClient(input: {
  name: string
  address: string
  contactName: string
  email: string
  phone: string
  clientType: ClientType
  creditAvailable?: number
}) {
  if (mockClients.some((client) => client.contact.email.toLowerCase() === input.email.trim().toLowerCase())) {
    return { ok: false as const, error: 'Ya existe un cliente con ese email' }
  }
  if (!CLIENT_TYPES.includes(input.clientType)) {
    return { ok: false as const, error: 'Seleccione el tipo de cliente' }
  }
  const nextNum = mockClients.reduce((max, client) => {
    const num = Number(client.id.replace(/\D/g, ''))
    return Number.isFinite(num) ? Math.max(max, num) : max
  }, 0) + 1
  const client: ClientRecord = {
    id: `C${String(nextNum).padStart(3, '0')}`,
    name: input.name.trim(),
    address: input.address.trim(),
    status: 'activo',
    createdAt: new Date().toISOString(),
    clientType: input.clientType,
    creditAvailable: input.creditAvailable ?? 0,
    contact: {
      name: input.contactName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
    },
  }
  mockClients.push(client)
  return { ok: true as const, client }
}

export function updateClient(
  clientId: string,
  input: Partial<{
    name: string
    address: string
    contactName: string
    email: string
    phone: string
    status: string
    creditAvailable: number
    clientType: ClientType
  }>,
) {
  const index = mockClients.findIndex((client) => client.id === clientId)
  if (index < 0) return null
  if (input.email) {
    const duplicated = mockClients.some(
      (client) => client.id !== clientId && client.contact.email.toLowerCase() === input.email!.trim().toLowerCase(),
    )
    if (duplicated) return null
  }
  mockClients[index] = {
    ...mockClients[index],
    name: input.name?.trim() ?? mockClients[index].name,
    address: input.address?.trim() ?? mockClients[index].address,
    status: input.status ?? mockClients[index].status,
    creditAvailable: input.creditAvailable ?? mockClients[index].creditAvailable,
    clientType: input.clientType ?? mockClients[index].clientType,
    contact: {
      name: input.contactName?.trim() ?? mockClients[index].contact.name,
      email: input.email?.trim() ?? mockClients[index].contact.email,
      phone: input.phone?.trim() ?? mockClients[index].contact.phone,
    },
  }
  return mockClients[index]
}

export function deleteClient(clientId: string, reason: string) {
  if (!reason.trim()) {
    return { ok: false as const, error: 'El motivo de eliminación es obligatorio' }
  }
  const activeOrders = mockOrders.filter(
    (order) => order.clientId === clientId && order.status !== 'envio' && order.status !== 'cancelado',
  ).length
  if (activeOrders > 0) {
    return { ok: false as const, error: `Tiene ${activeOrders} pedido(s) activo(s)` }
  }
  const index = mockClients.findIndex((client) => client.id === clientId)
  if (index < 0) {
    return { ok: false as const, error: 'Cliente no encontrado' }
  }
  const [removed] = mockClients.splice(index, 1)
  return { ok: true as const, client: removed, reason: reason.trim() }
}

export function createShipment(input: {
  orderId: string
  carrier: string
  trackingNumber: string
  address: string
  estimatedDelivery: string
  driverId?: string | null
}) {
  const order = mockOrders.find((entry) => entry.id === input.orderId)
  if (!order) {
    return { ok: false as const, error: 'Pedido no encontrado' }
  }
  if (mockShipments.some((shipment) => shipment.orderId === input.orderId && shipment.status !== 'cancelado')) {
    return { ok: false as const, error: 'El pedido ya tiene un envío activo' }
  }
  const client = mockClients.find((entry) => entry.id === order.clientId)
  const nextNum = mockShipments.reduce((max, shipment) => {
    const num = Number(shipment.id.replace(/\D/g, ''))
    return Number.isFinite(num) ? Math.max(max, num) : max
  }, 0) + 1
  const shipment: ShipmentRecord = {
    id: `E${String(nextNum).padStart(3, '0')}`,
    orderId: order.id,
    orderNumber: order.orderNumber || order.id,
    clientName: client?.name ?? order.clientId,
    status: 'programado',
    carrier: input.carrier.trim(),
    trackingNumber: input.trackingNumber.trim(),
    address: input.address.trim(),
    estimatedDelivery: input.estimatedDelivery,
    shippedAt: null,
    driverId: input.driverId ?? null,
  }
  mockShipments.unshift(shipment)
  return { ok: true as const, shipment }
}

export function updateShipment(
  shipmentId: string,
  input: Partial<Pick<ShipmentRecord, 'carrier' | 'trackingNumber' | 'address' | 'estimatedDelivery' | 'status' | 'driverId' | 'shippedAt'>>,
) {
  const index = mockShipments.findIndex((shipment) => shipment.id === shipmentId)
  if (index < 0) return null
  if (mockShipments[index].status === 'cancelado') return null
  mockShipments[index] = {
    ...mockShipments[index],
    ...input,
  }
  return mockShipments[index]
}

export function cancelShipment(shipmentId: string, reason: string) {
  if (!reason.trim()) {
    return { ok: false as const, error: 'El motivo de cancelación es obligatorio' }
  }
  const index = mockShipments.findIndex((shipment) => shipment.id === shipmentId)
  if (index < 0) {
    return { ok: false as const, error: 'Envío no encontrado' }
  }
  if (mockShipments[index].status === 'entregado') {
    return { ok: false as const, error: 'No se puede cancelar un envío entregado' }
  }
  mockShipments[index] = {
    ...mockShipments[index],
    status: 'cancelado',
  }
  return { ok: true as const, shipment: mockShipments[index], reason: reason.trim() }
}

export function deleteProduct(productId: string, reason: string) {
  if (!reason.trim()) {
    return { ok: false as const, error: 'El motivo de eliminación es obligatorio' }
  }
  const index = mockProducts.findIndex((product) => product.id === productId)
  if (index < 0) {
    return { ok: false as const, error: 'Producto no encontrado' }
  }
  const inOrders = mockOrders.some((order) => order.items.some((item) => item.productId === productId))
  if (inOrders) {
    return { ok: false as const, error: 'Producto usado en pedidos: desactívelo en su lugar' }
  }
  const [removed] = mockProducts.splice(index, 1)
  return { ok: true as const, product: removed, reason: reason.trim() }
}

export function setPermissionEnabled(code: string, enabled: boolean) {
  const entry = mockPermissionsCatalog.find((item) => item.code === code)
  if (!entry) {
    return null
  }
  entry.enabled = enabled
  return entry
}

export function isPermissionFeatureEnabled(code: string) {
  if (code === 'permissions:manage') {
    return true
  }
  const entry = mockPermissionsCatalog.find((item) => item.code === code)
  return entry ? entry.enabled : true
}

function cloneLayout(layout: BlogLayout): BlogLayout {
  return {
    ...layout,
    slots: layout.slots.map((slot) => ({ ...slot })),
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `post-${Date.now()}`
}

function uniqueBlogSlug(base: string, excludeId?: string) {
  let slug = slugify(base)
  let suffix = 1
  while (mockBlogPosts.some((post) => post.slug === slug && post.id !== excludeId)) {
    slug = `${slugify(base)}-${suffix}`
    suffix += 1
  }
  return slug
}

export function getBlogLayout(layoutId: string) {
  return blogLayouts.find((layout) => layout.id === layoutId) ?? null
}

export function listBlogPosts(status?: BlogPostStatus | 'all') {
  applyBlogScheduleTransitions()
  const list = [...mockBlogPosts].sort((a, b) => a.sortOrder - b.sortOrder)
  if (!status || status === 'all') return list
  return list.filter((post) => post.status === status)
}

/** Aplica programación / caducidad en memoria (mock). */
function applyBlogScheduleTransitions() {
  const now = Date.now()
  for (const post of mockBlogPosts) {
    if (
      post.status === 'programado'
      && post.scheduledAt
      && new Date(post.scheduledAt).getTime() <= now
    ) {
      post.status = 'publicado'
      post.updatedAt = new Date().toISOString()
    }
    if (
      (post.status === 'publicado' || post.status === 'programado')
      && post.unpublishAt
      && new Date(post.unpublishAt).getTime() <= now
    ) {
      post.status = 'archivado'
      post.updatedAt = new Date().toISOString()
    }
  }
}

export function isBlogPostPubliclyVisible(post: BlogPost, now = Date.now()) {
  if (post.kind === 'separator') {
    return post.status === 'publicado'
  }
  if (post.unpublishAt && new Date(post.unpublishAt).getTime() <= now) {
    return false
  }
  if (post.status === 'publicado') {
    // Solo oculta si aún hay programación futura pendiente.
    if (post.scheduledAt && new Date(post.scheduledAt).getTime() > now) {
      return false
    }
    return true
  }
  if (post.status === 'programado' && post.scheduledAt) {
    return new Date(post.scheduledAt).getTime() <= now
  }
  return false
}

export function getPublishedPosts() {
  applyBlogScheduleTransitions()
  return [...mockBlogPosts]
    .filter((post) => isBlogPostPubliclyVisible(post))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getBlogPostById(postId: string) {
  return mockBlogPosts.find((post) => post.id === postId) ?? null
}

export function getBlogPostBySlug(slug: string) {
  applyBlogScheduleTransitions()
  return mockBlogPosts.find((post) => post.slug === slug && post.kind !== 'separator') ?? null
}

export function createBlogPost(input: {
  title: string
  titleStyle?: BlogTextStyle
  layoutId: string
  blocks: Record<string, BlogBlockContent>
  status?: BlogPostStatus
  layoutSnapshot?: BlogLayout
  scheduledAt?: string | null
  unpublishAt?: string | null
}) {
  const layout = input.layoutSnapshot
    ? cloneLayout(input.layoutSnapshot)
    : getBlogLayout(input.layoutId)
  if (!layout) {
    return { ok: false as const, error: 'Maqueta no encontrada' }
  }
  const title = input.title.trim()
  if (!title) {
    return { ok: false as const, error: 'El título es obligatorio' }
  }
  const scheduledAt = input.scheduledAt ?? null
  const unpublishAt = input.unpublishAt ?? null
  if (scheduledAt && unpublishAt && new Date(unpublishAt) <= new Date(scheduledAt)) {
    return { ok: false as const, error: 'La fecha de fin debe ser posterior a la programación' }
  }
  let status = input.status ?? 'borrador'
  if (scheduledAt && new Date(scheduledAt).getTime() > Date.now()) {
    status = 'programado'
  }
  const now = new Date().toISOString()
  const maxOrder = mockBlogPosts.reduce((max, post) => Math.max(max, post.sortOrder), 0)
  const post: BlogPost = {
    id: `post_${Date.now()}`,
    slug: uniqueBlogSlug(title),
    title,
    titleStyle: input.titleStyle,
    status,
    sortOrder: maxOrder + 1,
    kind: 'post',
    layoutId: layout.id,
    layoutSnapshot: cloneLayout(layout),
    blocks: { ...input.blocks },
    scheduledAt,
    unpublishAt,
    createdAt: now,
    updatedAt: now,
  }
  mockBlogPosts.push(post)
  return { ok: true as const, post }
}

const SEPARATOR_LAYOUT_STUB: BlogLayout = {
  id: 'separator',
  name: 'Separador',
  orientation: 'column',
  gridTemplateAreas: '"body"',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto',
  slots: [],
}

export function createBlogSeparator(variant: BlogSeparatorVariant) {
  const now = new Date().toISOString()
  const maxOrder = mockBlogPosts.reduce((max, post) => Math.max(max, post.sortOrder), 0)
  const labels: Record<BlogSeparatorVariant, string> = {
    'gold-line': 'Separador · Línea dorada',
    'dark-band': 'Separador · Banda oscura',
    'split-rule': 'Separador · Doble regla',
    'dot-accent': 'Separador · Punto Premium',
    'gold-dash': 'Separador · Trazo dorado',
    'brand-frame': 'Separador · Marco marca',
    'lineas-ip': 'Separador · lineasIp',
  }
  const post: BlogPost = {
    id: `sep_${Date.now()}`,
    slug: uniqueBlogSlug(`separador-${variant}`),
    title: labels[variant],
    status: 'publicado',
    sortOrder: maxOrder + 1,
    kind: 'separator',
    separatorVariant: variant,
    layoutId: SEPARATOR_LAYOUT_STUB.id,
    layoutSnapshot: cloneLayout(SEPARATOR_LAYOUT_STUB),
    blocks: {},
    scheduledAt: null,
    unpublishAt: null,
    createdAt: now,
    updatedAt: now,
  }
  mockBlogPosts.push(post)
  return { ok: true as const, post }
}

export function updateBlogPost(
  postId: string,
  input: Partial<Pick<BlogPost, 'title' | 'titleStyle' | 'status' | 'layoutId' | 'layoutSnapshot' | 'blocks' | 'slug' | 'scheduledAt' | 'unpublishAt'>>,
) {
  const index = mockBlogPosts.findIndex((post) => post.id === postId)
  if (index < 0) return null

  const current = mockBlogPosts[index]
  let layoutSnapshot = current.layoutSnapshot
  let layoutId = current.layoutId

  if (input.layoutSnapshot) {
    layoutSnapshot = cloneLayout(input.layoutSnapshot)
    layoutId = layoutSnapshot.id
  } else if (input.layoutId && input.layoutId !== current.layoutId) {
    const nextLayout = getBlogLayout(input.layoutId)
    if (nextLayout) {
      layoutSnapshot = cloneLayout(nextLayout)
      layoutId = nextLayout.id
    }
  }

  const title = input.title?.trim() ?? current.title
  const slug = input.slug
    ? uniqueBlogSlug(input.slug, postId)
    : input.title
      ? uniqueBlogSlug(title, postId)
      : current.slug

  const scheduledAt = input.scheduledAt !== undefined ? input.scheduledAt : current.scheduledAt
  const unpublishAt = input.unpublishAt !== undefined ? input.unpublishAt : current.unpublishAt
  if (scheduledAt && unpublishAt && new Date(unpublishAt) <= new Date(scheduledAt)) {
    return null
  }

  let status = input.status ?? current.status
  // Solo fuerza "programado" si queda una fecha futura y el caller no limpió el schedule.
  if (
    status === 'publicado'
    && scheduledAt
    && new Date(scheduledAt).getTime() > Date.now()
    && input.scheduledAt === undefined
  ) {
    status = 'programado'
  }

  mockBlogPosts[index] = {
    ...current,
    title,
    titleStyle: input.titleStyle !== undefined ? input.titleStyle : current.titleStyle,
    slug,
    status,
    layoutId,
    layoutSnapshot,
    blocks: input.blocks ? { ...input.blocks } : current.blocks,
    scheduledAt,
    unpublishAt,
    updatedAt: new Date().toISOString(),
  }
  return mockBlogPosts[index]
}

export function reorderBlogPosts(orderedIds: string[]) {
  const byId = new Map(mockBlogPosts.map((post) => [post.id, post]))
  orderedIds.forEach((id, index) => {
    const post = byId.get(id)
    if (post) {
      post.sortOrder = index + 1
      post.updatedAt = new Date().toISOString()
    }
  })
  mockBlogPosts.sort((a, b) => a.sortOrder - b.sortOrder)
  return listBlogPosts()
}

export function deleteBlogPost(postId: string) {
  const index = mockBlogPosts.findIndex((post) => post.id === postId)
  if (index < 0) {
    return { ok: false as const, error: 'Publicación no encontrada' }
  }
  const [removed] = mockBlogPosts.splice(index, 1)
  return { ok: true as const, post: removed }
}

export function setBlogPostStatus(postId: string, nextStatus: BlogPostStatus) {
  const current = getBlogPostById(postId)
  if (!current) {
    return { ok: false as const, error: 'Publicación no encontrada' }
  }
  if (current.kind === 'separator') {
    return { ok: false as const, error: 'Los separadores no cambian de estado' }
  }

  const patch: Partial<Pick<BlogPost, 'status' | 'scheduledAt' | 'unpublishAt'>> = {
    status: nextStatus,
  }

  if (nextStatus === 'publicado') {
    // Publicar ahora: quita programación futura y caducidad ya vencida.
    patch.scheduledAt = null
    if (current.unpublishAt && new Date(current.unpublishAt).getTime() <= Date.now()) {
      patch.unpublishAt = null
    }
  }

  if (nextStatus === 'programado') {
    if (!current.scheduledAt || new Date(current.scheduledAt).getTime() <= Date.now()) {
      return {
        ok: false as const,
        error: 'Para usar programado, edite la publicación y defina una fecha/hora futura',
      }
    }
  }

  const updated = updateBlogPost(postId, patch)
  if (!updated) {
    return { ok: false as const, error: 'No se pudo actualizar el estado' }
  }

  // Garantiza que "publicado" quede visible en /blog.
  if (nextStatus === 'publicado') {
    const index = mockBlogPosts.findIndex((post) => post.id === postId)
    if (index >= 0) {
      mockBlogPosts[index] = {
        ...mockBlogPosts[index],
        status: 'publicado',
        scheduledAt: null,
        unpublishAt:
          mockBlogPosts[index].unpublishAt
          && new Date(mockBlogPosts[index].unpublishAt).getTime() <= Date.now()
            ? null
            : mockBlogPosts[index].unpublishAt,
        updatedAt: new Date().toISOString(),
      }
      const post = mockBlogPosts[index]
      if (!isBlogPostPubliclyVisible(post)) {
        return {
          ok: false as const,
          error: 'El estado se guardó, pero la publicación sigue oculta (revise fecha de fin)',
        }
      }
      return { ok: true as const, post }
    }
  }

  return { ok: true as const, post: updated }
}

export function listBlogComments(postId: string) {
  return mockBlogComments
    .filter((comment) => comment.postId === postId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addBlogComment(input: { postId: string; authorName: string; body: string }) {
  const post = getBlogPostById(input.postId)
  if (!post || !isBlogPostPubliclyVisible(post)) {
    return { ok: false as const, error: 'Publicación no disponible' }
  }
  const authorName = input.authorName.trim()
  const body = input.body.trim()
  if (authorName.length < 2) {
    return { ok: false as const, error: 'Indique su nombre' }
  }
  if (body.length < 3) {
    return { ok: false as const, error: 'El comentario es muy corto' }
  }
  const comment: BlogComment = {
    id: `bcom_${Date.now()}`,
    postId: input.postId,
    authorName,
    body,
    createdAt: new Date().toISOString(),
  }
  mockBlogComments.unshift(comment)
  return { ok: true as const, comment }
}

export function listBlogSubmissions(status?: BlogSubmissionStatus | 'all') {
  const list = [...mockBlogSubmissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (!status || status === 'all') return list
  return list.filter((item) => item.status === status)
}

export function countPendingBlogSubmissions() {
  return mockBlogSubmissions.filter((item) => item.status === 'pendiente').length
}

export function createBlogSubmission(input: {
  authorName: string
  authorEmail: string
  title: string
  content: string
  imageUrls: string[]
}) {
  const authorName = input.authorName.trim()
  const authorEmail = input.authorEmail.trim()
  const title = input.title.trim()
  const content = input.content.trim()
  if (authorName.length < 2) return { ok: false as const, error: 'Indique su nombre' }
  if (!authorEmail.includes('@')) return { ok: false as const, error: 'Correo inválido' }
  if (title.length < 3) return { ok: false as const, error: 'Indique un título' }
  if (content.length < 10) return { ok: false as const, error: 'Describa el contenido a publicar' }
  const submission: BlogSubmission = {
    id: `bsub_${Date.now()}`,
    authorName,
    authorEmail,
    title,
    content,
    imageUrls: input.imageUrls.map((url) => url.trim()).filter(Boolean),
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  }
  mockBlogSubmissions.unshift(submission)
  return { ok: true as const, submission }
}

export function setBlogSubmissionStatus(id: string, status: BlogSubmissionStatus) {
  const index = mockBlogSubmissions.findIndex((item) => item.id === id)
  if (index < 0) return null
  mockBlogSubmissions[index] = { ...mockBlogSubmissions[index], status }
  return mockBlogSubmissions[index]
}

export type VacancyStatus = 'borrador' | 'publicado' | 'cerrado' | 'archivado'

export type VacancyRecord = {
  id: string
  title: string
  location: string
  employmentType: string
  summary: string
  description: string
  requirements: string
  status: VacancyStatus
  createdAt: string
  updatedAt: string
}

export const mockVacancies: VacancyRecord[] = (vacanciesJson as VacancyRecord[]).map((item) => ({
  ...item,
}))

export function listVacancies(status: VacancyStatus | 'all' = 'all') {
  const list = [...mockVacancies].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  if (status === 'all') return list
  return list.filter((item) => item.status === status)
}

export function getPublishedVacancies() {
  return listVacancies('publicado')
}

export function getVacancyById(id: string) {
  return mockVacancies.find((item) => item.id === id) ?? null
}

export function createVacancy(input: {
  title: string
  location: string
  employmentType: string
  summary: string
  description: string
  requirements: string
  status?: VacancyStatus
}) {
  const title = input.title.trim()
  if (title.length < 3) return { ok: false as const, error: 'Indique un título' }
  const now = new Date().toISOString()
  const vacancy: VacancyRecord = {
    id: `vac_${Date.now()}`,
    title,
    location: input.location.trim() || 'Medellín, Colombia',
    employmentType: input.employmentType.trim() || 'Tiempo completo',
    summary: input.summary.trim(),
    description: input.description.trim(),
    requirements: input.requirements.trim(),
    status: input.status ?? 'borrador',
    createdAt: now,
    updatedAt: now,
  }
  mockVacancies.unshift(vacancy)
  return { ok: true as const, vacancy }
}

export function updateVacancy(
  id: string,
  patch: Partial<Omit<VacancyRecord, 'id' | 'createdAt'>>,
) {
  const index = mockVacancies.findIndex((item) => item.id === id)
  if (index < 0) return null
  mockVacancies[index] = {
    ...mockVacancies[index],
    ...patch,
    title: patch.title?.trim() ?? mockVacancies[index].title,
    location: patch.location?.trim() ?? mockVacancies[index].location,
    employmentType: patch.employmentType?.trim() ?? mockVacancies[index].employmentType,
    summary: patch.summary?.trim() ?? mockVacancies[index].summary,
    description: patch.description?.trim() ?? mockVacancies[index].description,
    requirements: patch.requirements?.trim() ?? mockVacancies[index].requirements,
    updatedAt: new Date().toISOString(),
  }
  return mockVacancies[index]
}

export function setVacancyStatus(id: string, status: VacancyStatus) {
  return updateVacancy(id, { status })
}

export function deleteVacancy(id: string) {
  const index = mockVacancies.findIndex((item) => item.id === id)
  if (index < 0) return false
  mockVacancies.splice(index, 1)
  return true
}

export type LandingTeamGroup = 'asesor' | 'administrativo'
export type LandingTeamStatus = 'borrador' | 'publicado' | 'archivado'

export type LandingTeamMember = {
  id: string
  fullName: string
  role: string
  phoneDisplay: string
  whatsappDigits: string
  imageUrl: string
  group: LandingTeamGroup
  status: LandingTeamStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export const mockLandingTeam: LandingTeamMember[] = (landingTeamJson as LandingTeamMember[]).map((item) => ({
  ...item,
}))

function normalizeWhatsappDigits(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('57')) return digits
  if (digits.length === 10) return `57${digits}`
  return digits
}

export function listLandingTeam(filters?: {
  status?: LandingTeamStatus | 'all'
  group?: LandingTeamGroup | 'all'
}) {
  const status = filters?.status ?? 'all'
  const group = filters?.group ?? 'all'
  return [...mockLandingTeam]
    .filter((item) => (status === 'all' ? true : item.status === status))
    .filter((item) => (group === 'all' ? true : item.group === group))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName))
}

export function getPublishedLandingTeam(group: LandingTeamGroup) {
  return listLandingTeam({ status: 'publicado', group })
}

export function getLandingTeamMemberById(id: string) {
  return mockLandingTeam.find((item) => item.id === id) ?? null
}

export function createLandingTeamMember(input: {
  fullName: string
  role: string
  phoneDisplay: string
  imageUrl: string
  group: LandingTeamGroup
  status?: LandingTeamStatus
}) {
  const fullName = input.fullName.trim()
  const role = input.role.trim()
  const phoneDisplay = input.phoneDisplay.trim()
  const imageUrl = input.imageUrl.trim()
  if (!imageUrl) return { ok: false as const, error: 'Suba la imagen del colaborador' }
  if (fullName.length < 2) return { ok: false as const, error: 'Indique el nombre completo' }
  if (role.length < 2) return { ok: false as const, error: 'Indique el cargo' }
  if (phoneDisplay.length < 7) return { ok: false as const, error: 'Indique un teléfono válido' }
  if (input.group !== 'asesor' && input.group !== 'administrativo') {
    return { ok: false as const, error: 'Seleccione el grupo' }
  }

  const whatsappDigits = normalizeWhatsappDigits(phoneDisplay)
  const now = new Date().toISOString()
  const maxOrder = mockLandingTeam.reduce((max, item) => Math.max(max, item.sortOrder), 0)
  const member: LandingTeamMember = {
    id: `team_${Date.now()}`,
    fullName,
    role,
    phoneDisplay,
    whatsappDigits,
    imageUrl,
    group: input.group,
    status: input.status ?? 'borrador',
    sortOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  }
  mockLandingTeam.unshift(member)
  return { ok: true as const, member }
}

export function updateLandingTeamMember(
  id: string,
  patch: Partial<Omit<LandingTeamMember, 'id' | 'createdAt'>>,
) {
  const index = mockLandingTeam.findIndex((item) => item.id === id)
  if (index < 0) return null
  const nextPhone = patch.phoneDisplay?.trim() ?? mockLandingTeam[index].phoneDisplay
  const nextWhatsapp = patch.whatsappDigits
    ?? normalizeWhatsappDigits(nextPhone)
  mockLandingTeam[index] = {
    ...mockLandingTeam[index],
    ...patch,
    fullName: patch.fullName?.trim() ?? mockLandingTeam[index].fullName,
    role: patch.role?.trim() ?? mockLandingTeam[index].role,
    phoneDisplay: nextPhone,
    whatsappDigits: nextWhatsapp || mockLandingTeam[index].whatsappDigits,
    imageUrl: patch.imageUrl?.trim() ?? mockLandingTeam[index].imageUrl,
    updatedAt: new Date().toISOString(),
  }
  return mockLandingTeam[index]
}

export function setLandingTeamStatus(id: string, status: LandingTeamStatus) {
  return updateLandingTeamMember(id, { status })
}

export function deleteLandingTeamMember(id: string) {
  const index = mockLandingTeam.findIndex((item) => item.id === id)
  if (index < 0) return false
  mockLandingTeam.splice(index, 1)
  return true
}

/** Reordena jerarquía del equipo landing (mismo patrón que `reorderBlogPosts`). */
export function reorderLandingTeamMembers(orderedIds: string[]) {
  const byId = new Map(mockLandingTeam.map((member) => [member.id, member]))
  orderedIds.forEach((id, index) => {
    const member = byId.get(id)
    if (member) {
      member.sortOrder = index + 1
      member.updatedAt = new Date().toISOString()
    }
  })
  mockLandingTeam.sort((a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName))
  return listLandingTeam()
}
