import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CREATOR_EARNINGS,
  CREATOR_EARNINGS_SUMMARY,
  CREATOR_INSTANCES,
  CREATOR_INVOICES,
  CREATOR_MODELS,
  CREATOR_PAYOUTS,
  CREATOR_PLAN_CATALOG,
  CREATOR_SUPPORT_PLANS,
  CREATOR_TICKETS,
} from '../../data/creator'
import {
  EmptyState,
  PageHeader,
  PriceBreakdown,
  StatusBadge,
  StatusBanner,
} from '../../components/ui/Primitives'
import { formatIrr } from '../../lib/format'

export function CreatorPlansPage() {
  const [bought, setBought] = useState<string | null>(null)
  return (
    <div>
      <PageHeader
        title="پلن‌ها و نمونه‌های من"
        description="خرید ظرفیت سرویس و مدیریت Plan Instance"
      />
      {bought ? (
        <StatusBanner tone="ok">خرید mock برای «{bought}» ثبت شد.</StatusBanner>
      ) : null}

      <h2 className="section-title">کاتالوگ پلن سرویس</h2>
      <div className="grid-cards">
        {CREATOR_PLAN_CATALOG.map((p) => (
          <article key={p.id} className="catalog-card">
            <h3>{p.name}</h3>
            <span className="meta">{p.serviceName}</span>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{p.capacitySummary}</p>
            <strong>{formatIrr(p.priceIrr)}</strong>
            <button
              type="button"
              className="btn btn-primary"
              disabled={p.status !== 'available'}
              onClick={() => setBought(p.name)}
            >
              {p.status === 'available' ? 'خرید (mock)' : 'ناموجود'}
            </button>
          </article>
        ))}
      </div>

      <h2 className="section-title">نمونه‌های خریداری‌شده</h2>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>سرویس / پلن</th>
              <th>خرید</th>
              <th>وضعیت</th>
              <th>مدل متصل</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {CREATOR_INSTANCES.map((i) => (
              <tr key={i.id}>
                <td>
                  {i.planName}
                  <div className="meta">{i.serviceName}</div>
                </td>
                <td className="meta">
                  {i.purchasedAt}
                  {i.expiresAt ? (
                    <>
                      <br />
                      تا {i.expiresAt}
                    </>
                  ) : null}
                </td>
                <td>
                  <StatusBadge
                    tone={
                      i.status === 'active' ? 'ok' : i.status === 'expiring' ? 'warn' : 'muted'
                    }
                  >
                    {i.status === 'active'
                      ? 'فعال'
                      : i.status === 'expiring'
                        ? 'رو به انقضا'
                        : 'منقضی'}
                  </StatusBadge>
                </td>
                <td>{i.linkedModelName ?? <span className="meta">۰ مدل</span>}</td>
                <td>
                  <Link className="btn btn-ghost" to="/creator/models">
                    {i.linkedModelId ? 'مشاهده مدل' : 'استقرار مدل'}
                  </Link>
                  <Link className="btn btn-ghost" to="/creator/invoices">
                    صورت‌حساب
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CreatorModelsPage() {
  return (
    <div>
      <PageHeader
        title="مدل‌های من"
        description="هر Instance حداکثر یک مدل — انتشار بدون تأیید پلتفرم نمونه"
      />
      <div className="btn-row" style={{ marginBottom: '0.9rem' }}>
        <button type="button" className="btn btn-primary" disabled title="فرم mock">
          ایجاد مدل (mock)
        </button>
      </div>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>مدل</th>
              <th>Instance</th>
              <th>انتشار</th>
              <th>پشتیبانی</th>
              <th>Markup</th>
              <th>امتیاز</th>
            </tr>
          </thead>
          <tbody>
            {CREATOR_MODELS.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link to="/creator/markup">{m.name}</Link>
                  <div className="meta mono">{m.id}</div>
                </td>
                <td className="mono">{m.instanceId}</td>
                <td>
                  <StatusBadge tone={m.publishStatus === 'published' ? 'ok' : 'muted'}>
                    {m.publishStatus === 'published' ? 'منتشر' : 'پیش‌نویس'}
                  </StatusBadge>
                </td>
                <td>{m.hasSupportPlans ? 'دارد' : 'ندارد'}</td>
                <td>
                  <PriceBreakdown base={m.baseIrr} markup={m.markupIrr} />
                </td>
                <td className="meta">
                  ★ {m.rating} ({m.reviewCount})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CreatorMarkupPage() {
  const [rows, setRows] = useState(
    CREATOR_MODELS.map((m) => ({
      ...m,
      kind: 'fixed' as 'fixed' | 'percent',
      draftMarkup: m.markupIrr,
      draftPercent: 20,
    })),
  )
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <PageHeader
        title="قیمت‌گذاری (Markup)"
        description="Base فقط خواندنی — Markup مبلغ ثابت یا درصد. سقف اجباری پلتفرم نیست. مصرف خود مدل‌ساز فقط Base."
      />
      <StatusBanner tone="info">
        Creator Markup پس از Settlement به <strong>صندوق درآمد مدل‌ساز</strong> می‌رود — جدا از
        Wallet مصرف‌کننده.
      </StatusBanner>
      {saved ? <StatusBanner tone="ok">Markup ذخیره شد (mock).</StatusBanner> : null}
      <div className="stack" style={{ gap: '0.9rem' }}>
        {rows.map((m) => {
          const markup =
            m.kind === 'percent'
              ? Math.round((m.baseIrr * m.draftPercent) / 100)
              : m.draftMarkup
          return (
            <section key={m.id} className="panel stack">
              <h2 className="panel-title">{m.name}</h2>
              <p className="meta" style={{ margin: 0 }}>
                Base (پلتفرم): {formatIrr(m.baseIrr)} — فقط خواندنی
              </p>
              <div className="field" style={{ maxWidth: 220 }}>
                <label htmlFor={`kind-${m.id}`}>نوع Markup</label>
                <select
                  id={`kind-${m.id}`}
                  value={m.kind}
                  onChange={(e) => {
                    const kind = e.target.value as 'fixed' | 'percent'
                    setRows((prev) =>
                      prev.map((r) => (r.id === m.id ? { ...r, kind } : r)),
                    )
                    setSaved(false)
                  }}
                >
                  <option value="fixed">مبلغ ثابت (ریال)</option>
                  <option value="percent">درصد روی Base</option>
                </select>
              </div>
              {m.kind === 'fixed' ? (
                <div className="field" style={{ maxWidth: 240 }}>
                  <label htmlFor={`mk-${m.id}`}>Markup (ریال)</label>
                  <input
                    id={`mk-${m.id}`}
                    type="number"
                    value={m.draftMarkup}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === m.id ? { ...r, draftMarkup: v } : r,
                        ),
                      )
                      setSaved(false)
                    }}
                  />
                </div>
              ) : (
                <div className="field" style={{ maxWidth: 240 }}>
                  <label htmlFor={`pct-${m.id}`}>Markup (%)</label>
                  <input
                    id={`pct-${m.id}`}
                    type="number"
                    value={m.draftPercent}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === m.id ? { ...r, draftPercent: v } : r,
                        ),
                      )
                      setSaved(false)
                    }}
                  />
                </div>
              )}
              <p>
                پیش‌نمایش برای مصرف‌کننده:{' '}
                <strong>{formatIrr(m.baseIrr + markup)}</strong>
                <span className="meta">
                  {' '}
                  (Base {formatIrr(m.baseIrr)} + Markup {formatIrr(markup)})
                </span>
              </p>
              <p className="meta" style={{ margin: 0 }}>
                اگر خودتان مصرف کنید: فقط {formatIrr(m.baseIrr)} (بدون Markup)
              </p>
            </section>
          )
        })}
      </div>
      <div className="btn-row" style={{ marginTop: '0.9rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setSaved(true)}
        >
          ذخیره همه (mock)
        </button>
      </div>
    </div>
  )
}

export function CreatorSupportPlansPage() {
  return (
    <div>
      <PageHeader
        title="پلن‌های پشتیبانی"
        description="اختیاری — اگر نسازید، مصرف‌کننده بدون خرید پشتیبانی می‌تواند مصرف کند"
      />
      <StatusBanner tone="info">
        چارچوب فیلدها از پلتفرم می‌آید؛ مدل‌ساز per سرویس گسترش می‌دهد.
      </StatusBanner>
      {CREATOR_SUPPORT_PLANS.length === 0 ? (
        <EmptyState title="هنوز پلنی تعریف نشده" />
      ) : (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>نام</th>
                <th>مدل</th>
                <th>نوع</th>
                <th>قیمت</th>
                <th>مدت</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {CREATOR_SUPPORT_PLANS.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.modelName}</td>
                  <td>{p.kind === 'monthly' ? 'ماهانه' : 'per تیکت'}</td>
                  <td>{formatIrr(p.priceIrr)}</td>
                  <td>{p.durationLabel}</td>
                  <td>
                    <StatusBadge tone={p.status === 'active' ? 'ok' : 'muted'}>
                      {p.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="btn-row" style={{ marginTop: '0.9rem' }}>
        <button type="button" className="btn btn-primary" disabled>
          ایجاد پلن (mock)
        </button>
      </div>
    </div>
  )
}

export function CreatorEarningsPage() {
  const s = CREATOR_EARNINGS_SUMMARY
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div>
      <PageHeader
        title="صندوق درآمد و وصول"
        description="موجودی قابل وصول · تفکیک مصرف و پشتیبانی · شبا یا تبدیل به Wallet (یک‌طرفه)"
      />
      <StatusBanner tone="info">
        درآمد پشتیبانی به همین صندوق می‌رود؛ سهم پلتفرم نمونه از پشتیبانی صفر است. آستانه وصول per سرویس:
        حداقل مبلغ <strong>یا</strong> حداقل زمان.
      </StatusBanner>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="meta">قابل وصول</span>
          <strong>{formatIrr(s.availableIrr)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">از Markup مصرف</span>
          <strong>{formatIrr(s.fromUsageIrr)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">از پشتیبانی</span>
          <strong>{formatIrr(s.fromSupportIrr)}</strong>
        </div>
      </div>
      {msg ? <StatusBanner tone="ok">{msg}</StatusBanner> : null}
      <section className="panel stack">
        <h2 className="panel-title">درخواست وصول</h2>
        <p className="meta" style={{ margin: 0 }}>
          آستانه شبا این سرویس: حداقل {formatIrr(s.shebaMinAmountIrr)} یا{' '}
          {s.shebaMinDays} روز — هر کدام کافی است.
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              setMsg('درخواست وصول به شبا ثبت شد (mock). مبلغ دیگر به Wallet قابل تبدیل نیست.')
            }
          >
            وصول به شبا
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setMsg('مبلغ به Wallet داخل پلتفرم منتقل شد (mock). دیگر به شبا نمی‌رود.')
            }
          >
            تبدیل به Wallet
          </button>
        </div>
      </section>
      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">تاریخچه درآمد</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>منبع</th>
                <th>شرح</th>
                <th>مبلغ</th>
                <th>ارجاع</th>
              </tr>
            </thead>
            <tbody>
              {CREATOR_EARNINGS.map((e) => (
                <tr key={e.id}>
                  <td>{e.at}</td>
                  <td>{e.source === 'usage-markup' ? 'مصرف' : 'پشتیبانی'}</td>
                  <td>{e.label}</td>
                  <td>{formatIrr(e.amountIrr)}</td>
                  <td className="mono">{e.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">تاریخچه وصول</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>روش</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {CREATOR_PAYOUTS.map((p) => (
                <tr key={p.id}>
                  <td>{p.at}</td>
                  <td>{p.method === 'sheba' ? 'شبا' : 'Wallet'}</td>
                  <td>{formatIrr(p.amountIrr)}</td>
                  <td>
                    <StatusBadge tone={p.status === 'done' ? 'ok' : 'warn'}>
                      {p.status === 'done' ? 'انجام‌شده' : 'در انتظار'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export function CreatorInvoicesPage() {
  return (
    <div>
      <PageHeader
        title="صورت‌حساب‌ها"
        description="صورت‌حساب خرید Service Plan — استرداد خرید پلن در MVP نیست"
      />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>شماره</th>
              <th>تاریخ</th>
              <th>پلن</th>
              <th>مبلغ</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {CREATOR_INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td className="mono">{inv.id}</td>
                <td>{inv.at}</td>
                <td>{inv.planName}</td>
                <td>{formatIrr(inv.amountIrr)}</td>
                <td>
                  <StatusBadge tone={inv.status === 'paid' ? 'ok' : 'warn'}>
                    {inv.status === 'paid' ? 'پرداخت‌شده' : 'در انتظار'}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CreatorTicketsPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'waiting' | 'closed'>('all')
  const rows = CREATOR_TICKETS.filter((t) =>
    filter === 'all' ? true : t.status === filter,
  )
  return (
    <div>
      <PageHeader title="تیکت‌ها" description="تیکت‌های مربوط به مدل‌های این مدل‌ساز" />
      <div className="filter-bar panel">
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="f">وضعیت</label>
          <select
            id="f"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">همه</option>
            <option value="open">باز</option>
            <option value="waiting">در انتظار</option>
            <option value="closed">بسته</option>
          </select>
        </div>
      </div>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>موضوع</th>
              <th>مدل</th>
              <th>مصرف‌کننده</th>
              <th>پلن پشتیبانی</th>
              <th>وضعیت</th>
              <th>به‌روزرسانی</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.subject}
                  <div className="meta mono">{t.id}</div>
                </td>
                <td>{t.modelName}</td>
                <td>{t.consumerName}</td>
                <td className="meta">{t.supportPlan ?? '—'}</td>
                <td>
                    <StatusBadge
                    tone={
                      t.status === 'open' ? 'info' : t.status === 'waiting' ? 'warn' : 'muted'
                    }
                  >
                    {t.status === 'open'
                      ? 'باز'
                      : t.status === 'waiting'
                        ? 'در انتظار'
                        : 'بسته'}
                  </StatusBadge>
                </td>
                <td className="meta">{t.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
