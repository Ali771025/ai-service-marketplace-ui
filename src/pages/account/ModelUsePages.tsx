import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useMockStore } from '../../data/MockStore'
import { estimateCharge, getModel } from '../../data/models'
import { BUYABLE_SUPPORT_PLANS } from '../../data/consumerExtras'
import {
  PageHeader,
  PriceBreakdown,
  StatusBadge,
  StatusBanner,
  EmptyState,
} from '../../components/ui/Primitives'
import { ReportFilterBar } from '../../components/ReportFilterBar'
import { formatIrr, supportLabel, requestStatusLabel } from '../../lib/format'
import { downloadCsv } from '../../lib/downloadCsv'
import { MODEL_USAGE_SUMMARY } from '../../data/platformOpsExtras'
import {
  keysForModelOrFallback,
  remainingBudgetIrr,
  keyBudgetAlert,
  SHORT_TERM_CAPACITY,
  reportBuilderConnectGuideMarkdown,
  type ConsumerApiKeyRow,
  type ApiKeyIssueMode,
} from '../../data/consumerApiKeys'
import { walletBudgetAlert } from '../../data/wallet'
import { getModelHeadroom } from '../../data/headroom'
import { HeadroomDashboard } from '../../components/HeadroomDashboard'
import {
  defaultReportDateFilter,
  extractDateKey,
  minDayOffsetForPreset,
  mockPersianDateFromOffset,
  periodLabelForFilter,
  type ReportDateFilter,
} from '../../lib/reportFilters'

function usageScaleForDateFilter(filter: ReportDateFilter): number {
  if (filter.preset === 'today') return 1 / 30
  if (filter.preset === '7d') return 7 / 30
  if (filter.preset === '30d') return 1
  const from = extractDateKey(filter.from)
  const to = extractDateKey(filter.to)
  if (!from || !to || to < from) return 1
  const minKey = extractDateKey(mockPersianDateFromOffset(minDayOffsetForPreset('30d')))
  const maxKey = extractDateKey(mockPersianDateFromOffset(0))
  if (from <= minKey && to >= maxKey) return 1
  if (from === to) return 1 / 30
  return 0.5
}

export function ModelUseHomePage() {
  const { modelId = '' } = useParams()
  const { models, availableIrr, setAutoRenew, addReview } = useMockStore()
  const { user } = useAuth()
  const model = getModel(modelId, models)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')

  if (!model) {
    return (
      <div>
        <PageHeader title="مدل یافت نشد" />
        <Link to="/account">میز کار</Link>
      </div>
    )
  }

  const charge = estimateCharge(model)
  const blocked =
    (model.supportRequired && model.supportPlanStatus === 'expired') || availableIrr < 0

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <span>مدل › {model.name}</span>
      </div>
      <PageHeader
        eyebrow="فضای استفاده از مدل"
        title={model.name}
        description={`${model.creatorName} · مدل کمک‌کننده به نرم‌افزار مدل‌ساز (نه میز کار گزارش داخل پلتفرم نمونه)`}
      />
      <StatusBanner tone="info">
        مسیر رسمی محصول کوئری‌ساز: کلید دسترسی را در نرم‌افزار مقصد بگذارید → درخواست از آنجا → کوئری از
        پلتفرم نمونه → اجرا و نمایش نتیجه در همان نرم‌افزار. داخل پلتفرم کار عملیاتی گزارش انجام نمی‌شود.
      </StatusBanner>
      {model.ownedByCurrentUser ? (
        <StatusBanner tone="info">مدل شما — اگر خودتان مصرف کنید فقط Base.</StatusBanner>
      ) : null}
      {model.supportRequired && model.supportPlanStatus === 'expired' ? (
        <StatusBanner tone="warn">
          پشتیبانی منقضی — تیکت/کلید جدید ممکن است محدود شود.{' '}
          <Link to={`/account/models/${model.id}/buy-support`}>تمدید</Link>
        </StatusBanner>
      ) : null}
      {availableIrr < 0 ? (
        <StatusBanner tone="danger">
          بدهی کیف پول — <Link to="/account/wallet">تسویه</Link>
        </StatusBanner>
      ) : null}

      <div className="detail-grid two">
        <section className="panel">
          <h2 className="panel-title">توضیح ارزش</h2>
          <p style={{ marginTop: 0 }}>{model.description}</p>
          <p className="meta">
            ★ {model.rating} ({model.reviewCount} نظر)
          </p>
        </section>
        <section className="panel stack">
          <h2 className="panel-title">وضعیت و قیمت نمونه فراخوانی</h2>
          <PriceBreakdown base={charge.base} markup={charge.markup} />
          <StatusBadge
            tone={
              model.supportPlanStatus === 'active'
                ? 'ok'
                : model.supportPlanStatus === 'expired'
                  ? 'warn'
                  : 'info'
            }
          >
            {supportLabel(model.supportPlanStatus)}
          </StatusBadge>
          {model.supportPlanStatus === 'active' &&
          model.supportPlanName?.includes('ماهانه') ? (
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={Boolean(model.autoRenew)}
                onChange={(e) => setAutoRenew(model.id, e.target.checked)}
              />
              تمدید خودکار (انتخاب کاربر)
            </label>
          ) : null}
          <div className="btn-row">
            <Link className="btn btn-primary" to={`/account/models/${model.id}/how-it-works`}>
              مدیریت کلید دسترسی
            </Link>
            <Link className="btn btn-secondary" to={`/account/models/${model.id}/connect-guide`}>
              راهنمای اتصال
            </Link>
            <Link className="btn btn-secondary" to={`/account/models/${model.id}/usage`}>
              خلاصه مصرف
            </Link>
            <Link className="btn btn-secondary" to={`/account/models/${model.id}/support`}>
              تیکت پشتیبانی مدل
            </Link>
            <Link className="btn btn-ghost" to={`/account/models/${model.id}/history`}>
              تاریخچه فراخوانی
            </Link>
            <Link
              className="btn btn-ghost"
              to={`/account/models/${model.id}/complaint`}
            >
              شکایت از مدل‌ساز
            </Link>
          </div>
          <p className="meta" style={{ margin: 0 }}>
            شبیه‌ساز درخواست داخل پلتفرم نمونه فقط برای ارائه است:{' '}
            {blocked ? (
              <span>مسدود</span>
            ) : (
              <Link to={`/account/models/${model.id}/request`}>باز کردن شبیه‌ساز ارائه</Link>
            )}
          </p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">نظرات</h2>
        {model.reviews.map((r) => (
          <div key={r.id} className="review-item">
            <strong>
              ★ {r.rating} — {r.author}
            </strong>
            <div className="meta">{r.at}</div>
            <p style={{ margin: '0.25rem 0 0' }}>{r.body}</p>
          </div>
        ))}
        <form
          className="stack"
          style={{ marginTop: '0.75rem' }}
          onSubmit={(e) => {
            e.preventDefault()
            addReview({
              modelId: model.id,
              rating,
              body,
              author: user?.displayName ?? 'کاربر',
            })
            setBody('')
          }}
        >
          <div className="field" style={{ maxWidth: 120 }}>
            <label>امتیاز</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>نظر</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-secondary">
            ثبت نظر
          </button>
        </form>
      </section>
    </div>
  )
}

