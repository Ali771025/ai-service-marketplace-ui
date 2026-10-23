import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useMockStore } from '../../data/MockStore'
import { CREATOR_PLAN_CATALOG } from '../../data/creator'
import {
  PageHeader,
  StatusBadge,
  StatusBanner,
  EmptyState,
} from '../../components/ui/Primitives'
import { ServiceTokenUsageReportView } from '../../components/ServiceTokenUsageReport'
import { formatIrr } from '../../lib/format'
import { downloadCsv } from '../../lib/downloadCsv'
import { getInstanceHeadroomStrip } from '../../data/headroom'
import { HeadroomInstanceStrip } from '../../components/HeadroomDashboard'
import { getCreatorInstanceTokenUsage } from '../../data/serviceTokenUsage'

export function BuyPlansPage() {
  const { user } = useAuth()
  const { buyCreatorPlan } = useMockStore()
  const [msg, setMsg] = useState<string | null>(null)

  const plansByService = CREATOR_PLAN_CATALOG.reduce<
    { serviceName: string; plans: typeof CREATOR_PLAN_CATALOG }[]
  >((groups, plan) => {
    const existing = groups.find((g) => g.serviceName === plan.serviceName)
    if (existing) {
      existing.plans.push(plan)
    } else {
      groups.push({ serviceName: plan.serviceName, plans: [plan] })
    }
    return groups
  }, [])

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <span>خرید پلن سرویس</span>
      </div>
      <PageHeader
        eyebrow="بازار"
        title="خرید پلن سرویس"
        description="خرید ظرفیت از کاتالوگ پلتفرم نمونه — گروه‌بندی per سرویس · پس از خرید، نمونه در میز کار ظاهر می‌شود"
      />
      {msg ? <StatusBanner tone="ok">{msg}</StatusBanner> : null}
      <StatusBanner tone="info">
        استرداد خرید پلن در MVP نیست (Confirmed). اگر پرداخت درگاه ناموفق بود:{' '}
        <Link to="/account/exceptions">درخواست فعال‌سازی دستی به پلتفرم نمونه</Link>
      </StatusBanner>
      <div className="stack">
        {plansByService.map((group) => (
          <section key={group.serviceName} className="catalog-service-block">
            <div className="section-head">
              <h2 className="section-title">{group.serviceName}</h2>
              <span className="meta">{group.plans.length} پلن</span>
            </div>
            <div className="grid-cards">
              {group.plans.map((p) => (
                <article key={p.id} className="catalog-card">
                  <h3>{p.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{p.capacitySummary}</p>
                  <strong>{formatIrr(p.priceIrr)}</strong>
                  <p className="meta">صورت‌حساب صادر می‌شود · استرداد ندارد</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={p.status !== 'available'}
                    onClick={() => {
                      const r = buyCreatorPlan({
                        planId: p.id,
                        planName: p.name,
                        serviceName: p.serviceName,
                        priceIrr: p.priceIrr,
                        capacitySummary: p.capacitySummary,
                        buyerName: user?.displayName ?? 'خریدار',
                      })
                      if (r.ok) {
                        setMsg(`خرید انجام شد. نمونه ${r.instanceId} آماده مدیریت است.`)
                      }
                    }}
                  >
                    {p.status === 'available' ? 'خرید پلن' : 'ناموجود'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function ServiceHomePage() {
  const { instanceId = '' } = useParams()
  const { creatorInstances, creatorModels, updateInstancePathSlug } = useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const [slugDraft, setSlugDraft] = useState(instance?.pathSlug ?? '')
  const [slugMsg, setSlugMsg] = useState<string | null>(null)

  useEffect(() => {
    setSlugDraft(instance?.pathSlug ?? '')
  }, [instance?.pathSlug, instanceId])

  if (!instance) {
    return (
      <div>
        <PageHeader title="نمونه یافت نشد" />
        <Link to="/account">بازگشت به میز کار</Link>
      </div>
    )
  }
  const models = creatorModels.filter((m) => m.instanceId === instanceId)
  const publicPath = `/service/${instance.pathSlug}`
  const headroomStrip = getInstanceHeadroomStrip(instance.id)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <span>
          {instance.serviceName} · {instance.planName}
        </span>
      </div>
      <PageHeader
        eyebrow="فضای نمونه سرویس"
        title={instance.planName}
        description={`${instance.serviceName} · نمونه ${instance.id} — فضای مدیریت این سرویس (نه میز کار حساب و نه استفاده مصرف‌کننده)`}
      />
      <StatusBadge tone={instance.status === 'active' ? 'ok' : 'warn'}>
        {instance.status === 'active' ? 'فعال' : instance.status}
      </StatusBadge>

      {headroomStrip ? <HeadroomInstanceStrip strip={headroomStrip} /> : null}

      <StatusBanner tone="warn">
        جداسازی نمونه: این نمونه از سایر پلن‌های خریداری‌شده کاملاً جداست؛ دانش مشترک نیست؛ آدرس
        اختصاصی یکتا است.
      </StatusBanner>

      <section className="panel stack" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">آدرس اختصاصی این نمونه</h2>
        <p className="meta" style={{ margin: 0 }}>
          طبق چارچوب پلتفرم نمونه، مدل‌ساز برای هر سرویس خریداری‌شده مسیر اختصاصی می‌گذارد — مثال:{' '}
          <span className="mono">platform.portfoliosoft.com{publicPath}</span>
        </p>
        <p className="mono" style={{ margin: 0 }}>
          در این دمو: <Link to={publicPath}>{publicPath}</Link>
        </p>
        <div className="btn-row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, maxWidth: 320 }}>
            <label htmlFor="slug">نامک (pathSlug)</label>
            <input
              id="slug"
              value={slugDraft}
              onChange={(e) => setSlugDraft(e.target.value)}
              placeholder="reporter-behsaz"
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const r = updateInstancePathSlug(instance.id, slugDraft)
              setSlugMsg(r.ok ? 'آدرس ذخیره شد.' : r.message)
              if (r.ok) setSlugDraft(slugDraft.trim().toLowerCase())
            }}
          >
            ذخیره آدرس
          </button>
        </div>
        {slugMsg ? (
          <StatusBanner tone={slugMsg.includes('ذخیره') ? 'ok' : 'danger'}>{slugMsg}</StatusBanner>
        ) : null}
      </section>

      <div className="stat-grid" style={{ marginTop: '0.9rem' }}>
        <div className="stat-card">
          <span className="meta">مدل روی نمونه</span>
          <strong>{models.length}/1</strong>
        </div>
        <div className="stat-card">
          <span className="meta">خرید</span>
          <strong style={{ fontSize: '0.95rem' }}>{instance.purchasedAt}</strong>
        </div>
      </div>
      <section className="panel stack">
        <h2 className="panel-title">اقدامات این سرویس</h2>
        <div className="btn-row">
          <Link className="btn btn-primary" to={`/account/services/${instanceId}/models`}>
            مدل‌ها
          </Link>
          <Link className="btn btn-secondary" to={`/account/services/${instanceId}/markup`}>
            حاشیه
          </Link>
          <Link
            className="btn btn-secondary"
            to={`/account/services/${instanceId}/support-plans`}
          >
            پلن پشتیبانی
          </Link>
          <Link
            className="btn btn-secondary"
            to={`/account/services/${instanceId}/knowledge`}
          >
            دانش / بسته
          </Link>
          <Link
            className="btn btn-secondary"
            to={`/account/services/${instanceId}/sql-tester`}
          >
            تست کوئری
          </Link>
          <Link className="btn btn-secondary" to={`/account/services/${instanceId}/usage`}>
            مصرف توکن
          </Link>
          <Link className="btn btn-secondary" to={`/account/services/${instanceId}/earnings`}>
            درآمد
          </Link>
        </div>
        <p className="meta">
          روی هر نمونه حداکثر یک مدل. انتشار بدون تأیید پلتفرم نمونه.
        </p>
      </section>
    </div>
  )
}

export function ServiceModelsPage() {
  const { instanceId = '' } = useParams()
  const {
    creatorInstances,
    creatorModels,
    createCreatorModel,
    updateCreatorModel,
  } = useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const models = creatorModels.filter((m) => m.instanceId === instanceId)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [markup, setMarkup] = useState('2000')
  const [msg, setMsg] = useState<string | null>(null)

  if (!instance) return <Navigate to="/account" replace />

  const canCreate = !instance.linkedModelId && models.length === 0

  function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!canCreate) return
    const id = createCreatorModel({
      name,
      instanceId,
      description: desc || 'مدل ایجادشده در دمو',
      baseIrr: 8500,
      markupIrr: Number(markup) || 0,
    })
    setMsg(`مدل ${id} به‌صورت پیش‌نویس ایجاد شد — تا انتشار صریح در کشف دیده نمی‌شود.`)
    setName('')
    setDesc('')
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>مدل‌ها</span>
      </div>
      <PageHeader
        title="مدل‌های این نمونه"
        description="حداکثر یک مدل روی هر نمونه · پیش‌نویس تا انتشار صریح سازنده در کشف مصرف‌کننده دیده نمی‌شود"
      />
      {msg ? <StatusBanner tone="ok">{msg}</StatusBanner> : null}
      <StatusBanner tone="info">
        خرید پلن فقط حق ساخت می‌دهد. دیده شدن در کاتالوگ کشف نیازمند دکمهٔ «انتشار» است — بدون تأیید
        پلتفرم نمونه.
      </StatusBanner>

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>مدل</th>
              <th>انتشار</th>
              <th>حاشیه</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>
                  <StatusBadge tone={m.publishStatus === 'published' ? 'ok' : 'muted'}>
                    {m.publishStatus === 'published' ? 'منتشر' : 'پیش‌نویس'}
                  </StatusBadge>
                </td>
                <td>{formatIrr(m.markupIrr)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      updateCreatorModel({
                        id: m.id,
                        publishStatus:
                          m.publishStatus === 'published' ? 'draft' : 'published',
                      })
                    }
                  >
                    {m.publishStatus === 'published' ? 'لغو انتشار' : 'انتشار'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {models.length === 0 ? (
          <EmptyState
            title="هنوز مدلی روی این نمونه نیست"
            hint="روی هر نمونه پلن حداکثر یک مدل. از فرم زیر ایجاد کنید."
          />
        ) : null}
      </div>

      {canCreate ? (
        <form className="panel stack" style={{ marginTop: '0.9rem' }} onSubmit={onCreate}>
          <h2 className="panel-title">ایجاد مدل روی این نمونه</h2>
          <div className="field">
            <label htmlFor="n">نام مدل</label>
            <input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="d">توضیح ارزش</label>
            <textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 200 }}>
            <label htmlFor="mk">حاشیه اولیه (ریال)</label>
            <input
              id="mk"
              type="number"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            ایجاد و انتشار (دمو)
          </button>
        </form>
      ) : (
        <StatusBanner tone="info">این نمونه قبلاً مدل دارد.</StatusBanner>
      )}
    </div>
  )
}

export function ServiceMarkupPage() {
  const { instanceId = '' } = useParams()
  const { creatorInstances, creatorModels, updateCreatorModel } = useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const models = creatorModels.filter((m) => m.instanceId === instanceId)
  const [drafts, setDrafts] = useState(
    () => Object.fromEntries(models.map((m) => [m.id, m.markupIrr])),
  )
  const [saved, setSaved] = useState(false)
  if (!instance) return <Navigate to="/account" replace />

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>حاشیه</span>
      </div>
      <PageHeader
        title="قیمت‌گذاری حاشیه"
        description="Base فقط خواندنی · مصرف خود مدل‌ساز فقط Base · سقف اجباری پلتفرم نیست"
      />
      {saved ? <StatusBanner tone="ok">ذخیره شد (دمو).</StatusBanner> : null}
      {models.length === 0 ? (
        <EmptyState
          title="ابتدا مدل بسازید"
          hint="حاشیه روی مدل تعریف می‌شود. پس از ایجاد مدل، اینجا برگردید."
          action={
            <Link className="btn btn-primary" to={`/account/services/${instanceId}/models`}>
              رفتن به مدل‌ها
            </Link>
          }
        />
      ) : (
        models.map((m) => (
          <section key={m.id} className="panel stack">
            <h2 className="panel-title">{m.name}</h2>
            <p className="meta">Base: {formatIrr(m.baseIrr)}</p>
            <div className="field" style={{ maxWidth: 220 }}>
              <label>حاشیه (ریال)</label>
              <input
                type="number"
                value={drafts[m.id] ?? m.markupIrr}
                onChange={(e) => {
                  setDrafts((d) => ({ ...d, [m.id]: Number(e.target.value) }))
                  setSaved(false)
                }}
              />
            </div>
            <p>
              قیمت مصرف‌کننده:{' '}
              <strong>
                {formatIrr(m.baseIrr + (drafts[m.id] ?? m.markupIrr))}
              </strong>
            </p>
          </section>
        ))
      )}
      {models.length > 0 ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '0.9rem' }}
          onClick={() => {
            models.forEach((m) =>
              updateCreatorModel({ id: m.id, markupIrr: drafts[m.id] ?? m.markupIrr }),
            )
            setSaved(true)
          }}
        >
          ذخیره
        </button>
      ) : null}
    </div>
  )
}

