/**
 * فیلتر مشترک گزارش‌های تعبیه‌شده — تاریخ دمو و پیش‌فرض‌های بازه
 */

export type DatePreset = 'today' | '7d' | '30d' | 'custom'

export type BindingFilter = 'all' | 'internal' | 'external'

export type ReportDateFilter = {
  preset: DatePreset
  /** تاریخ شمسی نمایشی — برای حالت سفارشی */
  from: string
  to: string
}

/** «امروز» در داده‌های mock گزارش */
export const MOCK_REPORT_TODAY = '۱۴۰۴/۱۲/۲۲'

export const DATE_PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'امروز' },
  { id: '7d', label: '۷ روز' },
  { id: '30d', label: '۳۰ روز' },
  { id: 'custom', label: 'سفارشی' },
]

export const BINDING_FILTER_OPTIONS: { id: BindingFilter; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'internal', label: 'داخلی' },
  { id: 'external', label: 'خارجی' },
]

const FA = '۰۱۲۳۴۵۶۷۸۹'

export function toLatinDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
}

export function toPersianDigits(s: string | number): string {
  return String(s).replace(/\d/g, (d) => FA[Number(d)]!)
}

/** استخراج کلید تاریخ YYYY/MM/DD از رشته‌های شمسی mock */
export function extractDateKey(at: string): string {
  const latin = toLatinDigits(at)
  const m = latin.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (!m) return ''
  const y = m[1]!
  const mo = m[2]!.padStart(2, '0')
  const d = m[3]!.padStart(2, '0')
  return `${y}/${mo}/${d}`
}

function daysInPersianMonth(month: number): number {
  if (month <= 6) return 31
  if (month <= 11) return 30
  return 29
}

/** offset=0 → امروز دمو؛ منفی = روزهای قبل */
export function mockPersianDateFromOffset(dayOffset: number): string {
  let y = 1404
  let m = 12
  let d = 22 + dayOffset
  while (d < 1) {
    m -= 1
    if (m < 1) {
      m = 12
      y -= 1
    }
    d += daysInPersianMonth(m)
  }
  while (d > daysInPersianMonth(m)) {
    d -= daysInPersianMonth(m)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return `${toPersianDigits(y)}/${toPersianDigits(String(m).padStart(2, '0'))}/${toPersianDigits(String(d).padStart(2, '0'))}`
}

export function defaultReportDateFilter(preset: DatePreset = '30d'): ReportDateFilter {
  return {
    preset,
    from: mockPersianDateFromOffset(-29),
    to: MOCK_REPORT_TODAY,
  }
}

/** حداقل dayOffset قابل قبول برای پیش‌فرض (۰ = امروز) */
export function minDayOffsetForPreset(preset: DatePreset): number {
  switch (preset) {
    case 'today':
      return 0
    case '7d':
      return -6
    case '30d':
      return -29
    case 'custom':
      return Number.NEGATIVE_INFINITY
  }
}

export function isDayOffsetInFilter(
  dayOffset: number,
  filter: ReportDateFilter,
): boolean {
  if (filter.preset !== 'custom') {
    return dayOffset >= minDayOffsetForPreset(filter.preset) && dayOffset <= 0
  }
  const key = extractDateKey(mockPersianDateFromOffset(dayOffset))
  const fromKey = extractDateKey(filter.from)
  const toKey = extractDateKey(filter.to)
  if (fromKey && key < fromKey) return false
  if (toKey && key > toKey) return false
  return true
}

/** فیلتر ردیف‌هایی که فقط `at` شمسی دارند (بدون dayOffset) */
export function isAtInDateFilter(at: string, filter: ReportDateFilter): boolean {
  const key = extractDateKey(at)
  if (!key) return true

  if (filter.preset === 'custom') {
    const fromKey = extractDateKey(filter.from)
    const toKey = extractDateKey(filter.to)
    if (fromKey && key < fromKey) return false
    if (toKey && key > toKey) return false
    return true
  }

  const todayKey = extractDateKey(MOCK_REPORT_TODAY)
  const minOff = minDayOffsetForPreset(filter.preset)
  const minKey = extractDateKey(mockPersianDateFromOffset(minOff))
  if (key > todayKey) return false
  if (key < minKey) return false
  return true
}

export function periodLabelForFilter(filter: ReportDateFilter): string {
  switch (filter.preset) {
    case 'today':
      return `امروز (${MOCK_REPORT_TODAY})`
    case '7d':
      return '۷ روز اخیر'
    case '30d':
      return '۳۰ روز اخیر'
    case 'custom':
      return `از ${filter.from || '—'} تا ${filter.to || '—'}`
  }
}
