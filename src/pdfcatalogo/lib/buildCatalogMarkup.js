import {
  BRAND_LOGO_MAP,
  CATALOG_PAGE,
  DEFAULT_BRAND_LOGO,
  STORAGE_PREFIX,
} from './catalogLayout.js'

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Misma lógica que preview/catalog-preview.html → resolveMediaUrl */
export function resolveMediaUrl(raw) {
  const value = String(raw ?? '').trim()
  if (!value) {
    return ''
  }
  if (
    /^https?:\/\//i.test(value)
    || value.startsWith('data:')
    || value.startsWith('blob:')
    || value.startsWith('/')
  ) {
    return value
  }
  return STORAGE_PREFIX + value.replace(/^\//, '').split('/').map(encodeURIComponent).join('/')
}

function normalizeBrandName(brand) {
  return String(brand || '')
    .trim()
    .toLowerCase()
    .replace(/\s+original$/, '')
}

export function resolveBrandUrl(product) {
  if (product.brandLogo || product.brandLogoUrl) {
    return resolveMediaUrl(product.brandLogo || product.brandLogoUrl)
  }
  const key = normalizeBrandName(product.marca || product.brand)
  if (BRAND_LOGO_MAP[key]) {
    return BRAND_LOGO_MAP[key]
  }
  if (product.imagen) {
    return resolveMediaUrl(product.imagen)
  }
  return DEFAULT_BRAND_LOGO
}

/**
 * Normaliza producto UI / API al shape del preview.
 * pill--codigo = categoria; overlay = codigo + modelo; footer = logo marca.
 */
export function normalizeCatalogProduct(product = {}) {
  return {
    id: product.id ?? product.idpr ?? '',
    codigo: product.codigo ?? product.reference ?? product.id ?? '',
    categoria: product.categoria ?? product.category ?? '',
    descripcion: product.descripcion ?? product.description ?? '',
    modelo: product.modelo ?? product.model ?? '',
    marca: product.marca ?? product.brand ?? '',
    imagen_producto:
      product.imagen_producto
      || product.imageUrl
      || product.img_producto
      || '',
    imagen: product.imagen || product.brandLogo || product.brandLogoUrl || '',
    brandLogo: product.brandLogo || product.brandLogoUrl || '',
  }
}

function renderImg(src, kind = 'product') {
  if (!src) {
    return kind === 'brand'
      ? '<span class="brand-dot" aria-hidden="true"></span>'
      : '<span class="cell__image-fallback">Sin imagen</span>'
  }

  const fallback = kind === 'brand'
    ? `this.onerror=null;this.src='${DEFAULT_BRAND_LOGO}'`
    : "this.outerHTML='<span class=\\'cell__image-fallback\\'>Sin imagen</span>'"

  return `<img src="${escapeHtml(src)}" alt="" crossorigin="anonymous" loading="eager" onerror="${fallback}" />`
}

export function renderCell(product) {
  const productSrc = resolveMediaUrl(product.imagen_producto)
  const brandSrc = resolveBrandUrl(product)

  return `
    <div class="cell">
      <span class="pill pill--codigo">${escapeHtml(product.categoria)}</span>
      <figure class="cell__image">
        ${renderImg(productSrc, 'product')}
        <figcaption class="cell__image-content">
          <span class="pill pill--categoria">${escapeHtml(product.codigo)}</span>
          <span class="pill pill--categoria">${escapeHtml(product.modelo)}</span>
        </figcaption>
      </figure>
      <span class="pill pill--marca">
        ${renderImg(brandSrc, 'brand')}
      </span>
    </div>
  `
}

export function renderPageHtml({
  products,
  pageIndex,
  totalPages,
  totalProducts,
  filterSummary,
  headerIconSrc,
}) {
  return `
    <article class="page" aria-label="Pagina ${pageIndex} del catalogo">
      <header class="page-header">
        <div class="page-header__left">
          <img class="page-header__icon" src="${escapeHtml(headerIconSrc)}" alt="iP" crossorigin="anonymous" />
          <div>
            <p class="page-header__title">Catalogo de productos</p>
            <p class="page-header__meta">${totalProducts} productos  ·  ${escapeHtml(filterSummary)}</p>
          </div>
        </div>
        <div class="page-header__page">Pagina ${pageIndex} / ${totalPages}</div>
      </header>
      <div class="grid">
        ${products.map(renderCell).join('')}
      </div>
      <footer class="page-footer">
        <span>Importadora Premium</span>
        <span class="page-footer__center">Catalogo iP</span>
        <span class="page-footer__right">Pagina ${pageIndex} / ${totalPages}</span>
      </footer>
    </article>
  `
}

export function chunkProducts(products, size = CATALOG_PAGE.productsPerPage) {
  const pages = []
  for (let i = 0; i < products.length; i += size) {
    pages.push(products.slice(i, i + size))
  }
  return pages.length > 0 ? pages : [[]]
}

/** Contenedor offscreen con estilos del preview, listo para captura. */
export function mountCatalogCaptureRoot(pageHtml, pageCss = '') {
  const host = document.createElement('div')
  host.setAttribute('data-catalog-pdf-root', 'true')
  host.style.cssText = [
    'position:fixed',
    'left:-12000px',
    'top:0',
    'width:794px',
    'margin:0',
    'padding:0',
    'background:#ffffff',
    'z-index:-1',
    'pointer-events:none',
  ].join(';')

  const style = document.createElement('style')
  style.textContent = pageCss
  host.appendChild(style)

  const wrap = document.createElement('div')
  wrap.innerHTML = pageHtml
  host.appendChild(wrap)

  document.body.appendChild(host)
  return host
}

export function unmountCatalogCaptureRoot(host) {
  if (host?.parentNode) {
    host.parentNode.removeChild(host)
  }
}

export async function waitForImages(root, timeoutMs = 12000) {
  const images = Array.from(root.querySelectorAll('img'))
  if (images.length === 0) {
    return
  }

  await Promise.all(
    images.map(
      (img) => new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve()
          return
        }
        const done = () => resolve()
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
        window.setTimeout(done, timeoutMs)
      }),
    ),
  )
}