export function ServiceSupportPlansPage() {
  const { instanceId = '' } = useParams()
  const { creatorInstances, creatorModels, creatorSupportPlans, upsertCreatorSupportPlan } =
    useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const models = creatorModels.filter((m) => m.instanceId === instanceId)
  const plans = creatorSupportPlans.filter((p) =>
    models.some((m) => m.id === p.modelId),
  )
  const [name, setName] = useState('پشتیبانی ماهانه')
  const [price, setPrice] = useState('2500000')
  const [kind, setKind] = useState<'monthly' | 'per-ticket'>('monthly')
  if (!instance) return <Navigate to="/account" replace />
  const model = models[0]

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>پشتیبانی</span>
      </div>
      <PageHeader
        title="پلن‌های پشتیبانی این سرویس"
        description="اختیاری — اگر تعریف کنید، مصرف‌کننده برای درخواست/تیکت باید پلن فعال بخرد. سهم پلتفرم نمونه صفر."
      />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>نام</th>
              <th>مدل</th>
              <th>نوع</th>
              <th>قیمت</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.modelName}</td>
                <td>{p.kind === 'monthly' ? 'ماهانه' : 'per تیکت'}</td>
                <td>{formatIrr(p.priceIrr)}</td>
                <td>{p.status === 'active' ? 'فعال' : 'غیرفعال'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {model ? (
        <form
          className="panel stack"
          style={{ marginTop: '0.9rem' }}
          onSubmit={(e) => {
            e.preventDefault()
            upsertCreatorSupportPlan({
              modelId: model.id,
              modelName: model.name,
              name,
              kind,
              priceIrr: Number(price) || 0,
              durationLabel: kind === 'monthly' ? '۳۰ روز' : 'تا بسته‌شدن',
              status: 'active',
            })
          }}
        >
          <h2 className="panel-title">افزودن پلن پشتیبانی برای «{model.name}»</h2>
          <div className="field">
            <label>نام</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>نوع</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'monthly' | 'per-ticket')}
            >
              <option value="monthly">ماهانه</option>
              <option value="per-ticket">per تیکت</option>
            </select>
          </div>
          <div className="field" style={{ maxWidth: 220 }}>
            <label>قیمت (ریال)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            ذخیره پلن (دمو)
          </button>
        </form>
      ) : (
        <StatusBanner tone="warn">ابتدا مدل روی این نمونه بسازید.</StatusBanner>
      )}
    </div>
  )
}

