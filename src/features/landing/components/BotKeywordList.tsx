import { useState } from 'react'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { parseKeywordList, serializeKeywordList, type BotKeywordItem } from '../chat/botSettings'

type BotKeywordListProps = {
  keywords: string
  paused?: string
  onChange: (next: { keywords: string; paused: string }) => void
}

export function BotKeywordList({ keywords, paused, onChange }: BotKeywordListProps) {
  const items = parseKeywordList(keywords, paused)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [viewing, setViewing] = useState<string | null>(null)

  const commit = (next: BotKeywordItem[]) => onChange(serializeKeywordList(next))

  const add = () => {
    const word = draft.trim().toLowerCase()
    if (!word || items.some((item) => item.word === word)) return
    commit([...items, { word, enabled: true }])
    setDraft('')
  }

  const rename = (from: string) => {
    const word = editValue.trim().toLowerCase()
    if (!word) return
    if (word !== from && items.some((item) => item.word === word)) return
    commit(items.map((item) => (item.word === from ? { ...item, word } : item)))
    setEditing(null)
    setViewing(word)
  }

  return (
    <div className="bot-keyword-list">
      <p className="content-card__subtitle">Palabras clave</p>
      {items.length === 0 ? (
        <p className="bot-keyword-list__empty">No hay palabras. Agregue una para que el bot las reconozca.</p>
      ) : (
        <ul className="bot-keyword-list__items">
          {items.map((item) => (
            <li key={item.word} className={`bot-keyword-list__item${item.enabled ? '' : ' bot-keyword-list__item--off'}`}>
              {editing === item.word ? (
                <input
                  className="admin-input"
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') rename(item.word)
                    if (event.key === 'Escape') setEditing(null)
                  }}
                />
              ) : (
                <span>{item.word}</span>
              )}
              <span className="bot-keyword-list__state">{item.enabled ? 'Activa' : 'Inactiva'}</span>
              <span className="admin-row-actions">
                <IconAction
                  label="Ver"
                  variant="view"
                  onClick={() => setViewing(viewing === item.word ? null : item.word)}
                />
                <IconAction
                  label="Editar"
                  variant="edit"
                  onClick={() => {
                    setEditing(item.word)
                    setEditValue(item.word)
                  }}
                />
                <IconAction
                  label={item.enabled ? 'Desactivar' : 'Activar'}
                  variant={item.enabled ? 'toggle-on' : 'toggle-off'}
                  onClick={() => commit(items.map((entry) => (entry.word === item.word ? { ...entry, enabled: !entry.enabled } : entry)))}
                />
                <IconAction
                  label="Retirar"
                  variant="delete"
                  onClick={() => commit(items.filter((entry) => entry.word !== item.word))}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
      {viewing ? (
        <p className="content-card__subtitle">
          Palabra: {viewing} · {items.find((item) => item.word === viewing)?.enabled ? 'el bot la usa' : 'el bot la ignora'}
        </p>
      ) : null}
      <div className="bot-keyword-list__add">
        <input
          className="admin-input"
          value={draft}
          placeholder="Nueva palabra"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add()
          }}
        />
        <button type="button" className="admin-btn" onClick={add}>
          Agregar
        </button>
      </div>
    </div>
  )
}
