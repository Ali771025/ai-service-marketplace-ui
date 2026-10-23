import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../data/MockStore'
import {
  EmptyState,
  PageHeader,
  PriceBreakdown,
  StatusBadge,
} from '../components/ui/Primitives'
import { ReportFilterBar } from '../components/ReportFilterBar'
import {
  defaultReportDateFilter,
  isAtInDateFilter,
  periodLabelForFilter,
} from '../lib/reportFilters'

export function UsagePage() {
  const { usage, models } = useMockStore()
  const [date, setDate] = useState(() => defaultReportDateFilter('30d'))
  const [status, setStatus] = useState<'all' | 'success' | 'error'>('all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const query = q.trim()
    return usage.filter((u) => {
      if (!isAtInDateFilter(u.at, date)) return false
      if (status !== 'all' && u.status !== status) return false
      if (query) {
        const model = models.find((m) => m.id === u.modelId)
        const hay = `${model?.name ?? ''} ${u.modelId} ${u.requestId} ${u.snapshotRef}`
        if (!hay.includes(query)) return false
      }
      return true
    })
  }, [usage, models, date, status, q])

  return (
    <div>
      <PageHeader
        title="مصرف و هزینه‌ها"
        description="گزارش هزینه‌ای درخواست‌ها با تفکیک Base و Markup — صورت‌حساب per درخواست نیست"
      />

      <ReportFilterBar
        date={date}
        onDateChange={setDate}
        search={q}
        onSearchChange={setQ}
        searchLabel="جستجو"
        searchPlaceholder="مدل / درخواست…"
      >
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="usg-status">وضعیت</label>
          <select
            id="usg-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">همه</option>
            <option value="success">موفق</option>
            <option value="error">خطا</option>
          </select>
        </div>
      </ReportFilterBar>

      <p className="meta" style={{ marginTop: '-0.4rem' }}>
        بازه: {periodLabelForFilter(date)} · {rows.length.toLocaleString('fa-IR')} ردیف
      </p>

      {rows.length === 0 ? (
        <EmptyState title="مصرفی با این فیلتر نیست" hint="بازه یا وضعیت را باز کنید." />
      ) : (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>زمان</th>
                <th>مدل</th>
                <th>وضعیت</th>
                <th>هزینه</th>
                <th>Snapshot</th>
                <th>درخواست</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const model = models.find((m) => m.id === u.modelId)
                return (
                  <tr key={u.id}>
                    <td>{u.at}</td>
                    <td>
                      {model ? (
                        <Link to={`/consumer/models/${model.id}`}>{model.name}</Link>
                      ) : (
                        u.modelId
                      )}
                    </td>
                    <td>
                      <StatusBadge tone={u.status === 'success' ? 'ok' : 'danger'}>
                        {u.status === 'success' ? 'موفق' : 'خطا'}
                      </StatusBadge>
                    </td>
                    <td>
                      {u.baseIrr + u.markupIrr > 0 ? (
                        <>
                          <PriceBreakdown base={u.baseIrr} markup={u.markupIrr} />
                          {u.note ? <div className="meta">{u.note}</div> : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="mono muted">{u.snapshotRef}</td>
                    <td>
                      <Link to={`/consumer/requests/${u.requestId}`}>{u.requestId}</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
