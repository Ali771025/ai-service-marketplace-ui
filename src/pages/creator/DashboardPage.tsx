import { Link } from 'react-router-dom'
import {
  CREATOR_DASHBOARD,
  CREATOR_EARNINGS_SUMMARY,
  CREATOR_INSTANCES,
  CREATOR_TICKETS,
} from '../../data/creator'
import { PageHeader, StatusBadge, StatusBanner } from '../../components/ui/Primitives'
import { formatIrr } from '../../lib/format'

export function CreatorDashboardPage() {
  const d = CREATOR_DASHBOARD
  return (
    <div>
      <PageHeader
        title="داشبورد مدل‌ساز"
        description="خلاصه درآمد، نمونه‌ها و هشدارها"
      />
      <div className="stat-grid">
        <div className="stat-card">
          <span className="meta">درآمد امروز</span>
          <strong>{formatIrr(d.revenueTodayIrr)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">درآمد ماه</span>
          <strong>{formatIrr(d.revenueMonthIrr)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">از مصرف (Markup)</span>
          <strong>{formatIrr(d.fromUsageIrr)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">از پشتیبانی</span>
          <strong>{formatIrr(d.fromSupportIrr)}</strong>
        </div>
      </div>

      {d.expiringPlans > 0 ? (
        <StatusBanner tone="warn">
          {d.expiringPlans} نمونه رو به انقضا —{' '}
          <Link to="/creator/plans">پلن‌ها و نمونه‌ها</Link>
        </StatusBanner>
      ) : null}
      {d.openTickets > 0 ? (
        <StatusBanner tone="info">
          {d.openTickets} تیکت باز — <Link to="/creator/tickets">تیکت‌ها</Link>
        </StatusBanner>
      ) : null}

      <div className="detail-grid two" style={{ marginTop: '0.9rem' }}>
        <section className="panel">
          <h2 className="panel-title">نمونه‌های فعال</h2>
          <ul className="plain-list">
            {CREATOR_INSTANCES.filter((i) => i.status !== 'expired').map((i) => (
              <li key={i.id}>
                <strong>{i.planName}</strong>
                <div className="meta">
                  {i.serviceName}
                  {i.linkedModelName ? ` · مدل: ${i.linkedModelName}` : ' · بدون مدل'}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel stack">
          <h2 className="panel-title">اقدامات سریع</h2>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/creator/plans">
              خرید پلن جدید
            </Link>
            <Link className="btn btn-secondary" to="/creator/models">
              مدل‌های من
            </Link>
            <Link className="btn btn-secondary" to="/creator/support-plans">
              تعریف پشتیبانی
            </Link>
          </div>
          <p className="meta">
            موجودی قابل وصول:{' '}
            <Link to="/creator/earnings">
              {formatIrr(CREATOR_EARNINGS_SUMMARY.availableIrr)}
            </Link>
          </p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">تیکت‌های اخیر</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>موضوع</th>
                <th>مدل</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {CREATOR_TICKETS.slice(0, 3).map((t) => (
                <tr key={t.id}>
                  <td>{t.subject}</td>
                  <td>{t.modelName}</td>
                  <td>
                    <StatusBadge
                      tone={
                        t.status === 'open'
                          ? 'info'
                          : t.status === 'waiting'
                            ? 'warn'
                            : 'muted'
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
        </div>
      </section>
    </div>
  )
}
