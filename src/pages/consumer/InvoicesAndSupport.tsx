import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CONSUMER_INVOICES,
  SUPPORT_TICKETS,
} from '../../data/consumerExtras'
import {
  EmptyState,
  PageHeader,
  StatusBadge,
} from '../../components/ui/Primitives'
import { formatIrr } from '../../lib/format'

export function ConsumerInvoicesPage() {
  return (
    <div>
      <PageHeader
        title="صورت‌حساب‌ها"
        description="فقط خرید پلن پشتیبانی — صورت‌حساب per درخواست مصرف نداریم. استرداد خرید پلن در MVP نیست."
      />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>شماره</th>
              <th>تاریخ</th>
              <th>مدل / پلن</th>
              <th>مبلغ</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {CONSUMER_INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td className="mono">{inv.id}</td>
                <td>{inv.at}</td>
                <td>
                  {inv.modelName}
                  <div className="meta">{inv.planName}</div>
                </td>
                <td>{formatIrr(inv.amountIrr)}</td>
                <td>
                  <StatusBadge
                    tone={
                      inv.status === 'paid'
                        ? 'ok'
                        : inv.status === 'pending'
                          ? 'warn'
                          : 'danger'
                    }
                  >
                    {inv.status === 'paid'
                      ? 'پرداخت‌شده'
                      : inv.status === 'pending'
                        ? 'در انتظار'
                        : 'ناموفق'}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ConsumerSupportPage() {
  const [status, setStatus] = useState<'all' | 'open' | 'waiting' | 'closed'>('all')
  const filtered = useMemo(
    () =>
      SUPPORT_TICKETS.filter((t) => (status === 'all' ? true : t.status === status)),
    [status],
  )

  return (
    <div>
      <PageHeader
        title="پشتیبانی"
        description="تیکت روی مدل — مسیریابی به مدل‌ساز همان مدل"
      />
      <div className="filter-bar panel">
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="st">وضعیت</label>
          <select
            id="st"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">همه</option>
            <option value="open">باز</option>
            <option value="waiting">در انتظار پاسخ</option>
            <option value="closed">بسته</option>
          </select>
        </div>
        <div className="btn-row" style={{ alignItems: 'flex-end' }}>
          <Link className="btn btn-primary" to="/consumer/support/new">
            تیکت جدید
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="تیکتی یافت نشد" />
      ) : (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>موضوع</th>
                <th>مدل</th>
                <th>وضعیت</th>
                <th>به‌روزرسانی</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/consumer/support/${t.id}`}>{t.subject}</Link>
                    <div className="meta mono">{t.id}</div>
                  </td>
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
                  <td className="meta">{t.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
