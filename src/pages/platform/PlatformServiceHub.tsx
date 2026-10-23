import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMockStore } from '../../data/MockStore'
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  StatusBanner,
} from '../../components/ui/Primitives'
import { ServiceTokenUsageReportView } from '../../components/ServiceTokenUsageReport'
import { ReportBuilderCapacityFields } from '../../components/platform/ReportBuilderCapacityFields'
import {
  emptyReportBuilderCapacity,
  formatReportBuilderCapacitySummary,
  isReportBuilderService,
  normalizeReportBuilderCapacity,
  type ReportBuilderServicePlanCapacity,
} from '../../data/reportBuilderPlanCapacity'
import {
  PLATFORM_METER_OPTIONS,
  primaryServiceBaseIrr,
} from '../../data/platform'
import { getPlatformServiceTokenUsage } from '../../data/serviceTokenUsage'
import { formatIrr } from '../../lib/format'

type ServiceHubSection =
  | 'overview'
  | 'pricing'
  | 'plans'
  | 'provision'
  | 'payout'
  | 'usage'

const HUB_SECTIONS: ServiceHubSection[] = [
  'overview',
  'pricing',
  'plans',
  'provision',
  'payout',
  'usage',
]

const SECTION_TITLES: Record<ServiceHubSection, string> = {
  overview: 'نمای کلی',
  pricing: 'قیمت پایه و متر',
  plans: 'تعریف پلن‌ها',
  provision: 'نصب راه دور',
  payout: 'قواعد وصول',
  usage: 'مصرف توکن',
}

function resolveSection(raw: string | undefined): ServiceHubSection {
  if (raw && HUB_SECTIONS.includes(raw as ServiceHubSection)) {
    return raw as ServiceHubSection
  }
  return 'overview'
}