export function ModelRequestPage() {
  const { modelId = '' } = useParams()
  const { models, submitRequest, availableIrr } = useMockStore()
  const model = getModel(modelId, models)
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [docVersionId, setDocVersionId] = useState(model?.docVersions[0]?.id ?? '')
  const [error, setError] = useState('')

  if (!model) return <Navigate to="/account" replace />
  const charge = estimateCharge(model)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const result = submitRequest({
      modelId: model!.id,
      question,
      docVersionId: docVersionId || model!.docVersions[0]!.id,
    })
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate(`/account/requests/${result.requestId}`)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>درخواست</span>
      </div>
      <PageHeader
        eyebrow="شبیه‌ساز غیررسمی"
        title="شبیه‌ساز ارائه (غیررسمی)"
        description="این صفحه فقط برای دموی RFP است — مسیر رسمی محصول: نرم‌افزار مدل‌ساز + کلید دسترسی"
      />
      <StatusBanner tone="warn">
        قرارداد کوئری‌ساز: مصرف‌کننده داخل پلتفرم نمونه گزارش نمی‌سازد. درخواست واقعی از حسابداری/نرم‌افزار
        مقصد می‌آید؛ اینجا فقط جریان رزرو → کوئری → ریال را نشان می‌دهیم.
      </StatusBanner>
      <StatusBanner tone="info">
        تخمین: <PriceBreakdown base={charge.base} markup={charge.markup} /> · موجودی:{' '}
        {formatIrr(availableIrr)}
      </StatusBanner>
      <form className="panel stack" onSubmit={onSubmit}>
        <div className="field">
          <label>نسخه دانش</label>
          <select value={docVersionId} onChange={(e) => setDocVersionId(e.target.value)}>
            {model.docVersions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>سؤال</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>
        {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
        <button type="submit" className="btn btn-primary">
          رزرو و ارسال
        </button>
      </form>
    </div>
  )
}

export function ModelHistoryPage() {
  const { modelId = '' } = useParams()
  const { models, requests } = useMockStore()
  const model = getModel(modelId, models)
  if (!model) return <Navigate to="/account" replace />
  const rows = requests.filter((r) => r.modelId === modelId)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>تاریخچه</span>
      </div>
      <PageHeader
        title="تاریخچه درخواست‌ها"
        description="پس از انقضای پشتیبانی، مشاهده تاریخچه مجاز است"
      />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>وضعیت</th>
              <th>سؤال</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/account/requests/${r.id}`}>{r.id}</Link>
                </td>
                <td>{requestStatusLabel(r.status)}</td>
                <td className="muted">{r.question}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <EmptyState title="درخواستی نیست" /> : null}
      </div>
    </div>
  )
}

export function ModelSupportPage() {
  const { modelId = '' } = useParams()
  const { models, consumerTickets, createConsumerTicket } = useMockStore()
  const model = getModel(modelId, models)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  if (!model) return <Navigate to="/account" replace />
  const tickets = consumerTickets.filter((t) => t.modelId === modelId)
  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0]
  const blocked = model.supportRequired && model.supportPlanStatus === 'expired'

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>تیکت پشتیبانی مدل</span>
      </div>
      <PageHeader
        eyebrow="پشتیبانی"
        title="تیکت به مدل‌ساز"
        description="مسیر به مدل‌ساز همین مدل — جدا از درخواست به پلتفرم نمونه (استثنا / entitlement)"
      />
      <StatusBanner tone="info">
        درخواست به پلتفرم نمونه:{' '}
        <Link to="/account/exceptions">درخواست به پلتفرم نمونه</Link> · شکایت:{' '}
        <Link to={`/account/models/${model.id}/complaint`}>ثبت شکایت</Link>
      </StatusBanner>
      {blocked ? (
        <StatusBanner tone="warn">
          پلن پشتیبانی منقضی — تیکت جدید مجاز نیست.{' '}
          <Link to={`/account/models/${model.id}/buy-support`}>تمدید</Link>
        </StatusBanner>
      ) : (
        <form
          className="panel stack"
          onSubmit={(e) => {
            e.preventDefault()
            const id = createConsumerTicket({
              modelId: model.id,
              modelName: model.name,
              subject,
              body,
            })
            setMsg(`تیکت ${id} ثبت شد.`)
            setSelectedId(id)
            setSubject('')
            setBody('')
          }}
        >
          <h2 className="panel-title">ثبت تیکت جدید</h2>
          <div className="field">
            <label>موضوع</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="field">
            <label>شرح</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            ثبت تیکت
          </button>
        </form>
      )}
      {msg ? <StatusBanner tone="ok">{msg}</StatusBanner> : null}

      {tickets.length === 0 ? (
        <EmptyState
          title="هنوز تیکتی روی این مدل نیست"
          hint="پس از ثبت، گفتگو با مدل‌ساز اینجا دیده می‌شود."
        />
      ) : (
        <div className="detail-grid two" style={{ marginTop: '0.9rem' }}>
          <section className="panel table-wrap">
            <h2 className="panel-title">فهرست</h2>
            <table className="data">
              <thead>
                <tr>
                  <th>موضوع</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      cursor: 'pointer',
                      background: selected?.id === t.id ? 'var(--primary-soft)' : undefined,
                    }}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <td>
                      {t.subject}
                      <div className="meta mono">{t.id}</div>
                    </td>
                    <td>
                      <StatusBadge
                        tone={
                          t.status === 'closed' ? 'muted' : t.status === 'waiting' ? 'warn' : 'info'
                        }
                      >
                        {t.status === 'open'
                          ? 'باز'
                          : t.status === 'waiting'
                            ? 'در انتظار'
                            : 'بسته'}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {selected ? (
            <section className="panel stack drawer-panel">
              <h2 className="panel-title">{selected.subject}</h2>
              <p className="meta" style={{ margin: 0 }}>
                {selected.id} · آخرین به‌روز: {selected.updatedAt}
              </p>
              {selected.messages.map((m) => (
                <div key={m.id} className="ticket-msg">
                  <div className="meta">
                    {m.from === 'consumer'
                      ? 'شما'
                      : m.from === 'creator'
                        ? 'مدل‌ساز'
                        : 'سیستم'}{' '}
                    · {m.at}
                  </div>
                  <p style={{ margin: '0.25rem 0 0' }}>{m.body}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function ModelUsageSummaryPage() {
  const { modelId = '' } = useParams()
  const { models, wallet } = useMockStore()
  const model = getModel(modelId, models)
  const [date, setDate] = useState(() => defaultReportDateFilter('30d'))
  const [keyQ, setKeyQ] = useState('')
  const [issueMode, setIssueMode] = useState<'all' | ApiKeyIssueMode>('all')

  const usage = MODEL_USAGE_SUMMARY[modelId] ?? MODEL_USAGE_SUMMARY.default
  const allKeys = model
    ? keysForModelOrFallback(modelId, model.apiKeyPlaceholder)
    : ([] as ConsumerApiKeyRow[])
  const capacity = SHORT_TERM_CAPACITY[modelId] ?? SHORT_TERM_CAPACITY.default
  const headroom = getModelHeadroom(modelId, model?.apiKeyPlaceholder ?? '')
  const accountWarn = {
    budgetWarnPctSoft: wallet.budgetWarnPctSoft,
    budgetWarnPctElevated: wallet.budgetWarnPctElevated,
  }
  const walletAlert = walletBudgetAlert(wallet)

  const scale = usageScaleForDateFilter(date)
  const filteredKeys = useMemo(() => {
    const q = keyQ.trim()
    return allKeys.filter((k) => {
      if (issueMode !== 'all' && k.issueMode !== issueMode) return false
      if (q && !`${k.label} ${k.maskedSecret}`.includes(q)) return false
      return true
    })
  }, [allKeys, keyQ, issueMode])

  const scaledKeys = useMemo(
    () =>
      filteredKeys.map((k) => ({
        ...k,
        requestsMonth: Math.max(0, Math.round(k.requestsMonth * scale)),
        tokensMonth: Math.max(0, Math.round(k.tokensMonth * scale)),
        spentIrr: Math.max(0, Math.round(k.spentIrr * scale)),
      })),
    [filteredKeys, scale],
  )

  const scaledUsage = useMemo(
    () => ({
      invokesMonth: Math.max(0, Math.round(usage.invokesMonth * scale)),
      tokensMonth: Math.max(0, Math.round(usage.tokensMonth * scale)),
      spendIrrApprox: Math.max(0, Math.round(usage.spendIrrApprox * scale)),
      lastInvokeAt: usage.lastInvokeAt,
    }),
    [usage, scale],
  )

  const keyAlerts = scaledKeys
    .map((k) => ({ key: k, alert: keyBudgetAlert(k, accountWarn) }))
    .filter((x) => x.alert.level !== 'none')

  if (!model) return <Navigate to="/account" replace />

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>خلاصه مصرف</span>
      </div>
      <PageHeader
        title="خلاصه مصرف این مدل"
        description="تفکیک به ازای کلید دسترسی · ظرفیت کوتاه‌مدت · نزدیک به سقف ثابت · هشدار چندآستانه بودجه · صادرات با فیلتر فعال"
      />

      <ReportFilterBar
        date={date}
        onDateChange={setDate}
        search={keyQ}
        onSearchChange={setKeyQ}
        searchLabel="کلید دسترسی"
        searchPlaceholder="برچسب / ماسک…"
      >
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="mus-mode">حالت صدور</label>
          <select
            id="mus-mode"
            value={issueMode}
            onChange={(e) => setIssueMode(e.target.value as typeof issueMode)}
          >
            <option value="all">همه</option>
            <option value="self">الف (خود)</option>
            <option value="org-admin">ب (سازمان)</option>
          </select>
        </div>
      </ReportFilterBar>

      <StatusBanner tone="info">
        بازه: {periodLabelForFilter(date)} — اعداد متناسب با بازه مقیاس می‌شوند
      </StatusBanner>

      <div className="btn-row" style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={scaledKeys.length === 0}
          onClick={() => {
            const headers = [
              'مدل',
              'برچسب کلید',
              'کلید (ماسک)',
              'حالت صدور',
              'درخواست',
              'توکن',
              'هزینه (ریال)',
              'سقف بودجه کلید (ریال)',
              'مانده سقف (ریال)',
              'بازه',
            ]
            const rows = scaledKeys.map((k) => {
              const rem = remainingBudgetIrr(k)
              return [
                model.name,
                k.label,
                k.maskedSecret,
                k.issueMode === 'self' ? 'الف' : 'ب',
                k.requestsMonth,
                k.tokensMonth,
                k.spentIrr,
                k.overallBudgetCapIrr ?? '',
                rem == null ? '' : rem,
                periodLabelForFilter(date),
              ]
            })
            const stamp = new Date().toISOString().slice(0, 10)
            downloadCsv(`portfolio-usage-${model.id}-${stamp}.csv`, headers, rows)
          }}
        >
          صادرات CSV (با فیلتر فعال)
        </button>
        <span className="meta" style={{ alignSelf: 'center' }}>
          هدر فارسی · UTF-8 · Excel با CSV باز می‌شود (MVP mock)
        </span>
      </div>

      {walletAlert.level === 'capped' ? (
        <StatusBanner tone="danger">
          سقف بودجه ماهانه کیف پول پر شده — مصرف جدید حساب مسدود است.{' '}
          <Link to="/account/wallet">کیف پول</Link>
        </StatusBanner>
      ) : walletAlert.level === 'elevated' ? (
        <StatusBanner tone="warn">
          بودجه ماهانه کیف پول حدود {walletAlert.pct}٪ پر است (آستانه{' '}
          {wallet.budgetWarnPctElevated}٪) — هنوز قابل‌استفاده.{' '}
          <Link to="/account/wallet">تنظیم آستانه‌ها</Link>
        </StatusBanner>
      ) : walletAlert.level === 'soft' ? (
        <StatusBanner tone="info">
          بودجه ماهانه کیف پول حدود {walletAlert.pct}٪ پر است (آستانه {wallet.budgetWarnPctSoft}٪)
          — هنوز قابل‌استفاده. <Link to="/account/wallet">کیف پول</Link>
        </StatusBanner>
      ) : null}

      {keyAlerts.map(({ key: k, alert }) =>
        alert.level === 'capped' ? (
          <StatusBanner key={k.id} tone="danger">
            کلید «{k.label}»: سقف بودجه کلی پر — این کلید متوقف است ({alert.pct}٪).
          </StatusBanner>
        ) : alert.level === 'elevated' ? (
          <StatusBanner key={k.id} tone="warn">
            کلید «{k.label}»: {alert.pct}٪ سقف کلی (آستانه {alert.elevated}٪) — هنوز قابل‌استفاده.
          </StatusBanner>
        ) : (
          <StatusBanner key={k.id} tone="info">
            کلید «{k.label}»: {alert.pct}٪ سقف کلی (آستانه {alert.soft}٪) — هنوز قابل‌استفاده.
          </StatusBanner>
        ),
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="meta">فراخوانی (بازه)</span>
          <strong>{scaledUsage.invokesMonth}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">توکن (بازه)</span>
          <strong>{scaledUsage.tokensMonth.toLocaleString('fa-IR')}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">برآورد هزینه</span>
          <strong>{formatIrr(scaledUsage.spendIrrApprox)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">آخرین فراخوانی</span>
          <strong style={{ fontSize: '1rem' }}>{scaledUsage.lastInvokeAt}</strong>
        </div>
      </div>

      <HeadroomDashboard snapshot={headroom} />

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">ظرفیت کوتاه‌مدت (نرخ در بازه)</h2>
        <p className="meta" style={{ marginTop: 0 }}>
          نمودار سری زمانی پر بودن صف/نرخ در بازه‌های کوتاه — فقط خواندنی (mock). با داشبورد «نزدیک به
          سقف» فرق دارد؛ آنجا فاصله تا سقف‌های ثابت است.
        </p>
        <div className="chart-mock">
          <div className="chart-mock-bars">
            {capacity.map((b) => (
              <div
                key={b.label}
                className="chart-mock-bar"
                style={{ height: `${Math.max(8, b.usedPct)}%` }}
                title={`${b.label}: ${b.usedPct}% — ${b.hint}`}
              />
            ))}
          </div>
          <div
            className="btn-row"
            style={{ justifyContent: 'space-between', marginTop: '0.35rem', flexWrap: 'wrap' }}
          >
            {capacity.map((b) => (
              <span key={b.label} className="meta" style={{ flex: '1 1 4rem', textAlign: 'center' }}>
                {b.label}
                <br />
                {b.usedPct}٪
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel table-wrap" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">مصرف و هزینه به ازای کلید دسترسی</h2>
        {scaledKeys.length === 0 ? (
          <EmptyState
            title="کلیدی با این فیلتر نیست"
            hint="جستجو یا حالت صدور را باز کنید، یا از مدیریت کلید نمونه ببینید."
            action={
              <Link className="btn btn-secondary" to={`/account/models/${model.id}/how-it-works`}>
                مدیریت کلید دسترسی
              </Link>
            }
          />
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>کلید</th>
                <th>حالت</th>
                <th>درخواست (بازه)</th>
                <th>توکن</th>
                <th>هزینه (ریال)</th>
                <th>مانده سقف کلید</th>
                <th>هشدار بودجه</th>
              </tr>
            </thead>
            <tbody>
              {scaledKeys.map((k) => {
                const rem = remainingBudgetIrr(k)
                const alert = keyBudgetAlert(k, accountWarn)
                return (
                  <tr key={k.id}>
                    <td>
                      {k.label}
                      <div className="meta mono">{k.maskedSecret}</div>
                    </td>
                    <td>{k.issueMode === 'self' ? 'الف' : 'ب'}</td>
                    <td>{k.requestsMonth.toLocaleString('fa-IR')}</td>
                    <td>{k.tokensMonth.toLocaleString('fa-IR')}</td>
                    <td>{formatIrr(k.spentIrr)}</td>
                    <td>
                      {rem == null ? (
                        <span className="meta">بدون سقف کلید</span>
                      ) : rem === 0 ? (
                        <StatusBadge tone="warn">پر — متوقف</StatusBadge>
                      ) : (
                        formatIrr(rem)
                      )}
                    </td>
                    <td>
                      {alert.level === 'none' ? (
                        <span className="meta">{alert.pct != null ? `${alert.pct}٪` : '—'}</span>
                      ) : alert.level === 'capped' ? (
                        <StatusBadge tone="danger">۱۰۰٪ سخت</StatusBadge>
                      ) : alert.level === 'elevated' ? (
                        <StatusBadge tone="warn">{alert.pct}٪ · نزدیک</StatusBadge>
                      ) : (
                        <StatusBadge tone="info">{alert.pct}٪ · هشدار</StatusBadge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <StatusBanner tone="info">
        کار اصلی داخل پلتفرم نمونه برای کوئری‌ساز همچنان{' '}
        <Link to={`/account/models/${model.id}/how-it-works`}>کلید دسترسی</Link> است ·{' '}
        <Link to={`/account/models/${model.id}/connect-guide`}>راهنمای اتصال</Link> ·{' '}
        <Link to={`/account/models/${model.id}/history`}>تاریخچه فراخوانی</Link>
      </StatusBanner>
      <section className="panel stack">
        <h2 className="panel-title">اقدام‌های ثانویه</h2>
        <div className="btn-row">
          <Link className="btn btn-secondary" to={`/account/models/${model.id}/support`}>
            تیکت پشتیبانی مدل
          </Link>
          <Link className="btn btn-ghost" to={`/account/models/${model.id}/complaint`}>
            شکایت از مدل‌ساز
          </Link>
          <Link className="btn btn-ghost" to="/account/wallet">
            کیف پول
          </Link>
        </div>
      </section>
    </div>
  )
}


export function ModelBuySupportPage() {
  const { modelId = '' } = useParams()
  const { models, activateSupportPlan } = useMockStore()
  const model = getModel(modelId, models)
  const plans = useMemo(
    () => BUYABLE_SUPPORT_PLANS.filter((p) => p.modelId === modelId),
    [modelId],
  )
  const [selected, setSelected] = useState(plans[0]?.id ?? '')
  const [autoRenew, setAutoRenew] = useState(true)
  const [done, setDone] = useState(false)
  if (!model) return <Navigate to="/account" replace />
  const plan = plans.find((p) => p.id === selected)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>خرید پشتیبانی</span>
      </div>
      <PageHeader
        title="خرید پلن پشتیبانی"
        description="مستقل از حاشیه · صورت‌حساب دارد · استرداد در نسخه اول نیست · سهم پلتفرم نمونه صفر"
      />
      {done ? (
        <StatusBanner tone="ok">خرید و فعال‌سازی انجام شد.</StatusBanner>
      ) : null}
      <div className="detail-grid two">
        <section className="panel stack">
          {plans.map((p) => (
            <label key={p.id} className="plan-option">
              <input
                type="radio"
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
              />
              <div>
                <strong>{p.name}</strong>
                <div className="meta">
                  {p.kind === 'monthly' ? 'ماهانه' : 'به ازای تیکت'} · {formatIrr(p.priceIrr)}
                </div>
              </div>
            </label>
          ))}
          {plan?.kind === 'monthly' ? (
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
              />
              تمدید خودکار
            </label>
          ) : null}
        </section>
        <section className="panel stack">
          <p>
            مبلغ: <strong>{plan ? formatIrr(plan.priceIrr) : '—'}</strong>
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!plan || done}
            onClick={() => {
              if (!plan) return
              activateSupportPlan({
                modelId,
                planName: plan.name,
                kind: plan.kind,
                autoRenew: plan.kind === 'monthly' ? autoRenew : false,
                priceIrr: plan.priceIrr,
              })
              setDone(true)
            }}
          >
            تأیید خرید
          </button>
        </section>
      </div>
    </div>
  )
}

export function ModelHowItWorksPage() {
  const { modelId = '' } = useParams()
  const { models, wallet } = useMockStore()
  const model = getModel(modelId, models)
  const seed = useMemo(
    () => keysForModelOrFallback(modelId, model?.apiKeyPlaceholder ?? 'portfolio_live_••••••••'),
    [modelId, model?.apiKeyPlaceholder],
  )
  const [keys, setKeys] = useState<ConsumerApiKeyRow[]>(seed)
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [editCapId, setEditCapId] = useState<string | null>(null)
  const [capDraft, setCapDraft] = useState('')
  const [editWarnId, setEditWarnId] = useState<string | null>(null)
  const [warnSoftDraft, setWarnSoftDraft] = useState('70')
  const [warnElevDraft, setWarnElevDraft] = useState('90')

  useEffect(() => {
    setKeys(seed)
    setRevealedId(null)
    setEditCapId(null)
    setEditWarnId(null)
  }, [seed])

  if (!model) return <Navigate to="/account" replace />

  const activeCount = keys.filter((k) => k.status === 'active').length
  const isMultiKey = keys.length > 1 || keys.some((k) => k.issueMode === 'org-admin')
  const accountWarn = {
    budgetWarnPctSoft: wallet.budgetWarnPctSoft,
    budgetWarnPctElevated: wallet.budgetWarnPctElevated,
  }
  const keyAlerts = keys
    .map((k) => ({ key: k, alert: keyBudgetAlert(k, accountWarn) }))
    .filter((x) => x.alert.level !== 'none')

  function saveCap(keyId: string) {
    const n = Number(capDraft.replace(/,/g, ''))
    if (!Number.isFinite(n) || n < 0) return
    setKeys((prev) =>
      prev.map((k) =>
        k.id === keyId ? { ...k, overallBudgetCapIrr: Math.round(n) } : k,
      ),
    )
    setEditCapId(null)
  }

  function saveWarn(keyId: string) {
    const soft = Math.min(99, Math.max(1, Number(warnSoftDraft) || 70))
    const elev = Math.min(99, Math.max(soft + 1, Number(warnElevDraft) || 90))
    setKeys((prev) =>
      prev.map((k) =>
        k.id === keyId ? { ...k, warnPctSoft: soft, warnPctElevated: elev } : k,
      ),
    )
    setEditWarnId(null)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>کلید دسترسی</span>
      </div>
      <PageHeader
        title="مدیریت کلید دسترسی"
        eyebrow="یکپارچه‌سازی"
        description="فقط‌کلید · صف همگامی به ازای هویت خریدار · تنها کار اصلی داخل پلتفرم نمونه برای مصرف‌کننده کوئری‌ساز"
      />
      <StatusBanner tone="info">
        ۱) کلید را در نرم‌افزار مدل‌ساز بگذارید ۲) درخواست از همان نرم‌افزار ۳) مدل کوئری می‌دهد ۴)
        نرم‌افزار اجرا و نتیجه را نشان می‌دهد. فرایند داخل نرم‌افزار مقصد با پلتفرم نمونه نیست.
      </StatusBanner>

      <section className="panel stack">
        <h2 className="panel-title">حالت‌های صدور کلید (الف / ب)</h2>
        <ul style={{ margin: 0, paddingInlineStart: '1.2rem' }}>
          <li>
            <strong>الف — کلید شخصی:</strong> هر کاربر نهایی خودش کاربر پلتفرم نمونه است، مدل را خریده، و{' '}
            <strong>کلید دسترسی خودش</strong> را دارد (کیف پول و entitlement خودش).
          </li>
          <li>
            <strong>ب — کلید سازمانی:</strong> یک ادمین خریدار مدل است و برای کارکنان کلید می‌سازد؛
            کارکنان لازم نیست کاربر جداگانه پلتفرم نمونه باشند. مصرف از <strong>کیف پول مشترک</strong> همان
            هویت خریدار کسر می‌شود.
          </li>
        </ul>
        <p className="meta" style={{ margin: 0 }}>
          در هر دو حالت صف هم‌زمانی ۳ و سقف ۲۰ کلید روی <strong>هویت خریدار</strong> است — نه به ازای
          کلید. ساخت کلید زیاد ظرفیت موازی نمی‌دهد.
        </p>
      </section>

      <StatusBanner tone="warn">
        رمز کلید فقط یک‌بار نمایش داده می‌شود. در حالت ب (چند کلید) سقف بودجه{' '}
        <strong>کلی / تجمعی به ازای کلید</strong> الزامی است — روزانه نیست؛ فقط همان کلید را متوقف می‌کند.
      </StatusBanner>

      {keyAlerts.map(({ key: k, alert }) =>
        alert.level === 'capped' ? (
          <StatusBanner key={k.id} tone="danger">
            کلید «{k.label}»: سقف بودجه کلی پر شد — متوقف ({alert.pct}٪). سایر کلیدها تحت تأثیر نیستند.
          </StatusBanner>
        ) : alert.level === 'elevated' ? (
          <StatusBanner key={k.id} tone="warn">
            کلید «{k.label}»: {alert.pct}٪ سقف کلی (آستانه {alert.elevated}٪) — هنوز قابل‌استفاده؛
            نزدیک سقف سخت.
          </StatusBanner>
        ) : (
          <StatusBanner key={k.id} tone="info">
            کلید «{k.label}»: {alert.pct}٪ سقف کلی (آستانه {alert.soft}٪) — هنوز قابل‌استفاده.
          </StatusBanner>
        ),
      )}

      <div className="stat-grid compact-stats">
        <div className="stat-card">
          <span className="meta">هم‌زمانی هویت</span>
          <strong>۳</strong>
        </div>
        <div className="stat-card">
          <span className="meta">کلید فعال / سقف</span>
          <strong>
            {activeCount} / ۲۰
          </strong>
        </div>
        <div className="stat-card">
          <span className="meta">حالت غالب دمو</span>
          <strong style={{ fontSize: '1rem' }}>{isMultiKey ? 'ب · سازمانی' : 'الف · شخصی'}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">آستانه حساب</span>
          <strong style={{ fontSize: '1rem' }}>
            {accountWarn.budgetWarnPctSoft}٪ / {accountWarn.budgetWarnPctElevated}٪
          </strong>
        </div>
      </div>

      <section className="panel table-wrap" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">کلیدهای فعال (mock)</h2>
        {keys.length === 0 ? (
          <EmptyState
            title="کلیدی نیست"
            hint="کلید نمونه در seed این مدل تعریف نشده."
          />
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>برچسب</th>
                <th>حالت</th>
                <th>رمز</th>
                <th>سقف بودجه کلی</th>
                <th>مانده</th>
                <th>آستانه هشدار</th>
                <th>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const rem = remainingBudgetIrr(k)
                const showBudget = k.issueMode === 'org-admin' || keys.length > 1
                const alert = keyBudgetAlert(k, accountWarn)
                const inherited = k.warnPctSoft == null && k.warnPctElevated == null
                return (
                  <tr key={k.id}>
                    <td>
                      {k.label}
                      <div className="meta">{k.status === 'active' ? 'فعال' : 'باطل'}</div>
                    </td>
                    <td>{k.issueMode === 'self' ? 'الف' : 'ب'}</td>
                    <td>
                      {revealedId === k.id ? (
                        <code className="mono">{k.maskedSecret.replace('••••••••', '_LIVE_ONCE_')}</code>
                      ) : (
                        <code className="mono">{k.maskedSecret}</code>
                      )}
                    </td>
                    <td>
                      {editCapId === k.id ? (
                        <div className="btn-row" style={{ alignItems: 'center' }}>
                          <input
                            style={{ maxWidth: 140 }}
                            value={capDraft}
                            onChange={(e) => setCapDraft(e.target.value)}
                            inputMode="numeric"
                          />
                          <button type="button" className="btn btn-primary" onClick={() => saveCap(k.id)}>
                            ذخیره
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setEditCapId(null)}
                          >
                            انصراف
                          </button>
                        </div>
                      ) : k.overallBudgetCapIrr == null ? (
                        <span className="meta">بدون سقف</span>
                      ) : (
                        formatIrr(k.overallBudgetCapIrr)
                      )}
                    </td>
                    <td>
                      {rem == null ? (
                        '—'
                      ) : rem === 0 ? (
                        <StatusBadge tone="warn">۰ — متوقف</StatusBadge>
                      ) : (
                        <>
                          {formatIrr(rem)}
                          {alert.pct != null ? (
                            <div className="meta">{alert.pct}٪ مصرف</div>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td>
                      {editWarnId === k.id ? (
                        <div className="stack" style={{ gap: 4 }}>
                          <input
                            style={{ maxWidth: 72 }}
                            value={warnSoftDraft}
                            onChange={(e) => setWarnSoftDraft(e.target.value)}
                            inputMode="numeric"
                            aria-label="آستانه نرم"
                          />
                          <input
                            style={{ maxWidth: 72 }}
                            value={warnElevDraft}
                            onChange={(e) => setWarnElevDraft(e.target.value)}
                            inputMode="numeric"
                            aria-label="آستانه نزدیک"
                          />
                          <div className="btn-row">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => saveWarn(k.id)}
                            >
                              ذخیره
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => setEditWarnId(null)}
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="meta">
                          {alert.soft}٪ / {alert.elevated}٪
                          {inherited ? ' · ارث حساب' : ' · کلید'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={revealedId === k.id}
                          onClick={() => setRevealedId(k.id)}
                        >
                          {revealedId === k.id ? 'نمایش‌شده' : 'نمایش یک‌بار'}
                        </button>
                        {showBudget ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setEditCapId(k.id)
                              setCapDraft(String(k.overallBudgetCapIrr ?? 1_000_000))
                            }}
                          >
                            تنظیم سقف
                          </button>
                        ) : null}
                        {k.overallBudgetCapIrr != null ? (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                              setEditWarnId(k.id)
                              setWarnSoftDraft(String(alert.soft))
                              setWarnElevDraft(String(alert.elevated))
                            }}
                          >
                            آستانه هشدار
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {isMultiKey ? (
          <p className="meta">
            سقف بودجه کلی به ازای کلید در برابر کیف پول مشترک است؛ پر شدن سقف فقط همان کلید را متوقف
            می‌کند. هشدار ۷۰٪/۹۰٪ نرم است تا ۱۰۰٪. پیش‌فرض حساب از{' '}
            <Link to="/account/wallet">کیف پول</Link>؛ override سبک روی کلید.
          </p>
        ) : null}
      </section>

      <div className="btn-row" style={{ marginTop: '0.75rem' }}>
        <Link className="btn btn-secondary" to={`/account/models/${model.id}/connect-guide`}>
          راهنمای اتصال
        </Link>
        <Link className="btn btn-ghost" to={`/account/models/${model.id}/usage`}>
          مصرف به ازای کلید
        </Link>
      </div>
      <p className="meta">
        شبیه‌ساز درخواست داخل پلتفرم نمونه مسیر رسمی نیست:{' '}
        <Link to={`/account/models/${model.id}/request`}>باز کردن شبیه‌ساز غیررسمی</Link>
      </p>
    </div>
  )
}

export function ModelConnectGuidePage() {
  const { modelId = '' } = useParams()
  const { models, creatorInstances } = useMockStore()
  const model = getModel(modelId, models)
  const [copied, setCopied] = useState(false)
  if (!model) return <Navigate to="/account" replace />

  const instance = creatorInstances.find((i) => i.linkedModelId === model.id)
  const pathSlug = instance?.pathSlug ?? `model-${model.id.slice(-6)}`
  const markdown = reportBuilderConnectGuideMarkdown(pathSlug, model.name)
  const invokeUrl = `https://api.example.invalid/service/${pathSlug}/v1/invoke`

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>راهنمای اتصال</span>
      </div>
      <PageHeader
        title="راهنمای اتصال"
        eyebrow="یکپارچه‌سازی · زنده"
        description="پوسته پلتفرم نمونه + محتوای سرویس کوئری‌ساز · pathSlug تزریق‌شده از پلتفرم"
      />
      <StatusBanner tone="info">
        متن و snippet زیر از <strong>مشارکت سرویس</strong> است. پلتفرم نمونه فقط صفحه را میزبانی می‌کند و
        آدرس اختصاصی (<code className="mono">{pathSlug}</code>) را تزریق می‌کند.
      </StatusBanner>
      <StatusBanner tone="warn">
        قرار دادن کلید دسترسی در نرم‌افزار مقصد کار یکپارچه‌ساز است — پلتفرم نمونه کلید را آنجا نصب نمی‌کند.{' '}
        <Link to={`/account/models/${model.id}/how-it-works`}>مدیریت کلید دسترسی</Link>
      </StatusBanner>

      <section className="panel stack">
        <h2 className="panel-title">مقادیر تزریق‌شدهٔ پلتفرم</h2>
        <div className="field">
          <label>pathSlug</label>
          <div className="btn-row" style={{ alignItems: 'center' }}>
            <code className="mono">{pathSlug}</code>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(pathSlug)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? 'کپی شد' : 'کپی pathSlug'}
            </button>
          </div>
        </div>
        <div className="field">
          <label>URL فراخوانی</label>
          <code className="mono" style={{ display: 'block' }}>
            {invokeUrl}
          </code>
        </div>
      </section>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">محتوای سرویس (markdown mock)</h2>
        <pre className="query-box" style={{ whiteSpace: 'pre-wrap' }}>
          {markdown}
        </pre>
      </section>
    </div>
  )
}

