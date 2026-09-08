import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BOT_REPLY_FIELDS,
  getBotSettings,
  resetBotSettings,
  saveBotSettings,
  type BotSettings,
} from './chat/botSettings'
import { notifySuccess } from '@/shared/lib/notify'
import { ContentBack } from './ContentBack'
import './BotIpAdminPage.css'
import './contentStudio.css'

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

export function BotIpAdminPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<BotSettings>(() => getBotSettings())

  const save = () => {
    const next = {
      ...form,
      minChars: Math.max(1, Number(form.minChars) || 3),
      maxChars: Math.max(3, Number(form.maxChars) || 250),
      blockMinutes: Math.max(1, Number(form.blockMinutes) || 5),
      burstLimit: Math.max(2, Number(form.burstLimit) || 8),
    }
    saveBotSettings(next)
    setForm(next)
    notifySuccess('BotIP actualizado')
  }

  const restore = () => {
    resetBotSettings()
    setForm(getBotSettings())
    notifySuccess('Valores por defecto restaurados')
  }

  const setReply = (id: string, key: 'text' | 'keywords', value: string) => {
    setForm((current) => ({
      ...current,
      replies: {
        ...current.replies,
        [id]: { ...current.replies[id], [key]: value },
      },
    }))
  }

  return (
    <section className="content-studio">
      <ContentBack onBack={() => navigate(-1)} />
      <details className="content-accordion">
        <summary className="content-accordion__trigger">Límites del chat</summary>
        <div className="content-accordion__panel">
          <label>
            Mensaje de bienvenida
            <textarea className="admin-input" value={form.welcome} onChange={(event) => setForm({ ...form, welcome: event.target.value })} />
          </label>
          <label>
            Mínimo de caracteres
            <input className="admin-input" type="number" value={form.minChars} onChange={(event) => setForm({ ...form, minChars: Number(event.target.value) })} />
          </label>
          <label>
            Máximo de caracteres
            <input className="admin-input" type="number" value={form.maxChars} onChange={(event) => setForm({ ...form, maxChars: Number(event.target.value) })} />
          </label>
          <label>
            Bloqueo (minutos)
            <input className="admin-input" type="number" value={form.blockMinutes} onChange={(event) => setForm({ ...form, blockMinutes: Number(event.target.value) })} />
          </label>
          <label>
            Mensajes seguidos antes de bloquear
            <input className="admin-input" type="number" value={form.burstLimit} onChange={(event) => setForm({ ...form, burstLimit: Number(event.target.value) })} />
          </label>
        </div>
      </details>
      {[
        ...BOT_GROUPS,
        ...(() => {
          const used = new Set(BOT_GROUPS.flatMap((group) => group.ids))
          const rest = BOT_REPLY_FIELDS.filter((field) => !used.has(field.id)).map((field) => field.id)
          return rest.length ? [{ id: 'otras', title: 'Otras respuestas', hint: 'Respuestas que no están en un grupo.', ids: rest }] : []
        })(),
      ].map((group) => {
        const fields = group.ids
          .map((id) => BOT_REPLY_FIELDS.find((field) => field.id === id))
          .filter((field): field is (typeof BOT_REPLY_FIELDS)[number] => Boolean(field))
        return (
          <details key={group.id} className="content-accordion">
            <summary className="content-accordion__trigger">{group.title}</summary>
            <div className="content-accordion__panel">
              <p className="content-card__subtitle content-accordion__hint">{group.hint}</p>
              {fields.map((field) => (
                <div key={field.id} className="content-accordion__field">
                  <h3 className="content-card__title content-accordion__name">{field.label}</h3>
                  <label>
                    Palabras clave
                    <input
                      className="admin-input"
                      value={form.replies[field.id]?.keywords ?? ''}
                      onChange={(event) => setReply(field.id, 'keywords', event.target.value)}
                    />
                  </label>
                  <label>
                    Respuesta
                    <textarea
                      className="admin-input"
                      value={form.replies[field.id]?.text ?? ''}
                      onChange={(event) => setReply(field.id, 'text', event.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </details>
        )
      })}
      <div className="content-studio__actions">
        <button type="button" className="admin-btn" onClick={save}>Guardar</button>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={restore}>Restaurar valores por defecto</button>
      </div>
    </section>
  )
}
