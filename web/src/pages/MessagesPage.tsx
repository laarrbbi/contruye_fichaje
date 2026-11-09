import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MessageSquare, Phone, Send } from 'lucide-react'
import { useUser } from '@/api/auth'
import { useConversation, useConversations, useSendMessage } from '@/api/chat'
import type { Conversation } from '@/api/types'
import { Avatar } from '@/components/Avatar'
import { ListSkeleton } from '@/components/States'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn, formatDate, formatRelative, intlLocale } from '@/lib/utils'

/**
 * The chats: the list on one side, the open one on the other (one at a time
 * on a phone). Polled, not pushed: a new message shows within seconds.
 */
export function MessagesPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('chat.title'))
  const { id } = useParams()
  const openId = id ? Number(id) : undefined
  const { data: user } = useUser()
  const { data: conversations, isLoading } = useConversations()

  const emptyHint = user ? t(`chat.empty${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`, { defaultValue: '' }) : ''

  return (
    <div className="container py-6 sm:py-10">
      <div className="grid h-[calc(100svh-9rem)] min-h-[32rem] overflow-hidden rounded-3xl border border-foreground/[0.08] bg-card shadow-[0_40px_80px_-50px_rgb(20_26_34/0.45)] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className={cn('flex min-h-0 flex-col border-e', openId && 'max-lg:hidden')}>
          <div className="border-b px-5 py-4">
            <h1 className="titre text-2xl">{t('chat.title')}</h1>
          </div>
          <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4">
                <ListSkeleton rows={4} className="h-16" />
              </div>
            ) : !conversations?.length ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="font-semibold">{t('chat.empty')}</p>
                {emptyHint && <p className="text-sm text-muted-foreground">{emptyHint}</p>}
              </div>
            ) : (
              <ul>
                {conversations.map((c) => (
                  <li key={c.id}>
                    <ConversationRow conversation={c} active={c.id === openId} lang={i18n.language} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <section className={cn('flex min-h-0 flex-col', !openId && 'max-lg:hidden')}>
          {openId ? <Thread id={openId} /> : <p className="m-auto text-muted-foreground">{t('chat.pick')}</p>}
        </section>
      </div>
    </div>
  )
}

function ConversationRow({ conversation: c, active, lang }: { conversation: Conversation; active: boolean; lang: string }) {
  const { t } = useTranslation()
  return (
    <Link to={`/mensajes/${c.id}`} className={cn('flex gap-3 border-b px-5 py-4 transition-colors', active ? 'bg-primary/[0.06]' : 'hover:bg-secondary/60')}>
      <Avatar initials={c.other.initials} className="h-11 w-11" tone={c.unread ? 'amber' : 'blue'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('truncate text-sm', c.unread ? 'font-bold' : 'font-semibold')}>{c.other.name}</p>
          <span className="shrink-0 text-[0.6875rem] text-muted-foreground">{formatRelative(c.last_message?.at ?? c.created_at, lang)}</span>
        </div>
        {c.context && <p className="truncate text-xs text-primary">{c.context.title}</p>}
        <p className={cn('truncate text-[0.8125rem]', c.unread ? 'text-foreground' : 'text-muted-foreground')}>
          {c.last_message ? `${c.last_message.mine ? `${t('chat.you')}: ` : ''}${c.last_message.body}` : t('chat.started', { date: formatDate(c.created_at, lang) })}
        </p>
      </div>
      {c.unread > 0 && <span className="mt-1 grid h-5 min-w-[1.25rem] place-items-center self-start rounded-full bg-or px-1.5 text-[0.6875rem] font-bold text-plume">{c.unread}</span>}
    </Link>
  )
}

function Thread({ id }: { id: number }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useConversation(id)
  const send = useSendMessage(id)
  const [body, setBody] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const count = data?.data.length ?? 0

  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [count])

  useEffect(() => setBody(''), [id])

  if (isLoading) return <div className="p-6"><ListSkeleton rows={3} className="h-16" /></div>
  if (isError || !data) return <p className="m-auto text-muted-foreground">{t('chat.notFound')}</p>

  const c = data.conversation
  const contextLink = c.context?.type === 'job' ? `/empleo/ofertas/${c.context.id}` : null
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = body.trim()
    if (!text || send.isPending) return
    send.mutate(text, { onSuccess: () => setBody('') })
  }

  // Messages grouped by day.
  let lastDay = ''
  const dayFmt = new Intl.DateTimeFormat(intlLocale(i18n.language), { weekday: 'long', day: 'numeric', month: 'long' })
  const timeFmt = new Intl.DateTimeFormat(intlLocale(i18n.language), { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => navigate('/mensajes')} aria-label={t('chat.back')}>
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
        </Button>
        <Avatar initials={c.other.initials} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{c.other.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {c.other.name !== c.other.person && `${c.other.person} · `}
            {c.context && (contextLink ? <Link to={contextLink} className="text-primary hover:underline">{t('chat.about', { title: c.context.title })}</Link> : t('chat.about', { title: c.context.title }))}
          </p>
        </div>
        {c.other.phone && (
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${c.other.phone}`}>
              <Phone className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('common.call')}</span>
            </a>
          </Button>
        )}
      </header>
      <div ref={scroller} className="chat-scroll min-h-0 flex-1 space-y-2 overflow-y-auto bg-papier-50 px-4 py-5 sm:px-6" aria-live="polite">
        <p className="mb-4 text-center text-xs text-muted-foreground">{t('chat.started', { date: formatDate(c.created_at, i18n.language) })}</p>
        {data.data.map((m) => {
          const day = dayFmt.format(new Date(m.at))
          const header = day !== lastDay
          lastDay = day
          return (
            <div key={m.id}>
              {header && <p className="my-4 text-center text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">{day}</p>}
              <div className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed shadow-sm', m.mine ? 'rounded-ee-md bg-primary text-primary-foreground' : 'rounded-es-md border border-foreground/[0.06] bg-card')}>
                  <p className="bidi-auto whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn('mt-1 text-end text-[0.6875rem]', m.mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{timeFmt.format(new Date(m.at))}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <form onSubmit={submit} className="flex items-end gap-2 border-t bg-card p-3 sm:p-4">
        <label htmlFor="chat-body" className="sr-only">
          {t('chat.placeholder')}
        </label>
        <textarea
          id="chat-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={t('chat.placeholder')}
          className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-[0.9375rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="accent" size="icon" className="h-11 w-11 shrink-0 rounded-xl" disabled={!body.trim() || send.isPending} aria-label={t('chat.send')}>
          <Send className="h-4 w-4 rtl:-scale-x-100" />
        </Button>
      </form>
    </>
  )
}
