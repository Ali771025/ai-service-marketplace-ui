import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMockStore } from '../data/MockStore'
import { estimateCharge, getModel } from '../data/models'
import {
  PageHeader,
  PriceBreakdown,
  StatusBanner,
} from '../components/ui/Primitives'
import { formatIrr } from '../lib/format'

export function NewRequestPage() {
  const { modelId = '' } = useParams()
  const { models, submitRequest, availableIrr } = useMockStore()
  const model = getModel(modelId, models)
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [docVersionId, setDocVersionId] = useState(
    model?.docVersions[0]?.id ?? '',
  )
  const [error, setError] = useState('')

  if (!model) {
    return (
      <div>
        <PageHeader title="مدل یافت نشد" />
        <Link to="/consumer/discover">بازگشت</Link>
      </div>
    )
  }

  const charge = estimateCharge(model)
  const supportBlocked =
    model.supportRequired && model.supportPlanStatus === 'expired'
  const debtBlocked = availableIrr < 0

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!question.trim()) {
      setError('متن درخواست را وارد کنید.')
      return
    }
    const result = submitRequest({
      modelId: model!.id,
      question,
      docVersionId: docVersionId || model!.docVersions[0]!.id,
    })
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate(`/consumer/requests/${result.requestId}`)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to={`/consumer/models/${model.id}`}>{model.name}</Link>
        <span>/</span>
        <span>درخواست جدید</span>
      </div>

      <PageHeader
        title="ثبت درخواست گزارش"
        description="در محصول واقعی این فراخوانی معمولاً از نرم‌افزار مقصد با API Key می‌آید. این صفحه شبیه‌سازی همان جریان رزرو → ساخت کوئری است."
      />

      {model.ownedByCurrentUser ? (
        <StatusBanner tone="info">
          شما مالک این مدل هستید — فقط Base به پلتفرم؛ Creator Markup اعمال نمی‌شود.
        </StatusBanner>
      ) : null}
      {supportBlocked ? (
        <StatusBanner tone="warn">
          پلن پشتیبانی منقضی — درخواست جدید مسدود است.
        </StatusBanner>
      ) : null}
      {debtBlocked ? (
        <StatusBanner tone="danger">
          بدهی کیف پول — تا تسویه مصرف جدید ممکن نیست.
        </StatusBanner>
      ) : null}

      <StatusBanner tone="info">
        تخمین هزینه (رزرو قبل از اجرا):{' '}
        <PriceBreakdown base={charge.base} markup={charge.markup} />
        <br />
        موجودی قابل‌استفاده: {formatIrr(availableIrr)}
        {availableIrr < charge.total && availableIrr >= 0
          ? ' — برای این درخواست کافی نیست.'
          : ''}
        <br />
        <span className="meta">
          Sandbox رایگان نداریم؛ هر مصرف هزینه‌دار است.
        </span>
      </StatusBanner>

      <form className="panel stack" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="version">نسخه دانش دیتابیس</label>
          <select
            id="version"
            value={docVersionId}
            onChange={(e) => setDocVersionId(e.target.value)}
          >
            {model.docVersions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} — {v.productName}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="q">سؤال / درخواست گزارش</label>
          <textarea
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="مثال: فروش سه ماه اخیر به تفکیک مشتری…"
          />
        </div>
        {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
        <div className="btn-row">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={supportBlocked || debtBlocked}
          >
            رزرو و ارسال درخواست (mock)
          </button>
          <Link className="btn btn-secondary" to={`/consumer/models/${model.id}`}>
            انصراف
          </Link>
        </div>
      </form>
    </div>
  )
}
