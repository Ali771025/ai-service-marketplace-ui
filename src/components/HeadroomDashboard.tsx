import { Link } from 'react-router-dom'
import { formatIrr } from '../lib/format'
import {
  headroomPct,
  headroomTone,
  type HeadroomMeter,
  type ModelHeadroomSnapshot,
  type InstanceHeadroomStrip,
} from '../data/headroom'
import { StatusBadge } from './ui/Primitives'

function formatUsedCap(m: HeadroomMeter): string {
  if (m.cap == null) {
    return m.unit === 'ریال'
      ? `${formatIrr(m.used)} · نامحدود`
      : `${formatNum(m.used)}${m.unit ? ` ${m.unit}` : ''} · نامحدود`
  }
  if (m.unit === 'ریال') {
    return `${formatIrr(m.used)} / ${formatIrr(m.cap)}`
  }
  return `${formatNum(m.used)} / ${formatNum(m.cap)}${m.unit ? ` ${m.unit}` : ''}`
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('fa-IR') : n.toLocaleString('fa-IR', { maximumFractionDigits: 1 })
}

function MeterBar({ meter, compact }: { meter: HeadroomMeter; compact?: boolean }) {
  const pct = headroomPct(meter.used, meter.cap)
  const tone = headroomTone(meter.used, meter.cap)
  const width = pct == null ? 0 : Math.max(2, pct)

  return (
    <div className={`headroom-meter${compact ? ' headroom-meter-compact' : ''}`}>
      <div className="headroom-meter-head">
        <span className="headroom-meter-label">{meter.label}</span>
        <span className="meta mono">{formatUsedCap(meter)}</span>
      </div>
      <div className="headroom-track" aria-hidden>
        {pct == null ? (
          <div className="headroom-fill headroom-fill-muted" style={{ width: '100%', opacity: 0.25 }} />
        ) : (
          <div className={`headroom-fill headroom-fill-${tone}`} style={{ width: `${width}%` }} />
        )}
      </div>
      <div className="headroom-meter-foot">
        {pct == null ? (
          <StatusBadge tone="muted">نامحدود</StatusBadge>
        ) : (
          <StatusBadge tone={tone === 'ok' ? 'ok' : tone === 'warn' ? 'warn' : 'danger'}>
            {pct >= 100 ? 'پر' : `${pct.toLocaleString('fa-IR')}٪`}
          </StatusBadge>
        )}
        {meter.hint && !compact ? <span className="meta">{meter.hint}</span> : null}
      </div>
    </div>
  )
}

/** داشبورد کامل نزدیک‌به‌سقف — خلاصه مصرف */
export function HeadroomDashboard({
  snapshot,
  usagePath,
}: {
  snapshot: ModelHeadroomSnapshot
  usagePath?: string
}) {
  return (
    <section className="panel headroom-panel" style={{ marginTop: '0.9rem' }}>
      <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="panel-title" style={{ margin: 0 }}>
          نزدیک به سقف (فاصله تا سقف‌های ثابت)
        </h2>
        {usagePath ? (
          <Link className="meta" to={usagePath}>
            جزئیات مصرف
          </Link>
        ) : null}
      </div>
      <p className="meta" style={{ marginTop: '0.35rem' }}>
        وضعیت ایستا نسبت به سقف هم‌زمانی، کلید، ظرفیت پلن و بودجه کلید —{' '}
        <strong>متفاوت</strong> از نمودار کوتاه‌مدت نرخ و از بنر هشدار نرم بودجه.
      </p>

      <div className="headroom-grid">
        <MeterBar meter={snapshot.concurrency} />
        <MeterBar meter={snapshot.apiKeys} />
      </div>

      {snapshot.planDims.length > 0 ? (
        <>
          <h3 className="panel-subtitle" style={{ marginTop: '0.85rem' }}>
            ابعاد ظرفیت پلن
          </h3>
          <div className="headroom-grid">
            {snapshot.planDims.map((m) => (
              <MeterBar key={m.id} meter={m} />
            ))}
          </div>
        </>
      ) : null}

      {snapshot.keyBudgets.length > 0 ? (
        <>
          <h3 className="panel-subtitle" style={{ marginTop: '0.85rem' }}>
            بودجه کلی per کلید
          </h3>
          <p className="meta" style={{ marginTop: 0 }}>
            میلهٔ فاصله تا سقف — هشدار چندآستانهٔ نرم (#۹) جداگانه با بنر نشان داده می‌شود.
          </p>
          <div className="headroom-grid">
            {snapshot.keyBudgets.map((m) => (
              <MeterBar key={m.id} meter={m} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

/** ویجت فشرده برای هاب حساب پیمانکار/مصرف‌کننده */
export function HeadroomAccountWidget({
  snapshot,
  detailTo,
}: {
  snapshot: ModelHeadroomSnapshot
  detailTo: string
}) {
  const highlights = [snapshot.concurrency, snapshot.apiKeys, ...snapshot.planDims.slice(0, 2)]

  return (
    <section className="panel" style={{ marginTop: '0.9rem' }}>
      <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="panel-title" style={{ margin: 0 }}>
          نزدیک به سقف
        </h2>
        <Link className="btn btn-ghost btn-sm" to={detailTo}>
          خلاصه مصرف
        </Link>
      </div>
      <p className="meta" style={{ marginTop: '0.35rem' }}>
        {snapshot.modelName} — فاصله تا سقف‌های ثابت (نه نمودار کوتاه‌مدت)
      </p>
      <div className="headroom-grid headroom-grid-compact">
        {highlights.map((m) => (
          <MeterBar key={m.id} meter={m} compact />
        ))}
      </div>
    </section>
  )
}

/** نوار سبک روی خانهٔ Instance سازنده */
export function HeadroomInstanceStrip({ strip }: { strip: InstanceHeadroomStrip }) {
  return (
    <div className="headroom-strip" role="status">
      <span className="headroom-strip-title">ظرفیت پلن · {strip.planName}</span>
      <div className="headroom-strip-meters">
        {strip.meters.map((m) => {
          const pct = headroomPct(m.used, m.cap)
          const tone = headroomTone(m.used, m.cap)
          return (
            <div key={m.id} className="headroom-strip-item">
              <span className="meta">{m.label}</span>
              <div className="headroom-track headroom-track-thin" aria-hidden>
                {pct == null ? (
                  <div className="headroom-fill headroom-fill-muted" style={{ width: '100%', opacity: 0.2 }} />
                ) : (
                  <div
                    className={`headroom-fill headroom-fill-${tone}`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                )}
              </div>
              <span className="meta mono">
                {m.cap == null
                  ? '∞'
                  : `${formatNum(m.used)}/${formatNum(m.cap)}${m.unit ? ` ${m.unit}` : ''}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