export function ModelComplaintPage() {
  const { modelId = '' } = useParams()
  const { models, addComplaint } = useMockStore()
  const model = getModel(modelId, models)
  const [done, setDone] = useState(false)
  if (!model) return <Navigate to="/account" replace />
  return (
    <div>
      <div className="breadcrumb">
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>شکایت</span>
      </div>
      <PageHeader
        title="شکایت از مدل‌ساز"
        description="بدون تعهد نتیجه از پلتفرم به مصرف‌کننده نهایی"
      />
      {done ? (
        <StatusBanner tone="info">شکایت ثبت شد (mock).</StatusBanner>
      ) : (
        <form
          className="panel stack"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            addComplaint({
              modelId: model.id,
              modelName: model.name,
              reason: String(fd.get('reason') ?? ''),
              body: String(fd.get('detail') ?? ''),
            })
            setDone(true)
          }}
        >
          <div className="field">
            <label>دلیل</label>
            <select name="reason" required defaultValue="">
              <option value="" disabled>
                انتخاب
              </option>
              <option value="quality">کیفیت</option>
              <option value="support">پشتیبانی</option>
              <option value="other">سایر</option>
            </select>
          </div>
          <div className="field">
            <label>شرح</label>
            <textarea name="detail" required />
          </div>
          <button type="submit" className="btn btn-primary">
            ارسال
          </button>
        </form>
      )}
    </div>
  )
}

