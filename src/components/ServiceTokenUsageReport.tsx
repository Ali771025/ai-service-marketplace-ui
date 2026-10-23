import { useMemo, useState } from 'react'
import { StatusBanner } from './ui/Primitives'
import { ReportFilterBar } from './ReportFilterBar'
import { formatIrr } from '../lib/format'
import { downloadCsv } from '../lib/downloadCsv'
import {
  defaultReportDateFilter,
  type BindingFilter,
} from '../lib/reportFilters'
import {
  applyTokenUsageFilters,
  bindingLabel,
  type ServiceTokenUsageReport,
} from '../data/serviceTokenUsage'

type Props = {
  report: ServiceTokenUsageReport
  /** عنوان بخش — مثلاً «گزارش مصرف این سرویس» */
  title?: string
}

export function ServiceTokenUsageReportView({
  report,
  title = 'گزارش مصرف توکن',
}: Props) {
  const [date, setDate] = useState(() => defaultReportDateFilter('30d'))
  const [binding, setBinding] = useState<BindingFilter>('all')
  const [modelQuery, setModelQuery] = useState('')

  const filtered = useMemo(
    () =>
      applyTokenUsageFilters(report, {
        date,
        binding: report.dualModel ? binding : 'all',
        modelQuery,
      }),
    [report, date, binding, modelQuery],
  )

  return (
    <div className="stack section-stack">
      <ReportFilterBar
        date={date}
        onDateChange={setDate}
        binding={report.dualModel ? binding : undefined}
        onBindingChange={report.dualModel ? setBinding : undefined}
        search={modelQuery}
        onSearchChange={setModelQuery}
        searchLabel="مدل"
        searchPlaceholder="نام مدل…"
      />

      <div className="btn-row" style={{ marginTop: '-0.4rem', marginBottom: '0.25rem' }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={filtered.daily.length === 0}
          onClick={() => {
            const headers = report.dualModel
              ? ['تاریخ', 'درخواست', 'توکن داخلی', 'توکن خارجی', 'برآورد Base (ریال)']
              : ['تاریخ', 'درخواست', 'توکن', 'برآورد Base (ریال)']
            const rows = filtered.daily.map((d) =>
              report.dualModel
                ? [d.at, d.requests, d.tokensInternal, d.tokensExternal, d.baseIrrApprox]
                : [d.at, d.requests, d.tokensExternal, d.baseIrrApprox],
            )
            const stamp = new Date().toISOString().slice(0, 10)
            downloadCsv(`portfolio-token-usage-${report.serviceId}-${stamp}.csv`, headers, rows)
          }}
        >
          صادرات CSV (با فیلتر فعال)
        </button>
      </div>

      <StatusBanner tone="info">
        بازه: <strong>{filtered.periodLabel}</strong> · سرویس «{report.serviceName}» — مصرف فقط همین
        محدوده؛ با گزارش‌های سراسری پلتفرم قاطی نیست.
      </StatusBanner>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="meta">توکن کل</span>
          <strong>{filtered.tokensTotal.toLocaleString('fa-IR')}</strong>
        </div>
        {report.dualModel ? (
          <>
            <div className="stat-card">
              <span className="meta">توکن داخلی</span>
              <strong>{filtered.tokensInternal.toLocaleString('fa-IR')}</strong>
            </div>
            <div className="stat-card">
              <span className="meta">توکن خارجی</span>
              <strong>{filtered.tokensExternal.toLocaleString('fa-IR')}</strong>
            </div>
          </>
        ) : null}
        <div className="stat-card">
          <span className="meta">درخواست (شمارنده)</span>
          <strong>{filtered.requestsMonth.toLocaleString('fa-IR')}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">برآورد Base (ریال)</span>
          <strong style={{ fontSize: '1rem' }}>{formatIrr(filtered.baseIrrApprox)}</strong>
        </div>
      </div>

      {report.dualModel ? (
        <section className="panel stack">
          <h2 className="panel-title">{title} — دو مدل</h2>
          <p className="meta" style={{ margin: 0 }}>
            کوئری‌ساز دو binding دارد؛ گزارش توکن برای هر دو الزامی است. Meter قیمت جدا برای داخلی/خارجی
            تعریف نمی‌شود.
          </p>
          <div className="detail-grid two">
            <div className="stat-card" style={{ margin: 0 }}>
              <span className="meta">{bindingLabel('internal')}</span>
              <strong>{filtered.tokensInternal.toLocaleString('fa-IR')} توکن</strong>
              <p className="meta" style={{ margin: 0 }}>
                فقط گزارش Usage / حسابرسی در این دمو
              </p>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <span className="meta">{bindingLabel('external')}</span>
              <strong>{filtered.tokensExternal.toLocaleString('fa-IR')} توکن</strong>
              <p className="meta" style={{ margin: 0 }}>
                هم‌راستا با مسیر Base روی متر توکن
              </p>
            </div>
          </div>
          <StatusBanner tone="warn">{report.billingNote}</StatusBanner>
        </section>
      ) : (
        <StatusBanner tone="info">{report.billingNote}</StatusBanner>
      )}

      <section className="panel table-wrap">
        <h2 className="panel-title">مصرف روزانه</h2>
        {filtered.daily.length === 0 ? (
          <p className="meta">ردیفی با این فیلتر نیست.</p>
        ) : (
          <table className="data dense">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>درخواست</th>
                {report.dualModel ? (
                  <>
                    <th>توکن داخلی</th>
                    <th>توکن خارجی</th>
                  </>
                ) : (
                  <th>توکن</th>
                )}
                <th>برآورد Base</th>
              </tr>
            </thead>
            <tbody>
              {filtered.daily.map((d) => (
                <tr key={d.id}>
                  <td>{d.at}</td>
                  <td>{d.requests.toLocaleString('fa-IR')}</td>
                  {report.dualModel ? (
                    <>
                      <td>{d.tokensInternal.toLocaleString('fa-IR')}</td>
                      <td>{d.tokensExternal.toLocaleString('fa-IR')}</td>
                    </>
                  ) : (
                    <td>{d.tokensExternal.toLocaleString('fa-IR')}</td>
                  )}
                  <td>{formatIrr(d.baseIrrApprox)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel table-wrap">
        <h2 className="panel-title">تفکیک به ازای مدل</h2>
        {filtered.byModel.length === 0 ? (
          <p className="meta">مدلی با این فیلتر نیست.</p>
        ) : (
          <table className="data dense">
            <thead>
              <tr>
                <th>مدل</th>
                <th>درخواست</th>
                {report.dualModel ? (
                  <>
                    <th>توکن داخلی</th>
                    <th>توکن خارجی</th>
                    <th>جمع توکن</th>
                  </>
                ) : (
                  <th>توکن</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.byModel.map((m) => (
                <tr key={m.modelId}>
                  <td>{m.modelName}</td>
                  <td>{m.requests.toLocaleString('fa-IR')}</td>
                  {report.dualModel ? (
                    <>
                      <td>{m.tokensInternal.toLocaleString('fa-IR')}</td>
                      <td>{m.tokensExternal.toLocaleString('fa-IR')}</td>
                      <td>
                        {(m.tokensInternal + m.tokensExternal).toLocaleString('fa-IR')}
                      </td>
                    </>
                  ) : (
                    <td>{m.tokensExternal.toLocaleString('fa-IR')}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
