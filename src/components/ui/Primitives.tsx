import type { ReactNode } from 'react'
import { formatIrr } from '../../lib/format'

export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string
  description?: string
  /** برچسب فضای فعلی — مثلاً «میز کار حساب» */
  eyebrow?: string
}) {
  return (
    <header className="page-header">
      {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  )
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  ariaLabel,
}: {
  items: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  ariaLabel: string
}) {
  return (
    <div className="hub-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`hub-tab${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: 'ok' | 'warn' | 'danger' | 'info' | 'muted'
  children: ReactNode
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function StatusBanner({
  tone,
  children,
}: {
  tone: 'warn' | 'danger' | 'info' | 'ok'
  children: ReactNode
}) {
  return (
    <div className={`banner banner-${tone}`} role="status">
      {children}
    </div>
  )
}

export function PriceBreakdown({
  base,
  markup,
}: {
  base: number
  markup: number
}) {
  return (
    <div className="price-inline">
      <span>{formatIrr(base + markup)}</span>
      <span className="muted">
        {' '}
        (Base {formatIrr(base)} + Markup {formatIrr(markup)})
      </span>
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="empty panel">
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
      {action}
    </div>
  )
}