export function AccountRequestDetailPage() {
  const { requestId = '' } = useParams()
  const { requests, models, markDelivered } = useMockStore()
  const req = requests.find((r) => r.id === requestId)
  const model = req ? getModel(req.modelId, models) : undefined
  if (!req || !model) {
    return (
      <div>
        <PageHeader title="درخواست یافت نشد" />
        <Link to="/account">میز کار</Link>
      </div>
    )
  }
  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>{req.id}</span>
      </div>
      <PageHeader title="وضعیت فراخوانی (شبیه‌ساز ارائه)" description={requestStatusLabel(req.status)} />
      <StatusBanner tone="warn">
        مسیر رسمی = نرم‌افزار مقصد + کلید دسترسی. این صفحه فقط نمایش دموی رزرو/کوئری/ریال است.
      </StatusBanner>
      <StatusBanner tone="info">
        متر قیمت: <strong>توکن</strong> — پلتفرم نمونه به ریال تبدیل و از کیف پول کم می‌کند. شمارنده درخواست فقط
        شمارنده است. سرویس پول کم نمی‌کند.
      </StatusBanner>
      {req.deliveryNote ? (
        <StatusBanner tone={req.status === 'delivered' ? 'ok' : 'info'}>
          {req.deliveryNote}
        </StatusBanner>
      ) : null}
      <section className="panel stack">
        <p>
          <strong>سؤال:</strong> {req.question}
        </p>
        <PriceBreakdown base={req.baseIrr} markup={req.markupIrr} />
        {req.status === 'query-ready' ? (
          <button type="button" className="btn btn-primary" onClick={() => markDelivered(req.id)}>
            شبیه‌سازی تحویل محلی
          </button>
        ) : null}
      </section>
      {req.returnedQuery ? (
        <section className="panel" style={{ marginTop: '0.9rem' }}>
          <h2 className="panel-title">کوئری بازگشتی</h2>
          <pre className="query-box">{req.returnedQuery}</pre>
        </section>
      ) : null}
    </div>
  )
}

