import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePermissions } from '@/app/providers/AuthProvider'
import { ImageSourceField } from '@/features/blog/components/ImageSourceField'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { ContentBack } from './ContentBack'
import { LandingTeamAdminPage } from './LandingTeamAdminPage'
import {
  getLandingContent,
  resetLandingSection,
  saveLandingSection,
  type LandingBrandItem,
  type LandingCatalogOption,
  type LandingContent,
  type LandingSectionId,
  type LandingSplitBlock,
  type LandingStatSlide,
} from './landingContentStore'
import './LandingAdminPage.css'
import './contentStudio.css'

const VIEW_SLUG: Record<Exclude<View, 'hub'>, string> = {
  hero: 'hero',
  stats: 'cifras',
  split: 'vision',
  mission: 'mision',
  catalog: 'catalogo',
  brands: 'marcas',
  team: 'equipo',
  company: 'compania',
}

const SLUG_VIEW: Record<string, Exclude<View, 'hub'>> = {
  hero: 'hero',
  cifras: 'stats',
  vision: 'split',
  mision: 'mission',
  catalogo: 'catalog',
  marcas: 'brands',
  equipo: 'team',
  compania: 'company',
  compañia: 'company',
}

type View = 'hub' | LandingSectionId | 'team' | 'mission'

const SECTIONS: Array<{ id: Exclude<View, 'hub'>; title: string; hint: string }> = [
  { id: 'hero', title: 'Banner', hint: 'Fondo, título, subtítulo y botón del inicio.' },
  { id: 'stats', title: 'cifras', hint: 'Textos y números de la franja.' },
  { id: 'split', title: 'Visión', hint: 'Imagen y texto del bloque de visión.' },
  { id: 'mission', title: 'Misión', hint: 'Imagen y texto del bloque de misión.' },
  { id: 'catalog', title: 'Catálogo', hint: 'Título y las 6 categorías.' },
  { id: 'brands', title: 'Marcas', hint: 'Título, fondo y marcas visibles.' },
  { id: 'team', title: 'Nuestro equipo', hint: 'Personas del carrusel de asesores.' },
  { id: 'company', title: 'Nosotros', hint: 'Imagen, título y texto de la sección.' },
]

function sectionCopy(id: Exclude<View, 'hub'>) {
  return SECTIONS.find((item) => item.id === id) ?? { title: '', hint: '' }
}

