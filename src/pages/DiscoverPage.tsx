import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../data/MockStore'
import { estimateCharge } from '../data/models'
import {
  EmptyState,
  PageHeader,
  PriceBreakdown,
  StatusBadge,
} from '../components/ui/Primitives'
import { supportLabel } from '../lib/format'

function supportTone(
  status: 'active' | 'expired' | 'none' | 'not-required',
): 'ok' | 'warn' | 'muted' | 'info' {
  if (status === 'active') return 'ok'
  if (status === 'expired') return 'warn'
  if (status === 'not-required') return 'info'
  return 'muted'
}

export function DiscoverPage() {
  const { models } = useMockStore()
  const [q, setQ] = useState('')
  const [supportOnly, setSupportOnly] = useState<'all' | 'yes' | 'no'>('all')

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (m.publishStatus !== 'published') return false
      const hay =
        `${m.name} ${m.summary} ${m.description} ${m.creatorName} ${m.serviceLabel}`.toLowerCase()
      if (q && !hay.includes(q.trim().toLowerCase())) return false
      if (supportOnly === 'yes' && !m.supportRequired) return false
      if (supportOnly === 'no' && m.supportRequired) return false
      return true
    })
  }, [models, q, supportOnly])

  return (
    <div>
      <PageHeader
        title="کشف مدل‌ها"
        description="فقط منتشرشده توسط سازنده — جستجو روی توضیح ارزش · قیمت Base + Creator Markup · Featured فعلاً نیست"
      />

      <div className="filter-bar panel">
        <div className="field">
          <label htmlFor="search">جستجو</label>
          <input
            id="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="نام، مدل‌ساز، توضیح ارزش…"
          />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="support">پشتیبانی تعریف شده؟</label>
          <select
            id="support"
            value={supportOnly}
            onChange={(e) => setSupportOnly(e.target.value as typeof supportOnly)}
          >
            <option value="all">همه</option>
            <option value="yes">دارد</option>
            <option value="no">ندارد</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="مدلی با این شرایط پیدا نشد"
          hint="فیلتر را تغییر دهید یا پاک کنید."
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setQ('')
                setSupportOnly('all')
              }}
            >
              پاک کردن فیلتر
            </button>
          }
        />
      ) : (
        <div className="grid-cards">
          {filtered.map((m) => {
            const charge = estimateCharge(m)
            return (
              <article key={m.id} className="catalog-card">
                <div className="stack" style={{ gap: 4 }}>
                  <h3>{m.name}</h3>
                  <span className="meta">
                    {m.creatorName} · {m.serviceLabel}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{m.summary}</p>
                <div className="btn-row" style={{ marginTop: 0 }}>
                  <StatusBadge tone={supportTone(m.supportPlanStatus)}>
                    {supportLabel(m.supportPlanStatus)}
                  </StatusBadge>
                  <StatusBadge tone="muted">
                    ★ {m.rating} ({m.reviewCount})
                  </StatusBadge>
                  {m.ownedByCurrentUser ? (
                    <StatusBadge tone="info">مدل شما</StatusBadge>
                  ) : null}
                </div>
                <PriceBreakdown base={charge.base} markup={charge.markup} />
                <div className="btn-row">
                  <Link className="btn btn-primary" to={`/consumer/models/${m.id}`}>
                    مشاهده جزئیات
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
