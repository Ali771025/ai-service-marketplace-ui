import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMockStore } from '../../data/MockStore'
import { PLATFORM_DASHBOARD, PLATFORM_REVENUE_BY_SERVICE } from '../../data/platform'
import {
  PageHeader,
  StatusBadge,
  StatusBanner,
} from '../../components/ui/Primitives'
import { ReportFilterBar } from '../../components/ReportFilterBar'
import { formatIrr } from '../../lib/format'
import {
  defaultReportDateFilter,
  isAtInDateFilter,
  periodLabelForFilter,
} from '../../lib/reportFilters'
import {
  PlatformServiceHubPage,
  PlatformServiceSettingsRedirect,
} from './PlatformServiceHub'
import {
  PlatformOpsReportsPage,
  PlatformRichAuditPage,
} from './PlatformExpandedPages'

export { PlatformServiceHubPage as PlatformServiceDetailPage }
export { PlatformOpsReportsPage as PlatformReportsPage }
export { PlatformRichAuditPage as PlatformAuditPage }

export function PlatformDashboardPage() {
  const { platformOrders, exceptionTickets, creatorInstances, models, provisionJobs } =
    useMockStore()
  const failedPayments = platformOrders.filter((o) => o.paymentStatus === 'failed').length
  const openExc = exceptionTickets.filter(
    (t) => t.status === 'open' || t.status === 'in-progress',
  ).length
  const healthOk = provisionJobs.filter((j) => j.healthStatus === 'ok').length
  const healthWarn = provisionJobs.filter(
    (j) => j.healthStatus === 'degraded' || j.healthStatus === 'down',
  ).length
  const healthUnknown = provisionJobs.filter(
    (j) => !j.healthStatus || j.healthStatus === 'unknown',
  ).length

  return (
    <div>
      <PageHeader
        eyebrow="پلتفرم پلتفرم نمونه"
        title="داشبورد"
        description="خلاصه عملیات — جزئیات مالی در گروه مالی؛ تنظیمات هر سرویس داخل هاب همان سرویس"
      />
      {provisionJobs.length > 0 ? (
        <div className="health-strip" role="status">
          <span className="health-strip-label">نبض نصب‌ها (مکمل اختیاری)</span>
          <span className="health-pill ok">{healthOk} سالم</span>
          <span className="health-pill warn">{healthWarn} هشدار/قطع</span>
          <span className="health-pill muted">{healthUnknown} نامشخص</span>
          <Link className="meta" to="/platform/services">
            جزئیات در تب نصب هر سرویس
          </Link>
          <Link className="meta" to="/platform/execution-metrics">
            متریک اجرا
          </Link>
        </div>
      ) : null}
      <div className="stat-grid">
        <Link className="stat-card" to="/platform/revenue" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="meta">درآمد پایه (ماه)</span>
          <strong>{formatIrr(PLATFORM_DASHBOARD.baseRevenueMonthIrr)}</strong>
          <span className="meta">جزئیات در مالی →</span>
        </Link>
        <div className="stat-card">
          <span className="meta">سفارش‌های پلن</span>
          <strong>{platformOrders.length}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">استثناهای باز</span>
          <strong>{openExc}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">نمونه‌ها</span>
          <strong>{creatorInstances.length}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">مدل‌های کاتالوگ</span>
          <strong>{models.length}</strong>
        </div>
      </div>
      {failedPayments > 0 ? (
        <StatusBanner tone="warn">
          {failedPayments} پرداخت ناموفق — <Link to="/platform/orders">سفارش‌ها</Link> یا{' '}
          <Link to="/platform/exceptions">فعال‌سازی دستی</Link>
        </StatusBanner>
      ) : null}
      {openExc > 0 ? (
        <StatusBanner tone="info">
          {openExc} تیکت استثنا در انتظار —{' '}
          <Link to="/platform/exceptions">صندوق استثناها</Link>
        </StatusBanner>
      ) : null}
      <section className="panel stack">
        <h2 className="panel-title">میان‌برها</h2>
          <div className="btn-row">
          <Link className="btn btn-primary" to="/platform/services">
            مدیریت سرویس‌ها
          </Link>
          <Link className="btn btn-secondary" to="/platform/orders">
            سفارش‌های پلن
          </Link>
          <Link className="btn btn-secondary" to="/platform/exceptions">
            صندوق استثناها
          </Link>
          <Link className="btn btn-ghost" to="/platform/tickets">
            صف تیکت پشتیبانی
          </Link>
          <Link className="btn btn-ghost" to="/platform/reports">
            گزارش‌های عملیاتی
          </Link>
          <Link className="btn btn-ghost" to="/platform/execution-metrics">
            متریک اجرا
          </Link>
        </div>
      </section>
    </div>
  )
}

