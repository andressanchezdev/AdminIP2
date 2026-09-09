import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BOT_REPLY_FIELDS,
  DEFAULT_BOT_SETTINGS,
  getBotSettings,
  saveBotSettings,
  type BotSettings,
} from './chat/botSettings'
import { notifySuccess } from '@/shared/lib/notify'
import { ContentBack } from './ContentBack'
import { BotKeywordList } from './components/BotKeywordList'
import { BotReplyPreview } from './components/BotReplyPreview'
import './BotIpAdminPage.css'
import './contentStudio.css'
import './LandingAdminPage.css'

const LIMITS_ID = 'limites'

const BOT_GROUPS: Array<{ id: string; title: string; hint: string; ids: string[] }> = [
  {
    id: 'catalogo',
    title: 'Catálogo y productos',
    hint: 'Respuestas cuando el visitante pide pieza, marca o catálogo.',
    ids: ['catalog', 'product', 'parts', 'namedPart', 'accessory'],
  },
  {
    id: 'atencion',
    title: 'Atención y contacto',
    hint: 'Asesor, WhatsApp, precio, vacantes y datos de la empresa.',
    ids: ['attention', 'whatsapp', 'complaint', 'quote', 'vacancy', 'location', 'company', 'social'],
  },
  {
    id: 'equipo',
    title: 'Equipo',
    hint: 'Nombres, grupos y sugerencias del carrusel.',
    ids: ['teamMember', 'teamGroup', 'teamSuggest', 'teamEmpty'],
  },
  {
    id: 'sin-coincidencia',
    title: 'Sin coincidencia',
    hint: 'Cuando falta la pieza, la marca o el modelo.',
    ids: ['fallback', 'fallbackCompany', 'fallbackShort', 'fallbackLong', 'fallbackWide', 'fallbackMixed'],
  },
  {
    id: 'conversacion',
    title: 'Saludo y temas no admitidos',
    hint: 'Saludo, cierre y mensajes que no son una consulta.',
    ids: ['greeting', 'thanks', 'insult', 'sexual', 'violence', 'food', 'creature', 'vehicle', 'person'],
  },
]

const REPLY_GROUPS = (() => {
  const used = new Set(BOT_GROUPS.flatMap((group) => group.ids))
  const rest = BOT_REPLY_FIELDS.filter((field) => !used.has(field.id)).map((field) => field.id)
  return rest.length
    ? [...BOT_GROUPS, { id: 'otras', title: 'Otras respuestas', hint: 'Respuestas que no están en un grupo.', ids: rest }]
    : BOT_GROUPS
})()

const HUB_ITEMS: Array<{ id: string; title: string; hint: string }> = [
  { id: LIMITS_ID, title: 'Límites del chat', hint: 'Bienvenida, largo del mensaje y bloqueo por ráfaga.' },
  ...REPLY_GROUPS,
]

const HUB_IDS = new Set(HUB_ITEMS.map((item) => item.id))

function clampSettings(form: BotSettings): BotSettings {
  return {
    ...form,
    minChars: Math.max(1, Number(form.minChars) || 3),
    maxChars: Math.max(3, Number(form.maxChars) || 250),
    blockMinutes: Math.max(1, Number(form.blockMinutes) || 5),
    burstLimit: Math.max(2, Number(form.burstLimit) || 8),
  }
}

