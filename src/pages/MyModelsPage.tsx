import { Link } from 'react-router-dom'
import { useMockStore } from '../data/MockStore'
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  StatusBanner,
} from '../components/ui/Primitives'
import { supportLabel } from '../lib/format'

export function MyModelsPage() {
  const { models, requests, availableIrr, setAutoRenew } = useMockStore()
  const mine = models.filter((m) => m.inMyModels)

  return (
    <div>
      <PageHeader
        title="مدل‌های من"
        description="وضعیت پلن پشتیبانی، تمدید خودکار، و دسترسی به مصرف یا مشاهده تاریخچه"
      />

      {availableIrr < 0 ? (
        <StatusBanner tone="danger">
          بدهی کیف پول — مصرف جدید مسدود است.{' '}
          <Link to="/consumer/wallet">کیف پول</Link>
        </StatusBanner>
      ) : null}

      {mine.length === 0 ? (
        <EmptyState
          title="هنوز مدلی در فهرست شما نیست"
          action={
            <Link className="btn btn-primary" to="/consumer/discover">
              کشف مدل‌ها
            </Link>
          }
        />
      ) : (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>مدل</th>
                <th>پشتیبانی</th>
                <th>تمدید خودکار</th>
                <th>آخرین درخواست</th>
                <th>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((m) => {
                const last = requests.find((r) => r.modelId === m.id)
                const expired =
                  m.supportRequired && m.supportPlanStatus === 'expired'
                const monthlyActive =
                  m.supportPlanStatus === 'active' &&
                  Boolean(m.supportPlanName?.includes('ماهانه'))
                return (
                  <tr key={m.id}>
                    <td>
                      <Link to={`/consumer/models/${m.id}`}>{m.name}</Link>
                      <div className="meta">
                        {m.creatorName}
                        {m.ownedByCurrentUser ? ' · مدل شما (فقط Base)' : ''}
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        tone={
                          m.supportPlanStatus === 'active'
                            ? 'ok'
                            : m.supportPlanStatus === 'expired'
                              ? 'warn'
                              : 'info'
                        }
                      >
                        {supportLabel(m.supportPlanStatus)}
                      </StatusBadge>
                      {m.supportExpiresAt ? (
                        <div className="meta">تا {m.supportExpiresAt}</div>
                      ) : null}
                    </td>
                    <td>
                      {monthlyActive ? (
                        <label className="toggle-row">
                          <input
                            type="checkbox"
                            checked={Boolean(m.autoRenew)}
                            onChange={(e) =>
                              setAutoRenew(m.id, e.target.checked)
                            }
                          />
                          {m.autoRenew ? 'روشن' : 'خاموش'}
                        </label>
                      ) : (
                        <span className="meta">—</span>
                      )}
                      {monthlyActive ? (
                        <div className="meta">
                          شکست شارژ خودکار / dunning: OPEN
                        </div>
                      ) : null}
                    </td>
                    <td className="meta">
                      {last ? (
                        <>
                          {last.createdAt}
                          <br />
                          <Link to={`/consumer/requests/${last.id}`}>{last.id}</Link>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="btn-row" style={{ marginTop: 0 }}>
                        {expired ? (
                          <>
                            <Link
                              className="btn btn-secondary"
                              to={`/consumer/buy-support?modelId=${m.id}`}
                            >
                              تمدید پشتیبانی
                            </Link>
                            <Link
                              className="btn btn-ghost"
                              to={`/consumer/models/${m.id}`}
                            >
                              مشاهده تاریخچه
                            </Link>
                          </>
                        ) : (
                          <Link
                            className="btn btn-primary"
                            to={`/consumer/models/${m.id}/request`}
                            aria-disabled={availableIrr < 0}
                            onClick={(e) => {
                              if (availableIrr < 0) e.preventDefault()
                            }}
                          >
                            درخواست جدید
                          </Link>
                        )}
                        <Link className="btn btn-ghost" to={`/consumer/models/${m.id}`}>
                          جزئیات
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">درخواست‌های اخیر</h2>
        <p className="meta" style={{ marginTop: 0 }}>
          پس از انقضای پشتیبانی، مشاهده تاریخچه مجاز است؛ درخواست/تیکت جدید خیر.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>مدل</th>
                <th>وضعیت</th>
                <th>سؤال</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 8).map((r) => {
                const model = models.find((m) => m.id === r.modelId)
                return (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/consumer/requests/${r.id}`}>{r.id}</Link>
                    </td>
                    <td>{model?.name ?? r.modelId}</td>
                    <td>
                      <StatusBadge
                        tone={
                          r.status === 'delivered'
                            ? 'ok'
                            : r.status === 'failed'
                              ? 'danger'
                              : 'info'
                        }
                      >
                        {r.status === 'delivered'
                          ? 'تحویل‌شده'
                          : r.status === 'failed'
                            ? 'ناموفق'
                            : r.status === 'query-ready'
                              ? 'کوئری آماده'
                              : r.status}
                      </StatusBadge>
                    </td>
                    <td className="muted">{r.question}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