export function PlatformServicesPage() {
  const { services, upsertService, setServiceStatus } = useMockStore()
  const [status, setStatus] = useState<'all' | 'published' | 'draft' | 'suspended'>('all')
  const [name, setName] = useState('')
  const rows = services.filter((s) => (status === 'all' ? true : s.status === status))

  return (
    <div>
      <PageHeader
        eyebrow="کاتالوگ"
        title="مدیریت سرویس‌ها"
        description="کاتالوگ سرویس‌هایی که فقط پلتفرم نمونه می‌سازد — پلن، نصب و وصول داخل هاب هر سرویس"
      />
      <StatusBanner tone="info">
        برای پلن‌ها، نصب Remote و قواعد وصول، سرویس را باز کنید — همه در یک صفحه جمع شده‌اند.
      </StatusBanner>
      <div className="filter-bar panel">
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="st">وضعیت</label>
          <select
            id="st"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">همه</option>
            <option value="published">منتشر</option>
            <option value="draft">پیش‌نویس</option>
            <option value="suspended">تعلیق</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="nn">نام سرویس جدید</label>
          <input id="nn" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ alignSelf: 'flex-end' }}
          onClick={() => {
            if (!name.trim()) return
            upsertService({
              name: name.trim(),
              status: 'draft',
              description: 'سرویس ایجادشده در دمو',
              meters: ['AI.Token'],
              baseByMeterIrr: { 'AI.Token': 10_000 },
              basePriceIrr: 10_000,
            })
            setName('')
          }}
        >
          ایجاد سرویس
        </button>
      </div>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>نام</th>
              <th>وضعیت</th>
              <th>پلن</th>
              <th>قیمت پایه</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/platform/services/${s.id}`}>{s.name}</Link>
                  <div className="meta">هاب: قیمت پایه · پلن · نصب · وصول</div>
                </td>
                <td>
                  <StatusBadge
                    tone={
                      s.status === 'published' ? 'ok' : s.status === 'draft' ? 'muted' : 'warn'
                    }
                  >
                    {s.status === 'published'
                      ? 'منتشر'
                      : s.status === 'draft'
                        ? 'پیش‌نویس'
                        : 'تعلیق'}
                  </StatusBadge>
                </td>
                <td>{s.planCount}</td>
                <td>
                  {s.meters.length === 0 ? (
                    <span className="meta">بدون Meter مصرف</span>
                  ) : (
                    formatIrr(s.basePriceIrr)
                  )}
                </td>
                <td>
                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <Link className="btn btn-secondary btn-sm" to={`/platform/services/${s.id}`}>
                      مدیریت
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setServiceStatus(
                          s.id,
                          s.status === 'published' ? 'suspended' : 'published',
                        )
                      }
                    >
                      تغییر وضعیت
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PlatformServicePlansPage() {
  return <PlatformServiceSettingsRedirect intent="plans" />
}

export function PlatformSupportFrameworkPage() {
  return <Navigate to="/platform/services" replace />
}

export function PlatformPayoutRulesPage() {
  return <PlatformServiceSettingsRedirect intent="payout" />
}

export function PlatformProvisioningRedirectPage() {
  return <PlatformServiceSettingsRedirect intent="provision" />
}

export function PlatformOrdersPage() {
  const { platformOrders, resolvePlatformOrder } = useMockStore()
  return (
    <div>
      <PageHeader
        eyebrow="بازرگانی"
        title="سفارش‌های پلن سرویس"
        description="خرید Service Plan توسط مدل‌ساز — مشاهده وضعیت پرداخت و علامت‌گذاری (mock)"
      />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>شماره</th>
              <th>خریدار</th>
              <th>پلن</th>
              <th>مبلغ</th>
              <th>پرداخت</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {platformOrders.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.id}</td>
                <td>{o.buyer}</td>
                <td>{o.planName}</td>
                <td>{formatIrr(o.amountIrr)}</td>
                <td>
                  <StatusBadge
                    tone={
                      o.paymentStatus === 'paid'
                        ? 'ok'
                        : o.paymentStatus === 'pending'
                          ? 'warn'
                          : 'danger'
                    }
                  >
                    {o.paymentStatus === 'paid'
                      ? 'پرداخت‌شده'
                      : o.paymentStatus === 'pending'
                        ? 'در انتظار'
                        : 'ناموفق'}
                  </StatusBadge>
                </td>
                <td>
                  {o.paymentStatus !== 'paid' ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => resolvePlatformOrder(o.id, 'paid')}
                    >
                      علامت پرداخت‌شده
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PlatformRevenuePage() {
  const [date, setDate] = useState(() => defaultReportDateFilter('30d'))
  const [q, setQ] = useState('')

  const rows = useMemo(
    () =>
      PLATFORM_REVENUE_BY_SERVICE.filter((r) => {
        if (!isAtInDateFilter(r.at, date)) return false
        if (q.trim() && !r.serviceName.includes(q.trim())) return false
        return true
      }),
    [date, q],
  )
  const total = rows.reduce((s, r) => s + r.baseIrr, 0)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/platform">پلتفرم</Link>
        <span>/</span>
        <span>مالی</span>
        <span>/</span>
        <span>درآمد پایه</span>
      </div>
      <PageHeader
        eyebrow="مالی"
        title="درآمد پایه"
        description="سهم پلتفرم از مصرف (قیمت پایه) — بدون حاشیه مدل‌ساز؛ سهم پلتفرم نمونه از پشتیبانی صفر است"
      />
      <StatusBanner tone="info">
        این صفحه فقط سهم قیمت پایه پلتفرم را نشان می‌دهد. درآمد حاشیه و پشتیبانی مدل‌ساز در صندوق درآمد مدل‌ساز است؛
        قواعد وصول:{' '}
        <Link to="/platform/payouts">قواعد وصول مدل‌ساز</Link>
      </StatusBanner>
      <ReportFilterBar
        date={date}
        onDateChange={setDate}
        search={q}
        onSearchChange={setQ}
        searchLabel="سرویس"
        searchPlaceholder="نام سرویس…"
      />
      <StatusBanner tone="info">بازه: {periodLabelForFilter(date)}</StatusBanner>
      <div className="stat-card" style={{ marginBottom: '0.9rem', maxWidth: 320 }}>
        <span className="meta">مجموع پایه (فیلترشده)</span>
        <strong>{formatIrr(total)}</strong>
      </div>
      {rows.length === 0 ? (
        <p className="meta">سرویسی با این فیلتر نیست.</p>
      ) : (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>سرویس</th>
                <th>قیمت پایه (سهم پلتفرم)</th>
                <th>تسویه</th>
                <th>آخرین فعالیت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.serviceName}>
                  <td>{r.serviceName}</td>
                  <td>{formatIrr(r.baseIrr)}</td>
                  <td>{r.settlements}</td>
                  <td className="meta">{r.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

