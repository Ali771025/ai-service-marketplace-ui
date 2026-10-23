import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useMockStore } from '../../data/MockStore'
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  StatusBanner,
} from '../../components/ui/Primitives'
import type { ExceptionKind } from '../../data/appState'

const KIND_LABEL: Record<ExceptionKind, string> = {
  access: 'مشکل دسترسی',
  'purchase-failed': 'خرید ناموفق — فعال‌سازی دستی',
  'wallet-debt': 'بدهی کیف پول',
  other: 'سایر',
}

export function AccountExceptionsPage() {
  const { user } = useAuth()
  const { exceptionTickets, createExceptionTicket } = useMockStore()
  const mine = exceptionTickets.filter(
    (t) =>
      t.requesterUserId === user?.id ||
      t.requesterName === user?.displayName ||
      true,
  )
  const [kind, setKind] = useState<ExceptionKind>('purchase-failed')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [planName, setPlanName] = useState('پلن نقره‌ای')
  const [serviceName, setServiceName] = useState('کوئری‌ساز')
  const [preview, setPreview] = useState<string | undefined>()
  const [fileName, setFileName] = useState<string | undefined>()
  const [doneId, setDoneId] = useState<string | null>(null)

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    const id = createExceptionTicket({
      kind,
      subject: subject || KIND_LABEL[kind],
      body,
      requesterName: user.displayName,
      requesterUserId: user.id,
      invoiceImageDataUrl: preview,
      invoiceFileName: fileName,
      targetPlanName: kind === 'purchase-failed' ? planName : undefined,
      targetServiceName: kind === 'purchase-failed' ? serviceName : undefined,
    })
    setDoneId(id)
    setSubject('')
    setBody('')
    setPreview(undefined)
    setFileName(undefined)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <span>تیکت به پلتفرم</span>
      </div>
      <PageHeader
        eyebrow="پشتیبانی"
        title="درخواست به پلتفرم نمونه"
        description="مسیر به پلتفرم برای دسترسی، خرید ناموفق و فعال‌سازی دستی — جدا از تیکت به مدل‌ساز"
      />
      <StatusBanner tone="info">
        تیکت روی مدل (به مدل‌ساز) از فضای همان مدل ثبت می‌شود. اعضای دسترسی سازمان:{' '}
        <Link to="/account/members">اعضای دسترسی</Link>
      </StatusBanner>

      {doneId ? (
        <StatusBanner tone="ok">
          تیکت {doneId} ثبت شد. مدیرعامل در فضای پلتفرم می‌تواند فعال‌سازی دستی یا اعطای دسترسی
          انجام دهد.
        </StatusBanner>
      ) : null}

      <div className="detail-grid two">
        <form className="panel stack" onSubmit={onSubmit}>
          <h2 className="panel-title">ثبت درخواست جدید</h2>
          <div className="field">
            <label htmlFor="kind">نوع</label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ExceptionKind)}
            >
              {(Object.keys(KIND_LABEL) as ExceptionKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
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
          {kind === 'purchase-failed' ? (
            <>
              <div className="field">
                <label htmlFor="svc">سرویس هدف</label>
                <input
                  id="svc"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="plan">پلن هدف</label>
                <input
                  id="plan"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="inv">تصویر فاکتور / رسید (mock)</label>
                <input id="inv" type="file" accept="image/*" onChange={onFile} />
              </div>
              {preview ? (
                <img
                  src={preview}
                  alt="پیش‌نمایش فاکتور"
                  style={{
                    maxWidth: '100%',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                />
              ) : null}
            </>
          ) : null}
          <button type="submit" className="btn btn-primary">
            ارسال به پلتفرم (mock)
          </button>
        </form>

        <section className="panel">
          <h2 className="panel-title">درخواست‌های من</h2>
          {mine.length === 0 ? (
            <EmptyState title="هنوز درخواستی نیست" />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>موضوع</th>
                    <th>نوع</th>
                    <th>وضعیت</th>
                    <th>نتیجه</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.subject}
                        <div className="meta mono">{t.id}</div>
                      </td>
                      <td className="meta">{KIND_LABEL[t.kind]}</td>
                      <td>
                        <StatusBadge
                          tone={
                            t.status === 'resolved'
                              ? 'ok'
                              : t.status === 'in-progress'
                                ? 'warn'
                                : 'info'
                          }
                        >
                          {t.status === 'open'
                            ? 'باز'
                            : t.status === 'in-progress'
                              ? 'در حال بررسی'
                              : t.status === 'resolved'
                                ? 'حل‌شده'
                                : 'رد شده'}
                        </StatusBadge>
                      </td>
                      <td className="meta">
                        {t.manuallyActivated
                          ? 'فعال‌سازی دستی انجام شد'
                          : t.accessGranted
                            ? 'دسترسی اعطا شد'
                            : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
