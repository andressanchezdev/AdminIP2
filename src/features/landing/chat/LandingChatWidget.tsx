import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { answerLandingChat, type ChatReply } from './answerChat'
import { greetingReply } from './intents'

type ChatMessage = {
  id: string
  role: 'bot' | 'user'
  reply?: ChatReply
  text: string
}

const REPLY_DELAY_MS = 700

function ChatLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  if (external || href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a className="landing-chat__action" href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    )
  }

  return (
    <Link className="landing-chat__action" to={href}>
      {label}
    </Link>
  )
}

function TypingDots() {
  return (
    <span className="landing-chat__dots" aria-label="BotIP está respondiendo">
      <span />
      <span />
      <span />
    </span>
  )
}

export function LandingChatWidget() {
  const panelId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const replyTimer = useRef<number | null>(null)
  const welcome = greetingReply()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'bot', text: welcome.text, reply: welcome },
  ])

  useEffect(() => {
    return () => {
      if (replyTimer.current) window.clearTimeout(replyTimer.current)
    }
  }, [])

  const pushQuery = (query: string) => {
    const text = query.trim()
    if (!text || typing) return

    const reply = answerLandingChat(text)
    setTyping(true)
    setDraft('')
    setMessages((current) => [...current, { id: `user-${current.length}`, role: 'user', text }])

    replyTimer.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: `bot-${current.length}`, role: 'bot', text: reply.text, reply },
      ])
      setTyping(false)
      replyTimer.current = null
    }, REPLY_DELAY_MS)
  }

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    pushQuery(draft)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    pushQuery(draft)
  }

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    body.scrollTop = body.scrollHeight
  }, [messages, open, typing])

  const toggle = () => {
    setOpen((current) => {
      const next = !current
      if (next) window.setTimeout(() => inputRef.current?.focus(), 0)
      return next
    })
  }

  return (
    <div className="landing-chat">
      {open ? (
        <section className="landing-chat__panel" id={panelId} aria-label="Hola soy BotIP">
          <header className="landing-chat__head">
            <p className="landing-chat__title">Hola soy BotIP</p>
            <button type="button" className="landing-chat__close" onClick={() => setOpen(false)} aria-label="Cerrar chat">
              ×
            </button>
          </header>

          <div className="landing-chat__body" ref={bodyRef}>
            {messages.map((message) => (
              <article key={message.id} className={`landing-chat__bubble landing-chat__bubble--${message.role}`}>
                <p>{message.text}</p>
                {message.reply?.actions.length ? (
                  <div className="landing-chat__actions">
                    {message.reply.actions.map((action) => (
                      <ChatLink key={action.label} href={action.href} label={action.label} external={action.external} />
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {typing ? (
              <article className="landing-chat__bubble landing-chat__bubble--bot" aria-live="polite">
                <TypingDots />
              </article>
            ) : null}
          </div>

          <form className="landing-chat__form" onSubmit={submit}>
            <input
              ref={inputRef}
              className="landing-chat__input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu consulta"
              aria-label="Mensaje"
              autoComplete="off"
              disabled={typing}
            />
            <button type="submit" className="landing-chat__send" disabled={!draft.trim() || typing}>
              Enviar
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="landing-chat__launcher"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        {open ? 'Cerrar' : 'Atención'}
      </button>
    </div>
  )
}
