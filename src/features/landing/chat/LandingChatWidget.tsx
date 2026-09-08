import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { answerLandingChat, type ChatReply } from './answerChat'
import {
  commitUserMessage,
  endChatSession,
  isContextFollowUp,
  isFreshConversation,
  priorUserMessages,
  startChatSession,
} from './chatContext'
import { chatDraftError, readChatGuard, registerChatSend } from './chatGuard'
import { getBotSettings } from './botSettings'
import { greetingReply, type ChatAction } from './intents'
import { downloadLandingCatalog } from '../lib/downloadLandingCatalog'

type ChatMessage = {
  id: string
  role: 'bot' | 'user'
  reply?: ChatReply
  text: string
}

const REPLY_DELAY_MS = 700

function ChatLink({ action }: { action: ChatAction }) {
  if (action.kind === 'catalog-download') {
    return (
      <button
        type="button"
        className="landing-chat__action"
        onClick={() => {
          void downloadLandingCatalog()
        }}
      >
        {action.label}
      </button>
    )
  }

  const href = action.href || '/'
  if (action.external || href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a className="landing-chat__action" href={href} target="_blank" rel="noreferrer">
        {action.label}
      </a>
    )
  }

  return (
    <Link className="landing-chat__action" to={href}>
      {action.label}
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
  const limits = getBotSettings()
  const welcome = greetingReply()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [notice, setNotice] = useState('')
  const [blockedMessage, setBlockedMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'bot', text: welcome.text, reply: welcome },
  ])

  useEffect(() => {
    startChatSession()
    return () => {
      if (replyTimer.current) window.clearTimeout(replyTimer.current)
      endChatSession()
    }
  }, [])

  const refreshBlock = () => {
    const guard = readChatGuard()
    setBlockedMessage(guard.blocked ? guard.message : '')
    return guard.blocked
  }

  useEffect(() => {
    refreshBlock()
    const timer = window.setInterval(refreshBlock, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const pushQuery = (query: string) => {
    const text = query.trim()
    if (typing) return
    if (refreshBlock()) return

    const error = chatDraftError(text)
    if (error) {
      setNotice(error)
      return
    }

    const guard = registerChatSend(text)
    if (guard.blocked) {
      setBlockedMessage(guard.message)
      setNotice('')
      setMessages((current) => [
        ...current,
        { id: `block-${current.length}`, role: 'bot', text: guard.message },
      ])
      return
    }

    setNotice('')
    setDraft('')
    setMessages((current) => [...current, { id: `user-${current.length}`, role: 'user', text }])
    setTyping(true)

    let reply: ChatReply
    try {
      const fresh = isFreshConversation(text)
      const history = fresh ? [] : priorUserMessages(text)
      reply = answerLandingChat(text, history)
      if (fresh) commitUserMessage(text, 'clear')
      else if (isContextFollowUp(text)) commitUserMessage(text, 'append')
      else commitUserMessage(text, 'replace')
    } catch {
      reply = {
        text: 'Tuve un inconveniente al preparar la respuesta y no quiero dejarte sin una respuesta. Escríbeme de nuevo o te contacto con un asesor por WhatsApp.',
        actions: [],
      }
    }

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
                      <ChatLink key={action.label} action={action} />
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

          {blockedMessage ? <p className="landing-chat__block">{blockedMessage}</p> : null}
          {notice ? <p className="landing-chat__notice">{notice}</p> : null}

          <form className="landing-chat__form" onSubmit={submit}>
            <input
              ref={inputRef}
              className="landing-chat__input"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value.slice(0, limits.maxChars))
                if (notice) setNotice('')
              }}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu consulta"
              aria-label="Mensaje"
              autoComplete="off"
              minLength={limits.minChars}
              maxLength={limits.maxChars}
              disabled={typing || Boolean(blockedMessage)}
            />
            <button
              type="submit"
              className="landing-chat__send"
              disabled={typing || Boolean(blockedMessage) || draft.trim().length < limits.minChars}
            >
              Enviar
            </button>
          </form>
          <p className="landing-chat__count">
            {draft.trim().length}/{limits.maxChars}
          </p>
        </section>
      ) : null}

      <button
        type="button"
        className="landing-chat__launcher"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        Atención
      </button>
    </div>
  )
}
