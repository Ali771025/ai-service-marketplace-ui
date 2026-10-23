import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMockStore } from '../data/MockStore'
import { estimateCharge, getModel } from '../data/models'
import {
  PageHeader,
  PriceBreakdown,
  StatusBadge,
  StatusBanner,
} from '../components/ui/Primitives'
import { formatIrr, supportLabel } from '../lib/format'

export function ModelDetailPage() {
  const { modelId = '' } = useParams()
  const { user } = useAuth()
  const { models, availableIrr, addReview } = useMockStore()
  const model = getModel(modelId, models)
  const [rating, setRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewDone, setReviewDone] = useState(false)

  if (!model) {
    return (
      <div>
        <PageHeader title="مدل یافت نشد" />
        <Link to="/consumer/discover">بازگشت به کشف مدل‌ها</Link>
      </div>
    )
  }

  const charge = estimateCharge(model)
  const supportBlocked =
    model.supportRequired && model.supportPlanStatus === 'expired'
  const walletBlocked = availableIrr < 0
  const canRequest = !supportBlocked && !walletBlocked

  function onReview(e: FormEvent) {
    e.preventDefault()
    if (!reviewBody.trim()) return
    addReview({
      modelId: model!.id,
      rating,
      body: reviewBody.trim(),
      author: user?.displayName ?? 'مصرف‌کننده',
    })
    setReviewBody('')
    setReviewDone(true)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/consumer/discover">کشف مدل‌ها</Link>
        <span>/</span>
        <span>{model.name}</span>
      </div>

      <PageHeader
        title={model.name}
        description={`${model.creatorName} · ${model.serviceLabel} · سطح مصرف: api-key-only`}
      />

      {model.ownedByCurrentUser ? (
        <StatusBanner tone="info">
          مدل متعلق به شماست — در مصرف فقط قیمت پایه کسر می‌شود؛ حاشیه به خودتان اعمال نمی‌شود.
        </StatusBanner>
      ) : null}
      {supportBlocked ? (
        <StatusBanner tone="warn">
          انقضای پشتیبانی فوری است: درخواست جدید و تیکت مسدود. مشاهده تاریخچه درخواست‌ها مجاز
          است.{' '}
          <Link to={`/consumer/buy-support?modelId=${model.id}`}>تمدید پشتیبانی</Link>
        </StatusBanner>
      ) : null}
      {walletBlocked ? (
        <StatusBanner tone="danger">
          بدهی کیف پول — تا تسویه مصرف جدید ممکن نیست.{' '}
          <Link to="/consumer/wallet">رفتن به کیف پول</Link>
        </StatusBanner>
      ) : null}

      <div className="detail-grid two">
        <section className="panel">
          <h2 className="panel-title">توضیح ارزش</h2>
          <p style={{ marginTop: 0 }}>{model.description}</p>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            امتیاز میانگین: ★ {model.rating} از {model.reviewCount} نظر
          </p>
        </section>

        <section className="panel stack">
          <h2 className="panel-title">قیمت مصرف و وضعیت</h2>
          <PriceBreakdown base={charge.base} markup={charge.markup} />
          {model.markupKind === 'percent' && !model.ownedByCurrentUser ? (
            <p className="meta" style={{ margin: 0 }}>
              حاشیه مدل‌ساز: {model.markupPercent}% روی قیمت پایه
            </p>
          ) : null}
          <div>
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
            {model.supportPlanName ? (
              <p className="meta" style={{ marginTop: 8 }}>
                {model.supportPlanName}
                {model.supportExpiresAt
                  ? ` · انقضا: ${model.supportExpiresAt}`
                  : ''}
                {model.supportPlanStatus === 'active' &&
                model.autoRenew != null
                  ? ` · تمدید خودکار: ${model.autoRenew ? 'روشن' : 'خاموش'}`
                  : ''}
              </p>
            ) : (
              <p className="meta" style={{ marginTop: 8 }}>
                بدون پیش‌نیاز پشتیبانی؛ مصرف با کیف پول (قیمت پایه + حاشیه)
              </p>
            )}
          </div>
          <p className="meta">
            موجودی قابل‌استفاده شما: {formatIrr(availableIrr)}
          </p>
          <p className="meta" style={{ margin: 0 }}>
            پلتفرم نسبت به نتیجه مدل تعهدی به مصرف‌کننده نهایی ندارد.
          </p>
          <div className="btn-row">
            {canRequest ? (
              <Link
                className="btn btn-primary"
                to={`/consumer/models/${model.id}/request`}
              >
                ثبت درخواست گزارش
              </Link>
            ) : (
              <button type="button" className="btn btn-primary" disabled>
                ثبت درخواست گزارش
              </button>
            )}
            <Link className="btn btn-secondary" to="/consumer/how-it-works">
              نحوه استفاده از کلید دسترسی
            </Link>
            {model.supportRequired ? (
              <Link
                className="btn btn-secondary"
                to={`/consumer/buy-support?modelId=${model.id}`}
              >
                خرید / تمدید پشتیبانی
              </Link>
            ) : null}
            <Link
              className="btn btn-ghost"
              to={`/consumer/complaint?modelId=${model.id}`}
            >
              شکایت از مدل‌ساز
            </Link>
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">نظرات و امتیاز</h2>
        {model.reviews.length === 0 ? (
          <p className="meta">هنوز نظری ثبت نشده.</p>
        ) : (
          model.reviews.map((r) => (
            <div key={r.id} className="review-item">
              <strong>
                ★ {r.rating} — {r.author}
              </strong>
              <div className="meta">{r.at}</div>
              <p style={{ margin: '0.35rem 0 0' }}>{r.body}</p>
            </div>
          ))
        )}
        {reviewDone ? (
          <StatusBanner tone="ok">نظر شما ثبت شد (دمو).</StatusBanner>
        ) : (
          <form className="stack" style={{ marginTop: '0.75rem' }} onSubmit={onReview}>
            <p className="meta" style={{ margin: 0 }}>
              قواعد واجد شرایط ثبت نظر: <strong>OPEN</strong>
            </p>
            <div className="field" style={{ maxWidth: 160 }}>
              <label htmlFor="rating">امتیاز</label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rev">متن نظر</label>
              <textarea
                id="rev"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              ثبت نظر (دمو)
            </button>
          </form>
        )}
      </section>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">نسخه‌های مستندات دیتابیس</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>نسخه</th>
                <th>محصول</th>
                <th>انتشار</th>
                <th>وضعیت</th>
                <th>یادداشت</th>
              </tr>
            </thead>
            <tbody>
              {model.docVersions.map((v) => (
                <tr key={v.id}>
                  <td>{v.label}</td>
                  <td>{v.productName}</td>
                  <td>{v.publishedAt}</td>
                  <td>
                    <StatusBadge tone={v.status === 'published' ? 'ok' : 'muted'}>
                      {v.status === 'published' ? 'منتشر' : 'پیش‌نویس'}
                    </StatusBadge>
                  </td>
                  <td className="muted">{v.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">کلید دسترسی برای نرم‌افزار مقصد</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          کلید را در نرم‌افزار محلی سازنده مدل قرار دهید. سطح مصرف این سرویس{' '}
          <strong>فقط‌کلید</strong> است — منوی تست در رابط برای مصرف‌کننده نهایی وجود ندارد.
          اجرا و تحویل گزارش در سمت نرم‌افزار سازنده است؛ پلتفرم کوئری را برمی‌گرداند.
        </p>
        <code className="mono" style={{ fontSize: '0.95rem' }}>
          {model.apiKeyPlaceholder}
        </code>
      </section>
    </div>
  )
}