export function PlatformServiceHubPage() {
  const { serviceId = '', section: sectionParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const {
    services,
    servicePlans,
    upsertService,
    upsertServicePlan,
    payoutRules,
    updatePayoutRule,
    provisionJobs,
    upsertProvisionJob,
    advanceProvisionJob,
  } = useMockStore()

  const service = services.find((s) => s.id === serviceId)
  const plans = servicePlans.filter((p) => p.serviceId === serviceId)
  const payout = payoutRules.find((r) => r.serviceId === serviceId)
  const jobs = useMemo(
    () => (service ? provisionJobs.filter((j) => j.serviceName === service.name) : []),
    [provisionJobs, service],
  )

  /** سازگاری لینک‌های قدیمی ?tab= */
  const legacyTab = searchParams.get('tab')
  const legacyRedirect =
    legacyTab &&
    HUB_SECTIONS.includes(legacyTab as ServiceHubSection) &&
    !sectionParam
      ? legacyTab === 'overview'
        ? `/platform/services/${serviceId}`
        : `/platform/services/${serviceId}/${legacyTab}`
      : null

  const tab = resolveSection(sectionParam)

  const isReportBuilder = isReportBuilderService(serviceId, service?.name)
  const [planName, setPlanName] = useState('پلن جدید')
  const [planPrice, setPlanPrice] = useState('10000000')
  const [planCapacity, setPlanCapacity] = useState<ReportBuilderServicePlanCapacity>(() =>
    emptyReportBuilderCapacity(),
  )
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planMsg, setPlanMsg] = useState<string | null>(null)

  const [versionLabel, setVersionLabel] = useState('v1.0')
  const [baseUrl, setBaseUrl] = useState('')
  const [contractVersion, setContractVersion] = useState('portfolio-integration-1')
  const [healthPath, setHealthPath] = useState('/health')
  const [timeoutSec, setTimeoutSec] = useState(30)
  const [environment, setEnvironment] = useState<'staging' | 'production'>('production')
  const [consumerSurface, setConsumerSurface] = useState<
    'api-key-only' | 'embedded-ui' | 'hybrid'
  >('api-key-only')
  const [notes, setNotes] = useState('')
  const [provMsg, setProvMsg] = useState<string | null>(null)
  const [lastSecret, setLastSecret] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [days, setDays] = useState('')
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null)

  const [noConsumptionMeter, setNoConsumptionMeter] = useState(false)
  const [selectedMeters, setSelectedMeters] = useState<string[]>([])
  const [baseDraft, setBaseDraft] = useState<Record<string, string>>({})
  const [pricingMsg, setPricingMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!payout) return
    setAmount(String(payout.minAmountIrr))
    setDays(String(payout.minDays))
  }, [payout])

  useEffect(() => {
    if (!service) return
    const rb = isReportBuilderService(service.id, service.name)
    if (rb) {
      setNoConsumptionMeter(false)
      setSelectedMeters(['AI.Token'])
      setBaseDraft({
        'AI.Token': String(service.baseByMeterIrr['AI.Token'] ?? service.basePriceIrr ?? ''),
      })
    } else {
      const none = service.meters.length === 0
      setNoConsumptionMeter(none)
      setSelectedMeters([...service.meters])
      const draft: Record<string, string> = {}
      for (const m of service.meters) {
        draft[m] = String(service.baseByMeterIrr[m] ?? '')
      }
      setBaseDraft(draft)
    }
    setPricingMsg(null)
  }, [service])

  if (legacyRedirect) {
    return <Navigate to={legacyRedirect} replace />
  }

  if (!service) {
    return (
      <div>
        <PageHeader title="سرویس یافت نشد" />
        <Link to="/platform/services">بازگشت به فهرست سرویس‌ها</Link>
      </div>
    )
  }

  function setTab(next: ServiceHubSection) {
    const path =
      next === 'overview'
        ? `/platform/services/${serviceId}`
        : `/platform/services/${serviceId}/${next}`
    navigate(path, { replace: true })
  }

  function toggleMeter(key: string) {
    setSelectedMeters((prev) => {
      if (prev.includes(key)) {
        const next = prev.filter((m) => m !== key)
        setBaseDraft((d) => {
          const copy = { ...d }
          delete copy[key]
          return copy
        })
        return next
      }
      setBaseDraft((d) => ({ ...d, [key]: d[key] ?? '' }))
      return [...prev, key]
    })
  }

  function savePricing() {
    if (!service) return
    const meters = isReportBuilder
      ? ['AI.Token']
      : noConsumptionMeter
        ? []
        : selectedMeters
    const baseByMeterIrr: Record<string, number> = {}
    if (meters.length > 0) {
      for (const m of meters) {
        const n = Number(baseDraft[m])
        if (Number.isFinite(n) && n > 0) baseByMeterIrr[m] = n
      }
    }
    upsertService({
      id: service.id,
      name: service.name,
      status: service.status,
      description: service.description,
      meters,
      baseByMeterIrr,
      basePriceIrr: primaryServiceBaseIrr(meters, baseByMeterIrr),
    })
    setPricingMsg(
      isReportBuilder
        ? 'قیمت پایه توکن ذخیره شد (دمو).'
        : noConsumptionMeter
          ? 'بدون متر مصرف ذخیره شد — قیمت پایه مصرفی تعریف نشده (دمو).'
          : 'قیمت پایه و مترها ذخیره شد (دمو).',
    )
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/platform/services">مدیریت سرویس‌ها</Link>
        <span>/</span>
        <span>{service.name}</span>
        {tab !== 'overview' ? (
          <>
            <span>/</span>
            <span>{SECTION_TITLES[tab]}</span>
          </>
        ) : null}
      </div>
      <PageHeader
        eyebrow="پنل سرویس"
        title={service.name}
        description={
          tab === 'overview'
            ? 'فضای اختصاصی همین سرویس — منوی کناری فقط برای این سرویس است، نه کل پلتفرم'
            : SECTION_TITLES[tab]
        }
      />

      {tab === 'overview' ? (
        <div className="detail-grid two">
          <section className="panel stack">
            <h2 className="panel-title">هویت و مانیفست</h2>
            <p>{service.description}</p>
            <p>
              قیمت پایه مصرف (نمایشی):{' '}
              <strong>
                {service.meters.length === 0
                  ? 'بدون متر مصرف'
                  : formatIrr(service.basePriceIrr)}
              </strong>
            </p>
            <p className="meta">
              مترها:{' '}
              {service.meters.length === 0 ? (
                <span>بدون متر مصرف</span>
              ) : (
                service.meters.map((m) => {
                  const opt = PLATFORM_METER_OPTIONS.find((o) => o.key === m)
                  return (
                    <code key={m} className="mono meter-chip">
                      {opt?.label ?? m}
                      {service.baseByMeterIrr[m] != null
                        ? ` · ${formatIrr(service.baseByMeterIrr[m]!)}`
                        : ''}
                    </code>
                  )
                })
              )}
            </p>
            {isReportBuilder ? (
              <p className="meta" style={{ margin: 0 }}>
                متر قیمت: <strong>توکن</strong> · سقف شمارنده درخواست روی پلن (نه متر قیمت)
              </p>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setTab('pricing')}
            >
              ویرایش قیمت پایه و متر
            </button>
            <StatusBadge
              tone={
                service.status === 'published'
                  ? 'ok'
                  : service.status === 'draft'
                    ? 'muted'
                    : 'warn'
              }
            >
              {service.status === 'published'
                ? 'منتشر'
                : service.status === 'draft'
                  ? 'پیش‌نویس'
                  : 'تعلیق'}
            </StatusBadge>
          </section>
          <section className="panel stack">
            <h2 className="panel-title">خلاصه تنظیمات</h2>
            <ul className="plain-list">
              <li>
                پلن‌ها: <strong>{plans.length}</strong>{' '}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('plans')}>
                  مدیریت
                </button>
              </li>
              <li>
                نصب‌ها: <strong>{jobs.length}</strong>{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTab('provision')}
                >
                  مدیریت
                </button>
              </li>
              <li>
                وصول:{' '}
                {payout ? (
                  <span className="meta">
                    حداقل {formatIrr(payout.minAmountIrr)} یا {payout.minDays} روز
                  </span>
                ) : (
                  <span className="meta">تعریف نشده</span>
                )}{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTab('payout')}
                >
                  ویرایش
                </button>
              </li>
              <li>
                مصرف توکن:{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTab('usage')}
                >
                  گزارش این سرویس
                </button>
              </li>
            </ul>
            <p className="meta" style={{ margin: 0 }}>
              پلن پشتیبانی مدل را مدل‌ساز در فضای سرویس خریداری‌شده تعریف می‌کند (ADR-011) — نه از
              منوی جداگانه مدیرعامل.
            </p>
          </section>
        </div>
      ) : null}

      {tab === 'pricing' ? (
        <div className="stack section-stack">
          <StatusBanner tone="info">
            <strong>قیمت پایه</strong> نرخ مصرف پلتفرم روی متر اعلام‌شدهٔ همین سرویس است — جدا از{' '}
            <strong>قیمت خرید پلن</strong> در تب «تعریف پلن‌ها». مصرف‌کننده مفهوماً{' '}
            <strong>قیمت پایه + حاشیه مدل‌ساز</strong> می‌پردازد.
          </StatusBanner>
          <section className="panel stack">
            <h2 className="panel-title">قیمت پایه و متر</h2>
            {isReportBuilder ? (
              <>
                <StatusBanner tone="info">
                  کوئری‌ساز: فقط متر قیمت <strong>توکن</strong>. درخواست در این تب نیست — سقف شمارنده
                  درخواست روی پلن (تب «تعریف پلن‌ها») است، نه قیمت پایه.
                </StatusBanner>
                <div className="field" style={{ maxWidth: 320 }}>
                  <label htmlFor="base-AI.Token">قیمت پایه برای توکن (ریال / واحد)</label>
                  <input
                    id="base-AI.Token"
                    type="number"
                    min={0}
                    value={baseDraft['AI.Token'] ?? ''}
                    onChange={(e) =>
                      setBaseDraft((d) => ({ ...d, 'AI.Token': e.target.value }))
                    }
                    placeholder="مثلاً 8500"
                  />
                </div>
              </>
            ) : (
              <>
                <p className="meta" style={{ margin: 0 }}>
                  خودِ سرویس تصمیم می‌گیرد کدام متر(ها) را اعلام کند، یا اصلاً متر مصرف نداشته
                  باشد. پلتفرم فقط قیمت پایه ریالی را روی مترهای اعلام‌شده پیکربندی می‌کند.
                </p>

                <label
                  className="check-row"
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
                >
                  <input
                    type="checkbox"
                    checked={noConsumptionMeter}
                    onChange={(e) => {
                      const on = e.target.checked
                      setNoConsumptionMeter(on)
                      if (on) {
                        setSelectedMeters([])
                        setBaseDraft({})
                      }
                    }}
                  />
                  <span>
                    <strong>بدون متر مصرف</strong>
                    <div className="meta">
                      سرویس اعلام می‌کند مصرف قابل اندازه‌گیری برای صورتحساب قیمت پایه ندارد (مثلاً فقط
                      فروش ظرفیت پلن). در این حالت قیمت پایه مصرفی تعریف نمی‌شود.
                    </div>
                  </span>
                </label>

                {!noConsumptionMeter ? (
                  <>
                    <fieldset className="stack" style={{ border: 'none', padding: 0, margin: 0 }}>
                      <legend className="panel-title" style={{ fontSize: '1rem' }}>
                        مترهای اعلام‌شده
                      </legend>
                      <div className="detail-grid two">
                        {PLATFORM_METER_OPTIONS.map((opt) => {
                          const checked = selectedMeters.includes(opt.key)
                          return (
                            <label
                              key={opt.key}
                              className="check-row"
                              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMeter(opt.key)}
                              />
                              <span>{opt.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>

                    {selectedMeters.length === 0 ? (
                      <StatusBanner tone="warn">
                        حداقل یک متر انتخاب کنید، یا گزینه «بدون متر مصرف» را روشن کنید.
                      </StatusBanner>
                    ) : (
                      <div className="stack">
                        <h3 className="panel-title" style={{ fontSize: '1rem' }}>
                          قیمت پایه ریالی به ازای واحد هر متر
                        </h3>
                        <div className="detail-grid two">
                          {selectedMeters.map((m) => {
                            const opt = PLATFORM_METER_OPTIONS.find((o) => o.key === m)
                            return (
                              <div className="field" key={m}>
                                <label htmlFor={`base-${m}`}>
                                  قیمت پایه برای {opt?.label ?? m} (ریال / واحد)
                                </label>
                                <input
                                  id={`base-${m}`}
                                  type="number"
                                  min={0}
                                  value={baseDraft[m] ?? ''}
                                  onChange={(e) =>
                                    setBaseDraft((d) => ({ ...d, [m]: e.target.value }))
                                  }
                                  placeholder="مثلاً 8500"
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </>
            )}

            <StatusBanner tone="info">
              مدل‌ساز پایه را عوض نمی‌کند؛ می‌تواند <strong>حاشیه مدل‌ساز</strong> اضافه کند تا سهم خودش از
              مصرف به <strong>صندوق درآمد مدل‌ساز</strong> برود. تعریف حاشیه در فضای نمونه سرویس
              خریداری‌شده است — مسیر مفهومی:{' '}
              <Link to="/account/services">حساب → سرویس‌های من → نمونه → حاشیه</Link>.
            </StatusBanner>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  isReportBuilder
                    ? !baseDraft['AI.Token']
                    : !noConsumptionMeter && selectedMeters.length === 0
                }
                onClick={savePricing}
              >
                ذخیره قیمت پایه و متر
              </button>
            </div>
            {pricingMsg ? <StatusBanner tone="ok">{pricingMsg}</StatusBanner> : null}
          </section>
        </div>
      ) : null}

      {tab === 'plans' ? (
        <div className="stack section-stack">
          <form
            className="panel stack"
            onSubmit={(e) => {
              e.preventDefault()
              const capacitySummary = isReportBuilder
                ? formatReportBuilderCapacitySummary(planCapacity)
                : '۱ نمونه · تعریف‌شده در دمو'
              const existing = editingPlanId
                ? plans.find((x) => x.id === editingPlanId)
                : undefined
              upsertServicePlan({
                ...(editingPlanId ? { id: editingPlanId } : {}),
                serviceId: service.id,
                serviceName: service.name,
                name: planName.trim() || 'پلن جدید',
                priceIrr: Number(planPrice) || 0,
                status: existing?.status ?? 'active',
                capacitySummary,
                ...(isReportBuilder ? { reportBuilderCapacity: planCapacity } : {}),
              })
              setPlanMsg(editingPlanId ? 'پلن به‌روزرسانی شد (دمو).' : 'پلن ذخیره شد (دمو).')
              setEditingPlanId(null)
              setPlanName('پلن جدید')
              setPlanPrice('10000000')
              if (isReportBuilder) setPlanCapacity(emptyReportBuilderCapacity())
            }}
          >
            <h2 className="panel-title">
              {editingPlanId ? 'ویرایش پلن' : 'ایجاد پلن'} برای «{service.name}»
            </h2>
            <StatusBanner tone="info">
              قیمت این فرم = <strong>خرید پلن ظرفیت</strong> توسط مدل‌ساز — نه قیمت پایه مصرف متر. قیمت پایه را
              از تب «قیمت پایه و متر» تنظیم کنید.
            </StatusBanner>
            {isReportBuilder ? (
              <StatusBanner tone="info">
                هر بُعد ظرفیت: نامحدود / بدون سقف یا مقدار محدود عددی. خرید = یک نمونه
                جدا؛ مسیر نمونه سطح نمونه است نه فیلد این فرم.
              </StatusBanner>
            ) : null}
            <div className="form-row">
              <div className="field">
                <label htmlFor="hub-plan-n">نام پلن</label>
                <input
                  id="hub-plan-n"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="field" style={{ maxWidth: 220 }}>
                <label htmlFor="hub-plan-p">قیمت خرید پلن (ریال)</label>
                <input
                  id="hub-plan-p"
                  type="number"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                />
              </div>
            </div>
            {isReportBuilder ? (
              <ReportBuilderCapacityFields value={planCapacity} onChange={setPlanCapacity} />
            ) : (
              <p className="meta" style={{ margin: 0 }}>
                برای این سرویس فرم ظرفیت اختصاصی در دمو نیست — فقط نام و قیمت.
              </p>
            )}
            <div className="btn-row">
              <button type="submit" className="btn btn-primary">
                {editingPlanId ? 'ذخیره تغییرات' : 'ذخیره پلن'}
              </button>
              {editingPlanId ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingPlanId(null)
                    setPlanName('پلن جدید')
                    setPlanPrice('10000000')
                    setPlanCapacity(emptyReportBuilderCapacity())
                    setPlanMsg(null)
                  }}
                >
                  انصراف از ویرایش
                </button>
              ) : null}
            </div>
            {planMsg ? <StatusBanner tone="ok">{planMsg}</StatusBanner> : null}
          </form>
          <div className="panel table-wrap">
            <h2 className="panel-title">پلن‌های این سرویس</h2>
            {plans.length === 0 ? (
              <EmptyState
                title="پلنی برای این سرویس نیست"
                hint="اولین پلن را با فرم بالا تعریف کنید."
              />
            ) : (
              <table className="data dense">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>قیمت خرید پلن</th>
                    <th>ظرفیت</th>
                    <th>وضعیت</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{formatIrr(p.priceIrr)}</td>
                      <td className="meta cell-wrap">{p.capacitySummary}</td>
                      <td>{p.status === 'active' ? 'فعال' : 'غیرفعال'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditingPlanId(p.id)
                            setPlanName(p.name)
                            setPlanPrice(String(p.priceIrr))
                            if (isReportBuilder && p.reportBuilderCapacity) {
                              setPlanCapacity(
                                normalizeReportBuilderCapacity(p.reportBuilderCapacity),
                              )
                            } else if (isReportBuilder) {
                              setPlanCapacity(emptyReportBuilderCapacity())
                            }
                            setPlanMsg(null)
                          }}
                        >
                          ویرایش
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'provision' ? (
        <div className="stack section-stack">
          <StatusBanner tone="info">
            نصب فقط برای «{service.name}». رمز/امضای اتصال فقط برای پلتفرم نمونه؛ یک‌بار نمایش داده
            می‌شود و در تنظیمات همین سرویس می‌ماند (≠ کلید API مصرف‌کننده).
          </StatusBanner>
          <section className="panel stack">
            <h2 className="panel-title">ثبت / پیش‌نویس نصب Remote</h2>
            <div className="detail-grid two">
              <div className="field">
                <label>سرویس</label>
                <input value={service.name} readOnly />
              </div>
              <div className="field">
                <label htmlFor="hub-ver">برچسب نسخه</label>
                <input
                  id="hub-ver"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="hub-base">آدرس پایه سرور</label>
                <input
                  id="hub-base"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://svc.example.local"
                />
              </div>
              <div className="field">
                <label htmlFor="hub-cv">نسخه قرارداد الحاق</label>
                <input
                  id="hub-cv"
                  value={contractVersion}
                  onChange={(e) => setContractVersion(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="hub-hp">مسیر سلامت</label>
                <input
                  id="hub-hp"
                  value={healthPath}
                  onChange={(e) => setHealthPath(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="hub-to">مهلت پاسخ (ثانیه)</label>
                <input
                  id="hub-to"
                  type="number"
                  value={timeoutSec}
                  onChange={(e) => setTimeoutSec(Number(e.target.value) || 30)}
                />
              </div>
              <div className="field">
                <label htmlFor="hub-env">محیط</label>
                <select
                  id="hub-env"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as 'staging' | 'production')}
                >
                  <option value="production">اصلی</option>
                  <option value="staging">آزمایشی</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="hub-cs">سطح مصرف</label>
                <select
                  id="hub-cs"
                  value={consumerSurface}
                  onChange={(e) =>
                    setConsumerSurface(e.target.value as typeof consumerSurface)
                  }
                >
                  <option value="api-key-only">فقط کلید</option>
                  <option value="embedded-ui">واسط داخل پلتفرم نمونه</option>
                  <option value="hybrid">ترکیبی</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="hub-notes">یادداشت</label>
                <input
                  id="hub-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const secret = `portfolio-sec-${Math.random().toString(36).slice(2, 10)}`
                  const id = upsertProvisionJob({
                    serviceName: service.name,
                    versionLabel,
                    baseUrl,
                    endpoint: baseUrl,
                    contractVersion,
                    healthPath,
                    timeoutSec,
                    environment,
                    consumerSurface,
                    notes,
                    status: 'draft',
                    connectionSecretOnce: secret,
                    healthStatus: 'unknown',
                    blockHardDelete: false,
                  })
                  setLastSecret(secret)
                  setProvMsg(`پیش‌نویس ثبت شد (${id}). رمز فقط همین‌بار نشان داده می‌شود.`)
                }}
              >
                ذخیره پیش‌نویس + صدور رمز اتصال
              </button>
            </div>
            {lastSecret ? (
              <StatusBanner tone="warn">
                رمز اتصال (یک‌بار نمایش): <span className="mono">{lastSecret}</span>
              </StatusBanner>
            ) : null}
            {provMsg ? <StatusBanner tone="ok">{provMsg}</StatusBanner> : null}
          </section>
          <div className="panel table-wrap">
            <h2 className="panel-title">نصب‌های این سرویس</h2>
            <p className="meta">
              «دریافت نبض سلامت» روی همین فهرست Confirmed است — ویجت داشبورد فقط مکمل اختیاری.
            </p>
            {jobs.length === 0 ? (
              <EmptyState
                title="نصبی برای این سرویس ثبت نشده"
                hint="پیش‌نویس نصب را با فرم بالا ثبت کنید."
              />
            ) : (
              <table className="data dense">
                <thead>
                  <tr>
                    <th>نسخه</th>
                    <th>وضعیت</th>
                    <th>آدرس</th>
                    <th>سلامت</th>
                    <th>اقدام</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>
                        {j.versionLabel}
                        <div className="meta mono">{j.connectionId}</div>
                      </td>
                      <td>{j.status}</td>
                      <td className="meta">{j.baseUrl || j.endpoint || '—'}</td>
                      <td>
                        <StatusBadge
                          tone={
                            j.healthStatus === 'ok'
                              ? 'ok'
                              : j.healthStatus === 'down'
                                ? 'danger'
                                : j.healthStatus === 'degraded'
                                  ? 'warn'
                                  : 'muted'
                          }
                        >
                          {j.healthStatus ?? 'unknown'}
                        </StatusBadge>
                      </td>
                      <td>
                        <div className="btn-row" style={{ marginTop: 0 }}>
                          {j.status === 'draft' ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => advanceProvisionJob(j.id, 'active')}
                            >
                              فعال‌سازی
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              upsertProvisionJob({
                                ...j,
                                serviceName: j.serviceName,
                                versionLabel: j.versionLabel,
                                healthStatus: 'ok',
                                lastHealthAt: new Date().toISOString(),
                              })
                            }
                          >
                            دریافت نبض (دمو)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'payout' ? (
        <section className="panel stack">
          <h2 className="panel-title">قواعد وصول درآمد مدل‌ساز</h2>
          <p className="meta" style={{ margin: 0 }}>
            حداقل مبلغ یا حداقل زمان — هر کدام کافی است (فقط برای «{service.name}»)
          </p>
          {!payout ? (
            <StatusBanner tone="warn">قاعده وصول برای این سرویس تعریف نشده است.</StatusBanner>
          ) : (
            <>
              <div className="detail-grid two">
                <div className="field">
                  <label htmlFor="hub-min-amt">حداقل مبلغ (ریال)</label>
                  <input
                    id="hub-min-amt"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="hub-min-days">حداقل روز</label>
                  <input
                    id="hub-min-days"
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  updatePayoutRule(service.id, Number(amount) || 0, Number(days) || 0)
                  setPayoutMsg('قواعد وصول ذخیره شد (دمو).')
                }}
              >
                ذخیره قواعد وصول
              </button>
              {payoutMsg ? <StatusBanner tone="ok">{payoutMsg}</StatusBanner> : null}
            </>
          )}
        </section>
      ) : null}

      {tab === 'usage' ? (
        <ServiceTokenUsageReportView
          report={getPlatformServiceTokenUsage(service.id, service.name)}
          title="گزارش مصرف این سرویس"
        />
      ) : null}
    </div>
  )
}

/** فرود نرم مسیرهای سراسری قدیمی */
export function PlatformServiceSettingsRedirect({
  intent,
}: {
  intent: 'plans' | 'payout' | 'provision'
}) {
  const label =
    intent === 'plans' ? 'پلن‌ها' : intent === 'payout' ? 'قواعد وصول' : 'نصب Remote'
  const sectionHint =
    intent === 'plans' ? 'تعریف پلن‌ها' : intent === 'payout' ? 'قواعد وصول' : 'نصب راه دور'
  return (
    <div>
      <PageHeader
        title={`${label} داخل پنل هر سرویس است`}
        description="با رشد تعداد سرویس‌ها، صفحهٔ سراسری مخلوط دیگر UX اصلی نیست — وارد پنل همان سرویس شوید"
      />
      <StatusBanner tone="info">
        از فهرست سرویس‌ها یک سرویس را باز کنید؛ منوی کناری پنل سرویس شامل «{sectionHint}» است.
      </StatusBanner>
      <Link className="btn btn-primary" to="/platform/services">
        رفتن به فهرست سرویس‌ها
      </Link>
    </div>
  )
}
