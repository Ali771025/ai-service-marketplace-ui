import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BUYABLE_SUPPORT_PLANS,
  SUPPORT_TICKETS,
} from '../../data/consumerExtras'
import { useMockStore } from '../../data/MockStore'
import {
  PageHeader,
  StatusBadge,
  StatusBanner,
} from '../../components/ui/Primitives'
import { formatIrr } from '../../lib/format'

export function TicketDetailPage() {
  const { ticketId = '' } = useParams()
  const ticket = SUPPORT_TICKETS.find((t) => t.id === ticketId)

  if (!ticket) {
    return (
      <div>
        <PageHeader title="تیکت یافت نشد" />
        <Link to="/consumer/support">بازگشت</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/consumer/support">پشتیبانی</Link>
        <span>/</span>
        <span>{ticket.id}</span>
      </div>
      <PageHeader title={ticket.subject} description={`${ticket.modelName} · ${ticket.id}`} />
      <StatusBadge
        tone={
          ticket.status === 'open' ? 'info' : ticket.status === 'waiting' ? 'warn' : 'muted'
        }
      >
        {ticket.status === 'open' ? 'باز' : ticket.status === 'waiting' ? 'در انتظار' : 'بسته'}
      </StatusBadge>

      <section className="panel stack" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">گفتگو</h2>
        {ticket.messages.map((m) => (
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
        {ticket.status !== 'closed' ? (
          <div className="field">
            <label htmlFor="reply">پاسخ (mock — ارسال واقعی نیست)</label>
            <textarea id="reply" placeholder="متن پاسخ…" disabled />
            <button type="button" className="btn btn-primary" disabled>
              ارسال (دمو)
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export function NewTicketPage() {
  const { models } = useMockStore()
  const navigate = useNavigate()
  const eligible = models.filter(
    (m) => m.inMyModels && (!m.supportRequired || m.supportPlanStatus === 'active'),
  )
  const [modelId, setModelId] = useState(eligible[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [done, setDone] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setDone(true)
    window.setTimeout(() => navigate('/consumer/support'), 900)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/consumer/support">پشتیبانی</Link>
        <span>/</span>
        <span>تیکت جدید</span>
      </div>
      <PageHeader
        title="تیکت جدید"
        description="فقط روی مدلی که پلن پشتیبانی فعال دارد (در صورت الزام)"
      />
      {done ? (
        <StatusBanner tone="ok">تیکت mock ثبت شد — در حال بازگشت…</StatusBanner>
      ) : (
        <form className="panel stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="model">مدل</label>
            <select
              id="model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              required
            >
              {eligible.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="subj">موضوع</label>
            <input
              id="subj"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="body">شرح</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            ثبت تیکت (mock)
          </button>
        </form>
      )}
    </div>
  )
}

export function BuySupportPage() {
  const [params] = useSearchParams()
  const modelId = params.get('modelId') ?? 'mdl-hesab-rb'
  const { models, activateSupportPlan } = useMockStore()
  const model = models.find((m) => m.id === modelId)
  const plans = useMemo(
    () => BUYABLE_SUPPORT_PLANS.filter((p) => p.modelId === modelId),
    [modelId],
  )
  const [selected, setSelected] = useState(plans[0]?.id ?? '')
  const [autoRenew, setAutoRenew] = useState(true)
  const [payMethod, setPayMethod] = useState<'gateway' | 'wallet'>('gateway')
  const [done, setDone] = useState(false)
  const plan = plans.find((p) => p.id === selected)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/consumer/my-models">مدل‌های من</Link>
        <span>/</span>
        <span>خرید پلن پشتیبانی</span>
      </div>
      <PageHeader
        title="خرید پلن پشتیبانی"
        description={
          model
            ? `${model.name} — پلن پشتیبانی مستقل از Creator Markup است؛ هر مصرف همچنان Base+Markup`
            : 'مدل'
        }
      />
      {done ? (
        <StatusBanner tone="ok">
          خرید ثبت شد؛ صورت‌حساب صادر می‌شود. وضعیت پلن در مدل‌های من فعال شد. در MVP استرداد
          خرید پلن پشتیبانی نداریم.
        </StatusBanner>
      ) : null}
      <StatusBanner tone="info">
        درآمد پشتیبانی به صندوق درآمد مدل‌ساز می‌رود؛ سهم پلتفرم نمونه از پشتیبانی صفر است.
      </StatusBanner>
      <div className="detail-grid two">
        <section className="panel stack">
          <h2 className="panel-title">انتخاب پلن</h2>
          {plans.length === 0 ? (
            <p className="meta">برای این مدل پلن قابل خریدی در دمو تعریف نشده.</p>
          ) : null}
          {plans.map((p) => (
            <label key={p.id} className="plan-option">
              <input
                type="radio"
                name="plan"
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
              />
              <div>
                <strong>{p.name}</strong>
                <div className="meta">
                  {p.kind === 'monthly' ? 'ماهانه' : 'per تیکت'} · {p.durationLabel} ·{' '}
                  {p.responseSla}
                </div>
                <div>{formatIrr(p.priceIrr)}</div>
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
              تمدید خودکار ماهانه (انتخاب کاربر — روشن/خاموش)
            </label>
          ) : null}
        </section>
        <section className="panel stack">
          <h2 className="panel-title">پیش‌نمایش صورت‌حساب و پرداخت</h2>
          <p style={{ margin: 0 }}>
            مبلغ: <strong>{plan ? formatIrr(plan.priceIrr) : '—'}</strong>
          </p>
          <p className="meta" style={{ margin: 0 }}>
            خرید پلن پشتیبانی در MVP صورت‌حساب دارد. استرداد خرید پلن در MVP نیست.
          </p>
          <div className="field">
            <label htmlFor="pay">روش پرداخت</label>
            <select
              id="pay"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
            >
              <option value="gateway">درگاه (پیش‌فرض رایج)</option>
              <option value="wallet">کیف پول</option>
            </select>
          </div>
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
            تأیید خرید و صدور صورت‌حساب (mock)
          </button>
          <Link className="btn btn-ghost" to="/account">
            انصراف
          </Link>
        </section>
      </div>
    </div>
  )
}

export function ComplaintPage() {
  const [params] = useSearchParams()
  const modelId = params.get('modelId') ?? ''
  const { models } = useMockStore()
  const model = models.find((m) => m.id === modelId)
  const [done, setDone] = useState(false)

  return (
    <div>
      <div className="breadcrumb">
        {model ? (
          <Link to={`/consumer/models/${model.id}`}>{model.name}</Link>
        ) : (
          <Link to="/consumer/discover">کشف مدل‌ها</Link>
        )}
        <span>/</span>
        <span>شکایت از مدل‌ساز</span>
      </div>
      <PageHeader
        title="شکایت از مدل‌ساز"
        description="اقدام جدا از تیکت پشتیبانی — بدون تعهد نتیجه از پلتفرم"
      />
      {done ? (
        <StatusBanner tone="info">
          شکایت mock ثبت شد. پلتفرم نمونه تعهدی برای نتیجه به مصرف‌کننده نهایی ندارد.
        </StatusBanner>
      ) : (
        <form
          className="panel stack"
          onSubmit={(e) => {
            e.preventDefault()
            setDone(true)
          }}
        >
          <p className="meta" style={{ margin: 0 }}>
            مدل: {model?.name ?? '—'} · مدل‌ساز: {model?.creatorName ?? '—'}
          </p>
          <div className="field">
            <label htmlFor="reason">دلیل</label>
            <select id="reason" required defaultValue="">
              <option value="" disabled>
                انتخاب کنید
              </option>
              <option value="quality">کیفیت خروجی</option>
              <option value="support">پشتیبانی ضعیف</option>
              <option value="pricing">قیمت‌گذاری گمراه‌کننده</option>
              <option value="other">سایر</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="detail">شرح</label>
            <textarea id="detail" required />
          </div>
          <button type="submit" className="btn btn-primary">
            ارسال شکایت (mock)
          </button>
        </form>
      )}
    </div>
  )
}
