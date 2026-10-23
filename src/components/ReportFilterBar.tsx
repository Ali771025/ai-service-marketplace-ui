import type { ReactNode } from 'react'
import {
  BINDING_FILTER_OPTIONS,
  DATE_PRESET_OPTIONS,
  type BindingFilter,
  type DatePreset,
  type ReportDateFilter,
} from '../lib/reportFilters'

type Props = {
  date: ReportDateFilter
  onDateChange: (next: ReportDateFilter) => void
  /** فیلتر binding مدل — فقط وقتی dual-model است */
  binding?: BindingFilter
  onBindingChange?: (next: BindingFilter) => void
  search?: string
  onSearchChange?: (next: string) => void
  searchPlaceholder?: string
  searchLabel?: string
  /** فیلدهای اضافه (پلن، وضعیت، محیط، …) */
  children?: ReactNode
}

export function ReportFilterBar({
  date,
  onDateChange,
  binding,
  onBindingChange,
  search,
  onSearchChange,
  searchPlaceholder = 'جستجو…',
  searchLabel = 'جستجو',
  children,
}: Props) {
  return (
    <div className="filter-bar panel" role="search" aria-label="فیلتر گزارش">
      <div className="field" style={{ maxWidth: 180 }}>
        <label htmlFor="rep-preset">بازه زمانی</label>
        <select
          id="rep-preset"
          value={date.preset}
          onChange={(e) => {
            const preset = e.target.value as DatePreset
            onDateChange({ ...date, preset })
          }}
        >
          {DATE_PRESET_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {date.preset === 'custom' ? (
        <>
          <div className="field" style={{ maxWidth: 160 }}>
            <label htmlFor="rep-from">از تاریخ</label>
            <input
              id="rep-from"
              value={date.from}
              onChange={(e) => onDateChange({ ...date, from: e.target.value })}
              placeholder="۱۴۰۴/۱۲/۰۱"
            />
          </div>
          <div className="field" style={{ maxWidth: 160 }}>
            <label htmlFor="rep-to">تا تاریخ</label>
            <input
              id="rep-to"
              value={date.to}
              onChange={(e) => onDateChange({ ...date, to: e.target.value })}
              placeholder="۱۴۰۴/۱۲/۲۲"
            />
          </div>
        </>
      ) : null}

      {binding != null && onBindingChange ? (
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="rep-binding">مدل</label>
          <select
            id="rep-binding"
            value={binding}
            onChange={(e) => onBindingChange(e.target.value as BindingFilter)}
          >
            {BINDING_FILTER_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {onSearchChange != null ? (
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="rep-search">{searchLabel}</label>
          <input
            id="rep-search"
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      ) : null}

      {children}
    </div>
  )
}
