import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdminAction, useAdminJobs, useAdminOrders, useAdminProjects, useAdminStats, useAdminUsers } from '@/api/admin'
import { NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { ListSkeleton, Pagination } from '@/components/States'
import { Tag } from '@/components/Tag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatCents, formatDate } from '@/lib/utils'

const TH = 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground'
const TD = 'px-4 py-3 align-top'

export function AdminPage() {
  const { t } = useTranslation()
  usePageTitle(t('admin.title'))
  return (
    <div className="container py-12 sm:py-16">
      <PageHead title={t('admin.title')} />
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          {(['overview', 'users', 'orders', 'jobs', 'projects'] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`admin.tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <Overview />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <Users />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <Orders />
        </TabsContent>
        <TabsContent value="jobs" className="mt-6">
          <Jobs />
        </TabsContent>
        <TabsContent value="projects" className="mt-6">
          <Projects />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Overview() {
  const { t, i18n } = useTranslation()
  const { data } = useAdminStats()
  if (!data) return <ListSkeleton rows={2} />
  const tiles = [
    [t('admin.revenue'), formatCents(data.revenue_c, i18n.language)],
    [t('admin.revenueMonth'), formatCents(data.revenue_month_c, i18n.language)],
    [t('admin.jobsLive'), data.jobs_live],
    [t('admin.jobsUnlocked'), data.jobs_unlocked],
    [t('admin.applications'), data.applications],
    [t('admin.applicationsMonth'), data.applications_month],
    [t('admin.projectsOpen'), data.projects_open],
    [t('admin.projectUnlocks'), data.project_unlocks],
  ]
  return (
    <div className="space-y-8">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-foreground/[0.08] bg-card p-5">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="titre mt-2 text-3xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-foreground/[0.08] bg-card p-5">
          <p className="font-semibold">{t('admin.tabs.users')}</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {Object.entries(data.users).map(([role, n]) => (
              <li key={role} className="flex justify-between">
                <span>{t(`roles.${role}`)}</span>
                <span className="font-semibold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-foreground/[0.08] bg-card p-5">
          <p className="font-semibold">{t('admin.byProduct')}</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {data.revenue_by_product.map((r) => (
              <li key={r.product} className="flex justify-between gap-4">
                <span>
                  {t(`products.${r.product}.name`)} <span className="text-muted-foreground">× {r.n}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatCents(Number(r.c), i18n.language)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Users() {
  const { t, i18n } = useTranslation()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebouncedValue(q, 300)
  const { data } = useAdminUsers({ q: debounced || undefined, role: role || undefined, page })
  const action = useAdminAction()
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder={t('admin.searchUsers')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="sm:max-w-xs" />
        <NativeSelect value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} aria-label={t('admin.role')}>
          <option value="">{t('common.all')}</option>
          {['worker', 'employer', 'client', 'provider', 'admin'].map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/[0.08] bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className={TH}>{t('admin.name')}</th>
              <th className={TH}>{t('admin.role')}</th>
              <th className={TH}>{t('billing.balance')}</th>
              <th className={TH}>{t('admin.createdAt')}</th>
              <th className={TH} />
            </tr>
          </thead>
          <tbody>
            {data?.data.map((u) => (
              <tr key={u.id} className="border-t">
                <td className={TD}>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className={TD}>
                  {t(`roles.${u.role}`)} {u.blocked && <Tag tone="red">{t('admin.blocked')}</Tag>}
                </td>
                <td className={TD}>{u.role === 'employer' || u.role === 'provider' ? u.credits : '—'}</td>
                <td className={TD}>{formatDate(u.created_at, i18n.language)}</td>
                <td className={`${TD} whitespace-nowrap text-end`}>
                  {(u.role === 'employer' || u.role === 'provider') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const n = Number(window.prompt(t('admin.grantPrompt'), '5'))
                        if (n > 0) action.mutate({ path: `users/${u.id}/credits`, body: { credits: n } })
                      }}
                    >
                      {t('admin.grant')}
                    </Button>
                  )}{' '}
                  {u.role !== 'admin' && (
                    <Button size="sm" variant="ghost" onClick={() => action.mutate({ path: `users/${u.id}/block`, body: { blocked: !u.blocked } })}>
                      {u.blocked ? t('admin.unblock') : t('admin.block')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={setPage} />}
    </div>
  )
}

function Orders() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const { data } = useAdminOrders(page)
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-foreground/[0.08] bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className={TH}>{t('billing.table.date')}</th>
              <th className={TH}>{t('admin.user')}</th>
              <th className={TH}>{t('billing.table.product')}</th>
              <th className={`${TH} text-end`}>{t('billing.table.amount')}</th>
              <th className={TH}>{t('billing.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((o) => (
              <tr key={o.id} className="border-t">
                <td className={TD}>{formatDate(o.created_at, i18n.language)}</td>
                <td className={TD}>
                  <p className="font-medium">{o.user.name}</p>
                  <p className="text-xs text-muted-foreground">{o.user.email}</p>
                </td>
                <td className={TD}>
                  {t(`products.${o.product}.name`)}
                  {o.job_post && <span className="block text-xs text-muted-foreground">{o.job_post.title}</span>}
                </td>
                <td className={`${TD} text-end tabular-nums`}>{formatCents(o.amount_c, i18n.language)}</td>
                <td className={TD}>
                  <Tag tone={o.status === 'paid' ? 'green' : o.status === 'pending' ? 'amber' : 'red'}>{t(`billing.status.${o.status}`)}</Tag> <span className="text-xs text-muted-foreground">{o.method}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={setPage} />}
    </div>
  )
}

function Jobs() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const { data } = useAdminJobs(page)
  const action = useAdminAction()
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-foreground/[0.08] bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className={TH}>{t('admin.jobTitle')}</th>
              <th className={TH}>{t('admin.status')}</th>
              <th className={TH}>{t('admin.applicants')}</th>
              <th className={TH}>{t('admin.createdAt')}</th>
              <th className={TH} />
            </tr>
          </thead>
          <tbody>
            {data?.data.map((j) => (
              <tr key={j.id} className="border-t">
                <td className={TD}>
                  <Link to={`/empleo/ofertas/${j.id}`} className="font-medium hover:text-primary">
                    {j.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{j.company.name}</p>
                </td>
                <td className={TD}>
                  <Tag tone={j.status === 'active' ? 'green' : 'red'}>{j.status === 'active' ? t('employer.active') : t('employer.closed')}</Tag> {j.unlocked && <Tag tone="blue">€</Tag>}
                </td>
                <td className={TD}>{j.applications_count}</td>
                <td className={TD}>{formatDate(j.published_at, i18n.language)}</td>
                <td className={`${TD} text-end`}>
                  {j.status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => action.mutate({ path: `jobs/${j.id}/close` })}>
                      {t('admin.close')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={setPage} />}
    </div>
  )
}

function Projects() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const { data } = useAdminProjects(page)
  const action = useAdminAction()
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-foreground/[0.08] bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className={TH}>{t('admin.jobTitle')}</th>
              <th className={TH}>{t('admin.user')}</th>
              <th className={TH}>{t('admin.status')}</th>
              <th className={TH}>{t('admin.projectUnlocks')}</th>
              <th className={TH}>{t('admin.createdAt')}</th>
              <th className={TH} />
            </tr>
          </thead>
          <tbody>
            {data?.data.map((p) => (
              <tr key={p.id} className="border-t">
                <td className={TD}>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{t(`category.${p.category}`)}</p>
                </td>
                <td className={TD}>
                  <p>{p.client.name}</p>
                  <p className="text-xs text-muted-foreground">{p.client.email}</p>
                </td>
                <td className={TD}>
                  <Tag tone={p.status === 'open' ? 'green' : 'red'}>{p.status === 'open' ? t('client.open') : t('client.closed')}</Tag>
                </td>
                <td className={TD}>
                  {p.unlocks_count} / {p.max_unlocks}
                </td>
                <td className={TD}>{formatDate(p.published_at, i18n.language)}</td>
                <td className={`${TD} text-end`}>
                  {p.status === 'open' && (
                    <Button size="sm" variant="ghost" onClick={() => action.mutate({ path: `projects/${p.id}/close` })}>
                      {t('admin.close')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={setPage} />}
    </div>
  )
}