function Field({
  label,
  value,
  onChange,
  disabled,
  multiline,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  multiline?: boolean
}) {
  return (
    <label className="admin-form__field">
      {label}
      {multiline ? (
        <textarea className="admin-input" value={value} disabled={disabled} rows={4} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="admin-input" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}

function EditorShell({
  heading,
  hint,
  onBack,
  onSave,
  onReset,
  canUpdate,
  colsClass,
  children,
}: {
  heading: string
  hint: string
  onBack: () => void
  onSave: () => void
  onReset: () => void
  canUpdate: boolean
  colsClass?: string
  children: ReactNode
}) {
  return (
    <div className="content-card">
      <div className="admin-toolbar">
        <ContentBack onBack={onBack} />
        <div className="landing-admin__actions">
          <button type="button" className="admin-btn admin-btn--ghost" disabled={!canUpdate} onClick={onReset}>
            Restaurar maqueta
          </button>
          <button type="button" className="admin-btn" disabled={!canUpdate} onClick={onSave}>
            Guardar sección
          </button>
        </div>
      </div>
      <h2 className="content-card__title">{heading}</h2>
      <p className="content-card__subtitle">{hint}</p>
      <div className={colsClass ? `content-studio__cols ${colsClass}` : 'content-studio__cols'}>{children}</div>
    </div>
  )
}

function SplitFields({
  value,
  disabled,
  onChange,
}: {
  value: LandingSplitBlock
  disabled: boolean
  onChange: (value: LandingSplitBlock) => void
}) {
  return (
    <>
      <section className="landing-admin__block landing-admin__block--narrow">
        <Field label="Texto alternativo" value={value.alt} disabled={disabled} onChange={(alt) => onChange({ ...value, alt })} />
        <Field label="Etiqueta" value={value.eyebrow} disabled={disabled} onChange={(eyebrow) => onChange({ ...value, eyebrow })} />
        <Field label="Título" value={value.title} disabled={disabled} onChange={(titleValue) => onChange({ ...value, title: titleValue })} />
        <Field label="Texto" value={value.text} disabled={disabled} multiline onChange={(text) => onChange({ ...value, text })} />
      </section>
      <section className="landing-admin__block">
        <h3>Imagen</h3>
        <ImageSourceField value={value.image} disabled={disabled} onChange={(image) => onChange({ ...value, image })} />
      </section>
    </>
  )
}

export function LandingAdminPage() {
  const { hasPermission } = usePermissions()
  const canUpdate = hasPermission('landing:update')
  const navigate = useNavigate()
  const { section } = useParams()
  const view: View = section ? (SLUG_VIEW[section] ?? 'hub') : 'hub'
  const [draft, setDraft] = useState<LandingContent>(() => getLandingContent())
  const heroFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (section && !SLUG_VIEW[section]) {
      navigate('/contenido/landing', { replace: true })
      return
    }
    setDraft(getLandingContent())
  }, [navigate, section])

  const open = (id: Exclude<View, 'hub'>) => {
    setDraft(getLandingContent())
    navigate(`/contenido/landing/${VIEW_SLUG[id]}`)
  }

  const back = () => {
    if (view === 'hub') {
      navigate(-1)
      return
    }
    navigate('/contenido/landing')
  }

  const save = (id: LandingSectionId) => {
    if (!canUpdate) return
    const heroBackgrounds = draft.hero.backgrounds.map((item) => item.trim()).filter(Boolean)
    if (id === 'hero' && heroBackgrounds.length === 0) {
      notifyError('Agregue al menos un fondo')
      return
    }
    if (id === 'catalog' && draft.catalog.options.length !== 6) {
      notifyError('El catálogo debe mantener 6 categorías')
      return
    }
    if (id === 'catalog' && draft.catalog.options.some((option) => !option.label.trim() || !option.images[0] || !option.images[1])) {
      notifyError('Cada categoría necesita nombre y 2 imágenes')
      return
    }
    if (id === 'hero') {
      saveLandingSection('hero', { ...draft.hero, backgrounds: heroBackgrounds })
    } else {
      saveLandingSection(id, draft[id])
    }
    notifySuccess('Sección actualizada')
    setDraft(getLandingContent())
  }

  const addHeroBackgrounds = (files: FileList | null) => {
    if (!canUpdate || !files?.length) return
    const added: string[] = []
    let failed = 0
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        failed += 1
        continue
      }
      added.push(URL.createObjectURL(file))
    }
    if (added.length) {
      setDraft((current) => ({
        ...current,
        hero: { ...current.hero, backgrounds: [...current.hero.backgrounds, ...added] },
      }))
    }
    if (failed) notifyError(failed === files.length ? 'No se pudo cargar la imagen' : 'Algunas imágenes no se pudieron cargar')
  }

  const reset = (id: LandingSectionId) => {
    if (!canUpdate) return
    const next = resetLandingSection(id)
    setDraft(next)
    notifySuccess('Sección restaurada')
  }

  const saveSplit = (part: 'vision' | 'mission') => {
    if (!canUpdate) return
    const current = getLandingContent()
    saveLandingSection('split', { ...current.split, [part]: draft.split[part] })
    notifySuccess('Sección actualizada')
    setDraft(getLandingContent())
  }

  const resetSplit = (part: 'vision' | 'mission') => {
    if (!canUpdate) return
    const current = getLandingContent()
    const other = part === 'vision' ? 'mission' : 'vision'
    const wiped = resetLandingSection('split')
    const next = saveLandingSection('split', { ...wiped.split, [other]: current.split[other] })
    setDraft(next)
    notifySuccess('Sección restaurada')
  }

  if (view === 'team') {
    return (
      <div className="content-studio">
        <div className="content-card">
          <LandingTeamAdminPage onBack={back} />
        </div>
      </div>
    )
  }

  if (view === 'hub') {
    return (
      <div className="content-studio">
        <div className="content-card">
          <div className="admin-toolbar">
            <ContentBack onBack={back} />
          </div>
          <div className="landing-admin__grid">
            {SECTIONS.map((item) => (
              <button key={item.id} type="button" className="landing-admin__card" onClick={() => open(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const shell = (node: ReactNode) => <div className="content-studio">{node}</div>

  if (view === 'hero') {
    return shell(
      <EditorShell heading={sectionCopy('hero').title} hint={sectionCopy('hero').hint} onBack={back} onSave={() => save('hero')} onReset={() => reset('hero')} canUpdate={canUpdate} colsClass="content-studio__cols--hero">
        <section className="landing-admin__block">
          <h3>Textos</h3>
          <Field label="Título" value={draft.hero.title} disabled={!canUpdate} onChange={(title) => setDraft({ ...draft, hero: { ...draft.hero, title } })} />
          <Field label="Subtítulo" value={draft.hero.subtitle} disabled={!canUpdate} multiline onChange={(subtitle) => setDraft({ ...draft, hero: { ...draft.hero, subtitle } })} />
          <Field label="Botón" value={draft.hero.cta} disabled={!canUpdate} onChange={(cta) => setDraft({ ...draft, hero: { ...draft.hero, cta } })} />
        </section>
        <section className="landing-admin__block">
          <h3>Imágenes</h3>
          {draft.hero.backgrounds.map((src, index) => (
            <ImageSourceField
              key={`hero-bg-${index}`}
              value={src}
              disabled={!canUpdate}
              asObjectUrl
              onChange={(value) => {
                const backgrounds = [...draft.hero.backgrounds]
                const previous = backgrounds[index]
                if (previous && previous !== value && previous.startsWith('blob:')) {
                  URL.revokeObjectURL(previous)
                }
                if (!value.trim()) {
                  backgrounds.splice(index, 1)
                } else {
                  backgrounds[index] = value
                }
                setDraft({ ...draft, hero: { ...draft.hero, backgrounds } })
              }}
            />
          ))}
          <input
            ref={heroFileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={!canUpdate}
            onChange={(event) => {
              addHeroBackgrounds(event.target.files)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            className="admin-btn"
            disabled={!canUpdate}
            onClick={() => heroFileRef.current?.click()}
          >
            Agregar imagen
          </button>
        </section>
        
      </EditorShell>
    )
  }

  if (view === 'stats') {
    const updateSlide = (id: string, patch: Partial<LandingStatSlide>) => {
      setDraft({
        ...draft,
        stats: draft.stats.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      })
    }
    return shell(
      <EditorShell heading={sectionCopy('stats').title} hint={sectionCopy('stats').hint} onBack={back} onSave={() => save('stats')} onReset={() => reset('stats')} canUpdate={canUpdate} colsClass="content-studio__cols--cifras">
        {draft.stats.map((item, index) => (
          <section key={item.id} className="landing-admin__block landing-admin__block--compact">
            <h3>Cifra {index + 1}</h3>
            <Field label="Texto inicial" value={item.lead} disabled={!canUpdate} onChange={(lead) => updateSlide(item.id, { lead })} />
            <Field label="Número" value={String(item.value)} disabled={!canUpdate} onChange={(value) => updateSlide(item.id, { value: Number(value.replace(/\D/g, '')) || 0 })} />
            <Field label="Texto final" value={item.trail} disabled={!canUpdate} onChange={(trail) => updateSlide(item.id, { trail })} />
          </section>
        ))}
      </EditorShell>
    )
  }

  if (view === 'split' || view === 'mission') {
    const part = view === 'mission' ? 'mission' : 'vision'
    const copy = sectionCopy(part === 'mission' ? 'mission' : 'split')
    return shell(
      <EditorShell
        heading={copy.title}
        hint={copy.hint}
        onBack={back}
        onSave={() => saveSplit(part)}
        onReset={() => resetSplit(part)}
        canUpdate={canUpdate}
        colsClass="content-studio__cols--marcas"
      >
        <SplitFields
          value={draft.split[part]}
          disabled={!canUpdate}
          onChange={(value) => setDraft({ ...draft, split: { ...draft.split, [part]: value } })}
        />
      </EditorShell>
    )
  }

  if (view === 'catalog') {
    const updateOption = (id: string, patch: Partial<LandingCatalogOption>) => {
      setDraft({
        ...draft,
        catalog: {
          ...draft.catalog,
          options: draft.catalog.options.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        },
      })
    }
    return shell(
      <EditorShell heading={sectionCopy('catalog').title} hint={sectionCopy('catalog').hint} onBack={back} onSave={() => save('catalog')} onReset={() => reset('catalog')} canUpdate={canUpdate}>
        <section className="landing-admin__block">
          <h3>Título</h3>
          <Field label="Título de la sección" value={draft.catalog.title} disabled={!canUpdate} onChange={(title) => setDraft({ ...draft, catalog: { ...draft.catalog, title } })} />
        </section>
        {draft.catalog.options.map((option) => (
          <section key={option.id} className="landing-admin__block">
            <h3>{option.label || 'Categoría'}</h3>
            <div className="landing-admin__list-row">
              <input
                className="admin-input"
                aria-label="Nombre de la categoría"
                placeholder="Nombre"
                value={option.label}
                disabled={!canUpdate}
                onChange={(event) => updateOption(option.id, { label: event.target.value })}
              />
              <div className="landing-admin__list-stack">
                <ImageSourceField
                  value={option.images[0]}
                  disabled={!canUpdate}
                  onChange={(src) => updateOption(option.id, { images: [src, option.images[1]] })}
                />
                <ImageSourceField
                  value={option.images[1]}
                  disabled={!canUpdate}
                  onChange={(src) => updateOption(option.id, { images: [option.images[0], src] })}
                />
              </div>
            </div>
          </section>
        ))}
        <section className="landing-admin__block">
          <h3>Botón</h3>
          <Field label="Texto del botón" value={draft.catalog.cta} disabled={!canUpdate} onChange={(cta) => setDraft({ ...draft, catalog: { ...draft.catalog, cta } })} />
        </section>
      </EditorShell>
    )
  }

  if (view === 'brands') {
    const updateBrand = (id: string, patch: Partial<LandingBrandItem>) => {
      setDraft({
        ...draft,
        brands: {
          ...draft.brands,
          items: draft.brands.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        },
      })
    }
    return shell(
      <EditorShell heading={sectionCopy('brands').title} hint={sectionCopy('brands').hint} onBack={back} onSave={() => save('brands')} onReset={() => reset('brands')} canUpdate={canUpdate} colsClass="content-studio__cols--marcas">
        <section className="landing-admin__block">
          <h3>Título</h3>
          <Field label="Título" value={draft.brands.title} disabled={!canUpdate} onChange={(title) => setDraft({ ...draft, brands: { ...draft.brands, title } })} />
          <Field label="Texto" value={draft.brands.lead} disabled={!canUpdate} multiline onChange={(lead) => setDraft({ ...draft, brands: { ...draft.brands, lead } })} />
          <ImageSourceField value={draft.brands.background} disabled={!canUpdate} onChange={(background) => setDraft({ ...draft, brands: { ...draft.brands, background } })} />
        </section>
        <section className="landing-admin__block">
          <h3>Marcas</h3>
          {draft.brands.items.map((item) => (
            <div key={item.id} className="landing-admin__list-row">
              <input
                className="admin-input"
                aria-label="Nombre de la marca"
                placeholder="Nombre"
                value={item.name}
                disabled={!canUpdate}
                onChange={(event) => updateBrand(item.id, { name: event.target.value })}
              />
              <ImageSourceField value={item.url} disabled={!canUpdate} onChange={(url) => updateBrand(item.id, { url })} />
              <label className="landing-admin__list-check">
                <input
                  type="checkbox"
                  checked={item.visible}
                  disabled={!canUpdate}
                  onChange={(event) => updateBrand(item.id, { visible: event.target.checked })}
                />{' '}
                Mostrar
              </label>
            </div>
          ))}
          <div className="landing-admin__actions">
            <button
              type="button"
              className="admin-btn"
              disabled={!canUpdate}
              onClick={() => {
                const item: LandingBrandItem = { id: `marca-${Date.now()}`, name: 'Nueva marca', url: '', visible: false }
                setDraft({ ...draft, brands: { ...draft.brands, items: [...draft.brands.items, item] } })
              }}
            >
              Agregar marca
            </button>
          </div>
        </section>
      </EditorShell>
    )
  }

  return shell(
    <EditorShell heading={sectionCopy('company').title} hint={sectionCopy('company').hint} onBack={back} onSave={() => save('company')} onReset={() => reset('company')} canUpdate={canUpdate} colsClass="content-studio__cols--marcas">
      <section className="landing-admin__block landing-admin__block--narrow">
        <h3>Nosotros</h3>
        <Field label="Texto alternativo" value={draft.company.alt} disabled={!canUpdate} onChange={(alt) => setDraft({ ...draft, company: { ...draft.company, alt } })} />
        <Field label="Etiqueta" value={draft.company.eyebrow} disabled={!canUpdate} onChange={(eyebrow) => setDraft({ ...draft, company: { ...draft.company, eyebrow } })} />
        <Field label="Título" value={draft.company.title} disabled={!canUpdate} onChange={(title) => setDraft({ ...draft, company: { ...draft.company, title } })} />
        <Field label="Texto" value={draft.company.text} disabled={!canUpdate} multiline onChange={(text) => setDraft({ ...draft, company: { ...draft.company, text } })} />
        <Field label="Botón" value={draft.company.cta} disabled={!canUpdate} onChange={(cta) => setDraft({ ...draft, company: { ...draft.company, cta } })} />
      </section>
      <section className="landing-admin__block">
        <h3>Imagen</h3>
        <ImageSourceField value={draft.company.image} disabled={!canUpdate} onChange={(image) => setDraft({ ...draft, company: { ...draft.company, image } })} />
      </section>
    </EditorShell>
  )
}
