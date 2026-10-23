import { Link, useParams } from 'react-router-dom'
import { useMockStore } from '../data/MockStore'
import { getModel } from '../data/models'
import {
  PageHeader,
  PriceBreakdown,
  StatusBadge,
  StatusBanner,
} from '../components/ui/Primitives'
import { requestStatusLabel } from '../lib/format'

function statusTone(
  status: string,
): 'ok' | 'warn' | 'danger' | 'info' | 'muted' {
  if (status === 'delivered') return 'ok'
  if (status === 'query-ready') return 'info'
  if (status === 'failed') return 'danger'
  if (status === 'processing' || status === 'submitted') return 'warn'
  return 'muted'
}

export function RequestDetailPage() {
  const { requestId = '' } = useParams()
  const { requests, models, markDelivered } = useMockStore()
  const req = requests.find((r) => r.id === requestId)
  const model = req ? getModel(req.modelId, models) : undefined

  if (!req || !model) {
    return (
      <div>
        <PageHeader title="درخواست یافت نشد" />
        <Link to="/consumer/my-models">مدل‌های من</Link>
      </div>
    )
  }

  const version = model.docVersions.find((v) => v.id === req.docVersionId)

  return (
    <div>
      <div className="breadcrumb">
        <Link to={`/consumer/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>درخواست {req.id}</span>
      </div>

      <PageHeader
        title="وضعیت درخواست و تحویل کوئری"
        description="جریان کوئری‌ساز: درخواست → ساخت کوئری روی نسخه دانش → تحویل به نرم‌افزار مقصد برای اجرا"
      />

      <div className="btn-row" style={{ marginBottom: '0.9rem' }}>
        <StatusBadge tone={statusTone(req.status)}>
          {requestStatusLabel(req.status)}
        </StatusBadge>
      </div>

      {req.status === 'failed' && req.errorMessage ? (
        <StatusBanner tone="danger">{req.errorMessage}</StatusBanner>
      ) : null}
      {req.deliveryNote ? (
        <StatusBanner tone={req.status === 'delivered' ? 'ok' : 'info'}>
          {req.deliveryNote}
        </StatusBanner>
      ) : null}

      <div className="detail-grid two">
        <section className="panel stack">
          <h2 className="panel-title">جزئیات درخواست</h2>
          <p style={{ margin: 0 }}>
            <strong>سؤال:</strong> {req.question}
          </p>
          <p className="meta" style={{ margin: 0 }}>
            نسخه دانش: {version?.label ?? req.docVersionId}
          </p>
          <p className="meta" style={{ margin: 0 }}>
            ثبت: {req.createdAt} · به‌روزرسانی: {req.updatedAt}
          </p>
          {req.baseIrr > 0 ? (
            <PriceBreakdown base={req.baseIrr} markup={req.markupIrr} />
          ) : null}
          {req.status === 'query-ready' ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => markDelivered(req.id)}
            >
              شبیه‌سازی تحویل در نرم‌افزار مقصد
            </button>
          ) : null}
        </section>

        <section className="panel">
          <h2 className="panel-title">مسیر سرویس (آموزشی)</h2>
          <div className="steps">
            {[
              'مصرف‌کننده کلید دسترسی را در نرم‌افزار محلی سازنده می‌گذارد',
              'درخواست/سؤال از آن نرم‌افزار به پلتفرم می‌رسد',
              'مدل روی نسخه مستندات دیتابیس کوئری می‌سازد',
              'کوئری برمی‌گردد؛ نرم‌افزار سازنده اجرا و نتیجه را تحویل می‌دهد',
            ].map((text, i) => (
              <div className="step" key={text}>
                <div className="step-num">{i + 1}</div>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {req.returnedQuery ? (
        <section className="panel" style={{ marginTop: '0.9rem' }}>
          <h2 className="panel-title">کوئری بازگشتی (دمو)</h2>
          <pre className="query-box">{req.returnedQuery}</pre>
        </section>
      ) : null}

      <div className="btn-row" style={{ marginTop: '1rem' }}>
        <Link className="btn btn-secondary" to={`/consumer/models/${model.id}/request`}>
          درخواست جدید
        </Link>
        <Link className="btn btn-ghost" to="/consumer/usage">
          مشاهده در مصرف و هزینه‌ها
        </Link>
      </div>
    </div>
  )
}