export function BotIpAdminPage() {
  const navigate = useNavigate()
  const { section } = useParams()
  const [form, setForm] = useState<BotSettings>(() => getBotSettings())
  const group = REPLY_GROUPS.find((item) => item.id === section)
  const hubItem = HUB_ITEMS.find((item) => item.id === section)

  useEffect(() => {
    if (section && !HUB_IDS.has(section)) {
      navigate('/contenido/bot', { replace: true })
      return
    }
    setForm(getBotSettings())
  }, [navigate, section])

  const save = () => {
    const next = clampSettings(form)
    saveBotSettings(next)
    setForm(next)
    notifySuccess('BotIP actualizado')
  }

  const restore = () => {
    const current = getBotSettings()
    const defaults = DEFAULT_BOT_SETTINGS
    let next = current
    if (section === LIMITS_ID) {
      next = {
        ...current,
        minChars: defaults.minChars,
        maxChars: defaults.maxChars,
        blockMinutes: defaults.blockMinutes,
        burstLimit: defaults.burstLimit,
        welcome: defaults.welcome,
      }
    } else if (group) {
      const replies = { ...current.replies }
      for (const id of group.ids) {
        replies[id] = { ...defaults.replies[id] }
      }
      next = { ...current, replies }
    }
    saveBotSettings(next)
    setForm(next)
    notifySuccess('Valores por defecto restaurados')
  }

  const setReply = (id: string, patch: Partial<{ text: string; keywords: string; paused: string }>) => {
    setForm((current) => ({
      ...current,
      replies: {
        ...current.replies,
        [id]: { ...current.replies[id], ...patch },
      },
    }))
  }

  const back = () => {
    if (!section) {
      navigate(-1)
      return
    }
    navigate('/contenido/bot')
  }

  if (!section) {
    return (
      <div className="content-studio">
        <div className="content-card">
          <ContentBack onBack={back} />
          <div className="landing-admin__grid">
            {HUB_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="landing-admin__card"
                onClick={() => navigate(`/contenido/bot/${item.id}`)}
              >
                <strong>{item.title}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const fields = (group?.ids ?? [])
    .map((id) => BOT_REPLY_FIELDS.find((field) => field.id === id))
    .filter((field): field is (typeof BOT_REPLY_FIELDS)[number] => Boolean(field))

  return (
    <section className="content-studio">
      <div className="content-card">
        <div className="admin-toolbar">
          <ContentBack onBack={back} />
          <div className="landing-admin__actions">
            <button type="button" className="admin-btn" onClick={save}>Guardar</button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={restore}>Restaurar valores por defecto</button>
          </div>
        </div>
        <h2 className="content-card__title">{hubItem?.title ?? 'Gestión botIP'}</h2>
        <div className={section === LIMITS_ID ? 'content-studio__cols content-studio__cols--limites' : 'content-studio__cols'}>
          {section === LIMITS_ID ? (
            <>
              <section className="landing-admin__block">
                <h3>Reglas para la respuesta</h3>
                <div className="bot-limits">
                  <div className="bot-limits__row">
                    <label className="admin-form__field">
                      Mínimo de caracteres
                      <input className="admin-input" type="number" value={form.minChars} onChange={(event) => setForm({ ...form, minChars: Number(event.target.value) })} />
                    </label>
                    <label className="admin-form__field">
                      Máximo de caracteres
                      <input className="admin-input" type="number" value={form.maxChars} onChange={(event) => setForm({ ...form, maxChars: Number(event.target.value) })} />
                    </label>
                  </div>
                  <div className="bot-limits__row">
                    <label className="admin-form__field">
                      Tiempo de bloqueo
                      <input className="admin-input" type="number" value={form.blockMinutes} onChange={(event) => setForm({ ...form, blockMinutes: Number(event.target.value) })} />
                    </label>
                    <label className="admin-form__field">
                      Límite de mensajes
                      <input className="admin-input" type="number" value={form.burstLimit} onChange={(event) => setForm({ ...form, burstLimit: Number(event.target.value) })} />
                    </label>
                  </div>
                </div>
              </section>
              <section className="landing-admin__block">
                <h3>Mensaje de bienvenida</h3>
                <BotReplyPreview
                  previewLabel="Así lo verá el visitante"
                  title="Editar mensaje"
                  value={form.welcome}
                  onChange={(welcome) => setForm({ ...form, welcome })}
                />
              </section>
            </>
          ) : (
            fields.map((field) => (
              <div key={field.id} className="landing-admin__block">
                <h3>{field.label}</h3>
                <div className="content-studio__split">
                  <BotKeywordList
                    keywords={form.replies[field.id]?.keywords ?? ''}
                    paused={form.replies[field.id]?.paused}
                    onChange={(next) => setReply(field.id, next)}
                  />
                  <BotReplyPreview
                    value={form.replies[field.id]?.text ?? ''}
                    onChange={(text) => setReply(field.id, { text })}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