export function ServiceKnowledgePage() {
  const { instanceId = '' } = useParams()
  const { creatorInstances, creatorModels, models } = useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const cm = creatorModels.find((m) => m.instanceId === instanceId)
  const catalog = cm ? models.find((m) => m.id === cm.id) : undefined
  const [copied, setCopied] = useState(false)
  const sampleSha =
    'a3f1c9e8b2d04715f6a90c1e4b7d8e2f9c0a1b2c3d4e5f60718293a4b5c6d7e8'
  if (!instance) return <Navigate to="/account" replace />

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>نسخه دانش</span>
      </div>
      <PageHeader
        eyebrow="فضای نمونه سرویس"
        title="دانش دیتابیس / تفاوت بسته"
        description="مختص کوئری‌ساز — فقط همین نمونه پلن؛ به نمونه‌های دیگر وصل نیست"
      />
      <StatusBanner tone="warn">
        جداسازی نمونه: دانش این نمونه («{instance.planName}») به پلن‌های دیگر وصل نیست. تغییر
        اینجا روی نمونه‌های دیگر اثر ندارد؛ آدرس اختصاصی یکتا است.
      </StatusBanner>
      <StatusBanner tone="info">
        بسته فشرده فولدربندی‌شده آپلود می‌شود. تشخیص بدون‌تغییر: اثرانگشت محتوا + درخت مسیر →
        ارجاع. تفاوت: جدید / تغییریافته / حذف‌شده / بدون تغییر.
      </StatusBanner>
      <section className="panel stack" style={{ marginBottom: '0.9rem' }}>
        <h2 className="panel-title">آپلود بسته نسخه (دمو)</h2>
        <input type="file" accept=".zip" />
        <p className="meta" style={{ margin: 0 }}>
          پس از استخراج: اثرانگشت هر فایل + ذخیره فقط برای جدید/تغییریافته؛ بدون‌تغییر = ارجاع
        </p>
        <div className="sha-row">
          <span className="meta">نمونه اثرانگشت فایل بدون تغییر:</span>
          <code className="mono sha-value">{sampleSha}</code>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              void navigator.clipboard?.writeText(sampleSha)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1600)
            }}
          >
            {copied ? 'کپی شد' : 'کپی اثرانگشت'}
          </button>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-primary">
            شبیه‌سازی Diff و ذخیره
          </button>
        </div>
      </section>
      {!catalog ? (
        <EmptyState
          title="مدلی نیست — ابتدا مدل بسازید"
          hint="دانش به مدل روی همین نمونه وصل می‌شود."
          action={
            <Link className="btn btn-secondary" to={`/account/services/${instanceId}/models`}>
              مدل‌های این نمونه
            </Link>
          }
        />
      ) : (
        <div className="panel table-wrap">
          <table className="data dense">
            <thead>
              <tr>
                <th>نسخه</th>
                <th>محصول</th>
                <th>وضعیت</th>
                <th>یادداشت</th>
              </tr>
            </thead>
            <tbody>
              {catalog.docVersions.map((v) => (
                <tr key={v.id}>
                  <td>{v.label}</td>
                  <td>{v.productName}</td>
                  <td>{v.status === 'published' ? 'منتشر' : 'پیش‌نویس'}</td>
                  <td className="meta">{v.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function ServiceSqlTesterPage() {
  const { instanceId = '' } = useParams()
  const { creatorInstances, availableIrr, debitWallet } = useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const [q, setQ] = useState('فروش سه ماه اخیر به تفکیک مشتری')
  const [done, setDone] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  if (!instance) return <Navigate to="/account" replace />

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>تست کوئری</span>
      </div>
      <PageHeader
        eyebrow="فضای نمونه سرویس"
        title="تست مدل / شبیه‌ساز کوئری (فقط سازنده)"
        description="مصرف‌کننده مدل نهایی این منو را ندارد · هزینه از کیف پول"
      />
      <StatusBanner tone="warn">
        جداسازی نمونه: این تست فقط روی همین نمونه اجرا می‌شود و دانش نمونه‌های دیگر را لمس
        نمی‌کند.
      </StatusBanner>
      <StatusBanner tone="info">
        موجودی: {formatIrr(availableIrr)}. تست از مسیر رزرو/تسویه Wallet کسر می‌شود. Meter قیمت:{' '}
        <strong>توکن</strong> (پلتفرم نمونه به ریال تبدیل می‌کند).{' '}
        <span className="mono">Request</span> فقط شمارنده است. پلن می‌تواند شارژ اولیه کیف پول داشته
        باشد.
      </StatusBanner>
      {msg ? (
        <StatusBanner tone={msg.includes('کسر شد') ? 'ok' : 'danger'}>{msg}</StatusBanner>
      ) : null}
      <form
        className="panel stack"
        onSubmit={(e) => {
          e.preventDefault()
          const r = debitWallet(50_000, 'تست سازنده کوئری‌ساز')
          if (!r.ok) {
            setDone(false)
            setMsg(r.message)
            return
          }
          setDone(true)
          setMsg('۵۰٬۰۰۰ ریال از کیف پول کسر شد (دمو) و کوئری نمونه ساخته شد.')
        }}
      >
        <div className="field">
          <label>سؤال تست</label>
          <textarea value={q} onChange={(e) => setQ(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary">
          اجرا با کسر از کیف پول
        </button>
      </form>
      {done ? (
        <section className="panel" style={{ marginTop: '0.9rem' }}>
          <h2 className="panel-title">کوئری نمونه</h2>
          <pre className="query-box">{`SELECT TOP 50 * FROM dbo.Sales /* ${q} */`}</pre>
        </section>
      ) : null}
    </div>
  )
}

export function ServiceEarningsPage() {
  const { instanceId = '' } = useParams()
  const {
    creatorInstances,
    creatorEarnings,
    creatorPayouts,
    creatorEarningsAvailableIrr,
    requestCreatorPayout,
    payoutRules,
  } = useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const [msg, setMsg] = useState<string | null>(null)
  if (!instance) return <Navigate to="/account" replace />
  const rule = payoutRules.find((r) => r.serviceName === instance.serviceName)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>درآمد</span>
      </div>
      <PageHeader
        title="صندوق درآمد (زمینه این سرویس)"
        description="حاشیه مصرف + پشتیبانی → صندوق درآمد مدل‌ساز · وصول شبا یا کیف پول یک‌طرفه"
      />
      <div className="stat-card" style={{ marginBottom: '0.9rem', maxWidth: 280 }}>
        <span className="meta">قابل وصول</span>
        <strong>{formatIrr(creatorEarningsAvailableIrr)}</strong>
      </div>
      {rule ? (
        <p className="meta">
          آستانه این سرویس: حداقل {formatIrr(rule.minAmountIrr)} یا {rule.minDays} روز
        </p>
      ) : null}
      {msg ? <StatusBanner tone="ok">{msg}</StatusBanner> : null}
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            requestCreatorPayout('sheba', creatorEarningsAvailableIrr)
            setMsg('وصول به شبا ثبت شد (دمو).')
          }}
        >
          وصول به شبا
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            requestCreatorPayout('wallet', creatorEarningsAvailableIrr)
            setMsg('تبدیل به Wallet انجام شد — دیگر به شبا نمی‌رود.')
          }}
        >
          تبدیل به Wallet
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={creatorEarnings.length === 0}
          onClick={() => {
            const headers = ['تاریخ', 'منبع', 'برچسب', 'مبلغ (ریال)', 'ارجاع', 'نمونه سرویس']
            const rows = creatorEarnings.map((e) => [
              e.at,
              e.source === 'usage-markup' ? 'حاشیه مصرف' : 'پشتیبانی',
              e.label,
              e.amountIrr,
              e.ref,
              instance.planName,
            ])
            const stamp = new Date().toISOString().slice(0, 10)
            downloadCsv(`portfolio-earnings-${instanceId}-${stamp}.csv`, headers, rows)
          }}
        >
          صادرات CSV درآمد
        </button>
      </div>
      <p className="meta">صادرات CSV · هدر فارسی · Excel با CSV (MVP mock) — جدا از Ledger خام</p>
      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">تاریخچه درآمد</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>منبع</th>
                <th>مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {creatorEarnings.map((e) => (
                <tr key={e.id}>
                  <td>{e.at}</td>
                  <td>{e.label}</td>
                  <td>{formatIrr(e.amountIrr)}</td>
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
              </tr>
            </thead>
            <tbody>
              {creatorPayouts.map((p) => (
                <tr key={p.id}>
                  <td>{p.at}</td>
                  <td>{p.method === 'sheba' ? 'شبا' : 'Wallet'}</td>
                  <td>{formatIrr(p.amountIrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export function ServiceTicketsPage() {
  const { instanceId = '' } = useParams()
  const { creatorInstances, creatorModels, creatorTickets, updateCreatorTicketStatus } =
    useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)
  const models = creatorModels.filter((m) => m.instanceId === instanceId)
  const names = new Set(models.map((m) => m.name))
  const tickets = creatorTickets.filter((t) => names.has(t.modelName))
  const [selectedId, setSelectedId] = useState(tickets[0]?.id ?? '')
  if (!instance) return <Navigate to="/account" replace />
  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0]

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>تیکت‌های مدل</span>
      </div>
      <PageHeader
        eyebrow="عملیات"
        title="صندوق تیکت مشتری"
        description="تیکت‌های مصرف‌کنندگان روی مدل‌های این نمونه — جدا از درخواست به پلتفرم نمونه"
      />
      <StatusBanner tone="info">
        درخواست entitlement / استثنا به پلتفرم نمونه:{' '}
        <Link to="/account/exceptions">درخواست به پلتفرم نمونه</Link>
      </StatusBanner>
      {tickets.length === 0 ? (
        <EmptyState
          title="تیکتی در صندوق این سرویس نیست"
          hint="وقتی مصرف‌کننده روی مدل تیکت بزند، اینجا ظاهر می‌شود."
          action={
            <Link className="btn btn-secondary" to={`/account/services/${instanceId}/models`}>
              مدیریت مدل‌ها
            </Link>
          }
        />
      ) : (
        <div className="detail-grid two">
          <section className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>موضوع</th>
                  <th>مدل</th>
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
                    <td>{t.subject}</td>
                    <td className="meta">{t.modelName}</td>
                    <td>
                      {t.status === 'open' ? 'باز' : t.status === 'waiting' ? 'در انتظار' : 'بسته'}
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
                مصرف‌کننده: {selected.consumerName} · مدل: {selected.modelName}
              </p>
              <p className="meta" style={{ margin: 0 }}>
                به‌روز: {selected.updatedAt}
                {selected.supportPlan ? ` · پلن: ${selected.supportPlan}` : ''}
              </p>
              <StatusBanner tone="info">
                پاسخ کامل گفتگو در دمو مصرف‌کننده دیده می‌شود؛ اینجا وضعیت صندوق مدل‌ساز است.
              </StatusBanner>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    updateCreatorTicketStatus(
                      selected.id,
                      selected.status === 'closed' ? 'open' : 'closed',
                    )
                  }
                >
                  {selected.status === 'closed' ? 'بازگشایی' : 'بستن تیکت'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateCreatorTicketStatus(selected.id, 'waiting')}
                >
                  علامت در انتظار
                </button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function ServiceUsagePage() {
  const { instanceId = '' } = useParams()
  const { creatorInstances } = useMockStore()
  const instance = creatorInstances.find((i) => i.id === instanceId)

  if (!instance) {
    return (
      <div>
        <PageHeader title="نمونه یافت نشد" />
        <Link to="/account">بازگشت به میز کار</Link>
      </div>
    )
  }

  const report = getCreatorInstanceTokenUsage(instance.id, instance.serviceName)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <Link to={`/account/services/${instanceId}`}>{instance.planName}</Link>
        <span>/</span>
        <span>مصرف توکن</span>
      </div>
      <PageHeader
        eyebrow="فضای نمونه سرویس"
        title="مصرف توکن این نمونه"
        description={`${instance.serviceName} · فقط همین نمونه پلن — جدا از نمونه‌ها و گزارش سراسری پلتفرم`}
      />
      <ServiceTokenUsageReportView report={report} title="گزارش مصرف این نمونه" />
    </div>
  )
}
