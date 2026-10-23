import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../../data/MockStore'
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  StatusBanner,
} from '../../components/ui/Primitives'
import type { ExceptionTicket } from '../../data/appState'

const KIND_LABEL: Record<ExceptionTicket['kind'], string> = {
  access: 'مشکل دسترسی',
  'purchase-failed': 'خرید ناموفق / فعال‌سازی دستی',
  'wallet-debt': 'بدهی کیف پول',
  other: 'سایر',
}

export function PlatformExceptionsPage() {
  const { exceptionTickets, updateExceptionTicket } = useMockStore()
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all')
  const [selectedId, setSelectedId] = useState(exceptionTickets[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [reply, setReply] = useState('')

  const rows = useMemo(
    () =>
      exceptionTickets.filter((t) =>
        filter === 'all' ? true : t.status === filter || (filter === 'open' && t.status === 'open'),
      ),
    [exceptionTickets, filter],
  )
  const selected = exceptionTickets.find((t) => t.id === selectedId) ?? rows[0]

  return (
    <div>
      <PageHeader
        eyebrow="پشتیبانی"
        title="صندوق استثناها"
        description="فعال‌سازی دستی entitlement، مشکل دسترسی، خرید ناموفق با تصویر فاکتور"
      />
      <StatusBanner tone="info">
        صف پشتیبانی عمومی و ارجاع تیکت مدل:{' '}
        <Link to="/platform/tickets">صف تیکت پشتیبانی</Link>
      </StatusBanner>
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
            <option value="in-progress">در حال بررسی</option>
            <option value="resolved">حل‌شده</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="تیکت استثنایی نیست" />
      ) : (
        <div className="detail-grid two">
          <section className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>موضوع</th>
                  <th>نوع</th>
                  <th>درخواست‌کننده</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      cursor: 'pointer',
                      background: selected?.id === t.id ? 'var(--primary-soft)' : undefined,
                    }}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <td>{t.subject}</td>
                    <td className="meta">{KIND_LABEL[t.kind]}</td>
                    <td>{t.requesterName}</td>
                    <td>
                      <StatusBadge
                        tone={
                          t.status === 'resolved'
                            ? 'ok'
                            : t.status === 'rejected'
                              ? 'danger'
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
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {selected ? (
            <section className="panel stack">
              <h2 className="panel-title">{selected.subject}</h2>
              <p className="meta" style={{ margin: 0 }}>
                {KIND_LABEL[selected.kind]} · {selected.requesterName}
              </p>
              <p style={{ margin: 0 }}>{selected.body}</p>
              {selected.targetPlanName ? (
                <p className="meta">
                  هدف فعال‌سازی: {selected.targetServiceName} / {selected.targetPlanName}
                </p>
              ) : null}
              {selected.invoiceImageDataUrl ? (
                <div>
                  <p className="meta">تصویر فاکتور / رسید ({selected.invoiceFileName})</p>
                  <img
                    src={selected.invoiceImageDataUrl}
                    alt="invoice"
                    style={{
                      maxWidth: '100%',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
              ) : null}
              {selected.messages.map((m) => (
                <div key={m.id} className="ticket-msg">
                  <div className="meta">
                    {m.from === 'platform' ? 'پلتفرم' : 'کاربر'} · {m.at}
                  </div>
                  <p style={{ margin: '0.25rem 0 0' }}>{m.body}</p>
                </div>
              ))}
              {selected.accessGranted ? (
                <StatusBanner tone="ok">دسترسی mock اعطا شده است.</StatusBanner>
              ) : null}
              {selected.manuallyActivated ? (
                <StatusBanner tone="ok">
                  پلن به‌صورت دستی فعال شد و Instance در پنل مدل‌ساز ایجاد گردید.
                </StatusBanner>
              ) : null}
              <div className="field">
                <label htmlFor="note">یادداشت داخلی</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="reply">پاسخ به کاربر</label>
                <textarea
                  id="reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    updateExceptionTicket({
                      id: selected.id,
                      status: 'in-progress',
                      platformNote: note || undefined,
                      reply: reply || undefined,
                    })
                  }
                >
                  در حال بررسی
                </button>
                {selected.kind === 'access' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      updateExceptionTicket({
                        id: selected.id,
                        status: 'resolved',
                        accessGranted: true,
                        platformNote: note || 'دسترسی اعطا شد',
                        reply: reply || 'دسترسی شما فعال شد.',
                      })
                    }
                  >
                    اعطای دسترسی (mock)
                  </button>
                ) : null}
                {selected.kind === 'purchase-failed' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      updateExceptionTicket({
                        id: selected.id,
                        status: 'resolved',
                        manuallyActivate: true,
                        platformNote: note || 'فعال‌سازی دستی پس از بررسی رسید',
                        reply:
                          reply ||
                          'پس از بررسی تصویر فاکتور، پلن به‌صورت دستی فعال شد.',
                      })
                    }
                  >
                    فعال‌سازی دستی پلن
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    updateExceptionTicket({
                      id: selected.id,
                      status: 'resolved',
                      platformNote: note || undefined,
                      reply: reply || 'تیکت بسته شد.',
                    })
                  }
                >
                  بستن / حل‌شده
                </button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function PlatformProvisioningPage() {
  const { provisionJobs, upsertProvisionJob, advanceProvisionJob, services } =
    useMockStore()
  const [serviceName, setServiceName] = useState(services[0]?.name ?? '')
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
  const [msg, setMsg] = useState<string | null>(null)
  const [lastSecret, setLastSecret] = useState<string | null>(null)

  return (
    <div>
      <PageHeader
        title="نصب سرویس از پنل پلتفرم"
        description="فیلدهای حداقل طبق Confirmed-Decisions — فقط پلتفرم نمونه با رمز اتصال فراخوانی می‌کند؛ سرویس نبض سلامت می‌فرستد"
      />
      <StatusBanner tone="info">
        UI در پلتفرم نمونه رندر می‌شود. نصب و اعتبارسنجی از این پنل است؛ گزارش سلامت مداوم از سمت سرویس
        (mock).
      </StatusBanner>

      <section className="panel stack">
        <h2 className="panel-title">ثبت / پیش‌نویس نصب Remote</h2>
        <div className="detail-grid two">
          <div className="field">
            <label htmlFor="svc">سرویس</label>
            <select
              id="svc"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ver">برچسب نسخه سرویس</label>
            <input
              id="ver"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="base">آدرس پایه سرور سرویس</label>
            <input
              id="base"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://svc.example.local"
            />
          </div>
          <div className="field">
            <label htmlFor="cv">نسخه قرارداد الحاق</label>
            <input
              id="cv"
              value={contractVersion}
              onChange={(e) => setContractVersion(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="hp">مسیر بررسی سلامت</label>
            <input
              id="hp"
              value={healthPath}
              onChange={(e) => setHealthPath(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="to">مهلت انتظار پاسخ (ثانیه)</label>
            <input
              id="to"
              type="number"
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(Number(e.target.value) || 30)}
            />
          </div>
          <div className="field">
            <label htmlFor="env">محیط</label>
            <select
              id="env"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'staging' | 'production')}
            >
              <option value="production">اصلی</option>
              <option value="staging">آزمایشی</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="surf">سطح مصرف مدل</label>
            <select
              id="surf"
              value={consumerSurface}
              onChange={(e) =>
                setConsumerSurface(e.target.value as typeof consumerSurface)
              }
            >
              <option value="api-key-only">فقط کلید دسترسی</option>
              <option value="embedded-ui">واسط داخل پلتفرم نمونه</option>
              <option value="hybrid">ترکیبی</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="notes">یادداشت</label>
            <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const secret = `portfolio-sec-${Math.random().toString(36).slice(2, 10)}`
              const id = upsertProvisionJob({
                serviceName,
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
              setMsg(
                `پیش‌نویس ثبت شد (${id}). شناسه/رمز اتصال صادر شد — رمز فقط همین‌بار نشان داده می‌شود.`,
              )
            }}
          >
            ذخیره پیش‌نویس + صدور رمز اتصال
          </button>
        </div>
        {msg ? <StatusBanner tone="ok">{msg}</StatusBanner> : null}
        {lastSecret ? (
          <StatusBanner tone="warn">
            رمز اتصال (یک‌بار نمایش): <span className="mono">{lastSecret}</span>
          </StatusBanner>
        ) : null}
      </section>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">وضعیت نصب‌ها و نبض سلامت</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>سرویس</th>
                <th>قرارداد</th>
                <th>وضعیت</th>
                <th>سلامت</th>
                <th>آدرس پایه</th>
                <th>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {provisionJobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    {j.serviceName}
                    <div className="meta mono">{j.connectionId}</div>
                  </td>
                  <td className="mono meta">{j.contractVersion ?? j.versionLabel}</td>
                  <td>
                    <StatusBadge
                      tone={
                        j.status === 'active'
                          ? 'ok'
                          : j.status === 'failed' || j.status === 'disabled'
                            ? 'danger'
                            : j.status === 'installing'
                              ? 'warn'
                              : 'muted'
                      }
                    >
                      {j.status === 'draft'
                        ? 'پیش‌نویس'
                        : j.status === 'installing'
                          ? 'در حال نصب'
                          : j.status === 'active'
                            ? 'فعال'
                            : j.status === 'disabled'
                              ? 'غیرفعال نرم'
                              : 'ناموفق'}
                    </StatusBadge>
                    {j.lastError ? <div className="meta">{j.lastError}</div> : null}
                  </td>
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
                      {j.healthStatus === 'ok'
                        ? 'سالم'
                        : j.healthStatus === 'down'
                          ? 'قطع'
                          : j.healthStatus === 'degraded'
                            ? 'اختلال'
                            : 'نامشخص'}
                    </StatusBadge>
                    <div className="meta">{j.lastHealthAt ?? '—'}</div>
                  </td>
                  <td className="mono meta">{j.baseUrl || j.endpoint || '—'}</td>
                  <td>
                    <div className="btn-row" style={{ marginTop: 0, flexWrap: 'wrap' }}>
                      {j.status === 'draft' ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            upsertProvisionJob({
                              id: j.id,
                              serviceName: j.serviceName,
                              versionLabel: j.versionLabel,
                              healthStatus: 'ok',
                              lastHealthAt: 'تست اتصال موفق (mock)',
                            })
                            advanceProvisionJob(j.id, 'installing')
                          }}
                        >
                          تست اتصال و شروع نصب
                        </button>
                      ) : null}
                      {j.status === 'installing' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              upsertProvisionJob({
                                id: j.id,
                                serviceName: j.serviceName,
                                versionLabel: j.versionLabel,
                                healthStatus: 'ok',
                                lastHealthAt: 'فعال — نبض ok',
                                blockHardDelete: true,
                              })
                              advanceProvisionJob(j.id, 'active')
                            }}
                          >
                            فعال‌سازی موفق
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              advanceProvisionJob(
                                j.id,
                                'failed',
                                'سرویس جواب نداد — رزرو بدون کسر قطعی آزاد می‌شود (mock)',
                              )
                            }
                          >
                            ناموفق / بدون پاسخ
                          </button>
                        </>
                      ) : null}
                      {j.status === 'active' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              upsertProvisionJob({
                                id: j.id,
                                serviceName: j.serviceName,
                                versionLabel: j.versionLabel,
                                healthStatus: 'ok',
                                lastHealthAt: 'نبض تازه (mock)',
                              })
                            }
                          >
                            دریافت نبض سلامت
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (
                                j.blockHardDelete &&
                                !window.confirm(
                                  'پلن/نمونه فعال ممکن است وجود داشته باشد. فقط غیرفعال نرم انجام شود (حذف سخت ممنوع). ادامه؟',
                                )
                              ) {
                                return
                              }
                              advanceProvisionJob(j.id, 'disabled')
                            }}
                          >
                            غیرفعال نرم
                          </button>
                        </>
                      ) : null}
                      {j.status === 'failed' || j.status === 'disabled' ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => advanceProvisionJob(j.id, 'draft')}
                        >
                          بازگشت به پیش‌نویس
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="meta">
        <Link to="/platform/services">بازگشت به سرویس‌ها</Link>
      </p>
    </div>
  )
}
