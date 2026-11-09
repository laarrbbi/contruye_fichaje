import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Coins, Sparkles } from 'lucide-react'
import { useUser } from '@/api/auth'
import { useMovements, useOrders } from '@/api/billing'
import { useOwnJobs } from '@/api/empleo'
import { NativeSelect } from '@/components/Field'
import { PageHead, SectionLabel } from '@/components/PageHead'
import { PlanCard, useBuy, useProducts } from '@/components/Paywall'
import { Tag } from '@/components/Tag'
import { Card, CardContent } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatCents, formatDate } from '@/lib/utils'

/** What a paying account buys and has bought. Employers and providers alike. */
export function BillingPage() {
  const { t, i18n } = useTranslation()
  const { data: user } = useUser()
  const employer = user?.role === 'employer'
  usePageTitle(employer ? t('billing.titleEmployer') : t('billing.titleProvider'))
  const products = useProducts(employer ? 'employer' : 'provider')
  const { data: orders } = useOrders()
  const { data: movements } = useMovements()
  const { data: jobs } = useOwnJobs(employer)
  const { buy, pending, error } = useBuy()
  const liveJobs = (jobs ?? []).filter((j) => j.status === 'active')
  const [jobId, setJobId] = useState<number | ''>('')
  const chosen = jobId || liveJobs[0]?.id
  const pass = user?.pass_until && new Date(user.pass_until) > new Date() ? user.pass_until : null

  const offerProducts = products.filter((p) => p.needs_offer)
  const otherProducts = products.filter((p) => !p.needs_offer)

  return (
    <div className="container py-12 sm:py-16">
      <PageHead title={employer ? t('billing.titleEmployer') : t('billing.titleProvider')} lead={employer ? t('billing.leadEmployer') : t('billing.leadProvider')} />

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-or/20 text-or-fonce">
              <Coins className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('billing.balance')}</p>
              <p className="titre text-2xl">{employer ? t('common.contacts', { count: user?.credits ?? 0 }) : t('common.credits', { count: user?.credits ?? 0 })}</p>
            </div>
          </CardContent>
        </Card>
        {employer && (
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('billing.pass')}</p>
                <p className="titre text-xl">{pass ? t('billing.passUntil', { date: formatDate(pass, i18n.language) }) : t('billing.passNone')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {employer && offerProducts.length > 0 && (
        <section className="mt-12">
          <SectionLabel>{t('billing.chooseOffer')}</SectionLabel>
          <p className="mt-3 text-sm text-muted-foreground">{t('billing.chooseOfferHint')}</p>
          {liveJobs.length ? (
            <>
              <div className="mt-4 max-w-md">
                <NativeSelect aria-label={t('billing.chooseOffer')} value={String(chosen ?? '')} onChange={(e) => setJobId(Number(e.target.value))}>
                  {liveJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:max-w-4xl">
                {offerProducts.map((p) => (
                  <PlanCard key={p.key} product={p} highlight={p.featured} busy={pending === p.key} onBuy={() => chosen && buy(p.key, chosen)} />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm">{t('billing.noOffers')}</p>
          )}
        </section>
      )}

      <section className="mt-12">
        {employer && <SectionLabel>{t('products.employer_pass.name')} · {t('products.contacts_10.name')}</SectionLabel>}
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {otherProducts.map((p, i) => (
            <PlanCard key={p.key} product={p} highlight={employer ? p.pass : i === 1} busy={pending === p.key} onBuy={() => buy(p.key)} />
          ))}
        </div>
      </section>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <section>
          <SectionLabel>{t('billing.orders')}</SectionLabel>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/[0.08] bg-card">
            {!orders?.length ? (
              <p className="p-6 text-sm text-muted-foreground">{t('billing.noOrders')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-start text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start">{t('billing.table.date')}</th>
                    <th className="px-4 py-3 text-start">{t('billing.table.product')}</th>
                    <th className="px-4 py-3 text-end">{t('billing.table.amount')}</th>
                    <th className="px-4 py-3 text-start">{t('billing.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(o.created_at, i18n.language)}</td>
                      <td className="px-4 py-3">
                        {t(`products.${o.product}.name`)}
                        {o.job_post && <span className="block text-xs text-muted-foreground">{o.job_post.title}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-end font-medium tabular-nums">{formatCents(o.amount_c, i18n.language)}</td>
                      <td className="px-4 py-3">
                        <Tag tone={o.status === 'paid' ? 'green' : o.status === 'pending' ? 'amber' : 'red'}>{t(`billing.status.${o.status}`)}</Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section>
          <SectionLabel>{t('billing.movements')}</SectionLabel>
          <div className="mt-4 rounded-2xl border border-foreground/[0.08] bg-card">
            {!movements?.length ? (
              <p className="p-6 text-sm text-muted-foreground">{t('billing.noMovements')}</p>
            ) : (
              <ul>
                {movements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm last:border-0">
                    <div>
                      <p>{t(`billing.reason.${m.reason}`)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(m.at, i18n.language)}</p>
                    </div>
                    <span className={m.delta > 0 ? 'font-semibold text-success' : 'font-semibold text-foreground/70'}>
                      {m.delta > 0 ? '+' : ''}
                      {m.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