/** کشف مدل‌ها در فضای حساب */
export function AccountDiscoverPage() {
  const { models } = useMockStore()
  const [q, setQ] = useState('')
  const filtered = models.filter((m) => {
    if (m.publishStatus !== 'published') return false
    const hay = `${m.name} ${m.summary} ${m.creatorName}`.toLowerCase()
    return !q || hay.includes(q.trim().toLowerCase())
  })
  const draftHidden = models.filter((m) => m.publishStatus !== 'published').length
  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <span>کشف مدل‌ها</span>
      </div>
      <PageHeader
        title="کشف مدل‌ها"
        description="فقط مدل‌های منتشرشده توسط سازنده · قیمت پایه + حاشیه · برجسته‌سازی فعلاً نیست"
      />
      {draftHidden > 0 ? (
        <StatusBanner tone="info">
          {draftHidden.toLocaleString('fa-IR')} مدل پیش‌نویس از کاتالوگ کشف پنهان است (دروازه انتشار
          سازنده).
        </StatusBanner>
      ) : null}
      <div className="filter-bar panel">
        <div className="field">
          <label>جستجو</label>
          <input value={q} onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="grid-cards">
        {filtered.map((m) => {
          const c = estimateCharge(m)
          return (
            <article key={m.id} className="catalog-card">
              <h3>{m.name}</h3>
              <span className="meta">{m.creatorName}</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{m.summary}</p>
              <PriceBreakdown base={c.base} markup={c.markup} />
              <Link className="btn btn-primary" to={`/account/models/${m.id}`}>
                استفاده و مدیریت
              </Link>
            </article>
          )
        })}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="مدل منتشرشده‌ای یافت نشد" hint="فیلتر جستجو را پاک کنید یا صبر کنید تا سازنده منتشر کند." />
      ) : null}
    </div>
  )
}
