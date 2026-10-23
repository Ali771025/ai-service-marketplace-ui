/**
 * ابعاد ظرفیت پلن کوئری‌ساز — هم‌تراز با
 * PORTFOLIO-Architecture/12-Services/Report-Builder/Capacity-Plan-Params.md
 *
 * هیچ بُعدی الزام سراسری MVP نیست؛ هر کدام می‌تواند «نامحدود / بدون سقف»
 * یا «مقدار محدود عددی» باشد (Confirmed-Decisions §۵).
 * pathSlug / جداسازی Instance سطح نمونه است، نه فیلد قیمت پلن.
 * پلن پشتیبانی و Markup اینجا نیست (ADR-011).
 */

export const REPORT_BUILDER_SERVICE_ID = 'svc-report'
export const REPORT_BUILDER_PLATFORM_DEFAULTS = {
  maxConcurrentPerIdentity: 3,
  maxActiveApiKeysPerModel: 20,
} as const

/** بُعد عددی یا نامحدود */
export type NumericCapacityDim =
  | { mode: 'unlimited' }
  | { mode: 'limited'; value: number }

/** SLA می‌تواند متن زمان‌دار باشد یا نامحدود */
export type SlaCapacityDim =
  | { mode: 'unlimited' }
  | { mode: 'text'; value: string }

/**
 * شارژ اولیه کیف پول روی پلن — اختیاری:
 * none = بدون شارژ · limited = مبلغ ریالی
 */
export type WalletCreditDim =
  | { mode: 'none' }
  | { mode: 'limited'; value: number }

export type ReportBuilderServicePlanCapacity = {
  sla: SlaCapacityDim
  knowledgeVersionCap: NumericCapacityDim
  databaseProductCap: NumericCapacityDim
  /** سقف شمارنده Request ماهانه (بُعد ظرفیت؛ Meter قیمت نیست) */
  monthlyInvokes: NumericCapacityDim
  rpm: NumericCapacityDim
  knowledgeStorageGb: NumericCapacityDim
  initialWalletCredit: WalletCreditDim
  /** هم‌زمانی per هویت — نامحدود یا عدد (پیش‌فرض پلتفرم در صورت محدودیت نمونه: ۳) */
  maxConcurrentPerIdentity: NumericCapacityDim
  /** سقف کلید فعال per مدل per هویت — نامحدود یا عدد (پیش‌فرض نمونه: ۲۰) */
  maxActiveApiKeysPerModel: NumericCapacityDim
}

export function isReportBuilderService(
  serviceId: string,
  serviceName?: string,
): boolean {
  if (serviceId === REPORT_BUILDER_SERVICE_ID) return true
  return Boolean(
    serviceName &&
      (/کوئری[\u200c\s-]*ساز/.test(serviceName) ||
        /گزارش[\u200c\s-]*ساز/.test(serviceName)),
  )
}

export function emptyReportBuilderCapacity(): ReportBuilderServicePlanCapacity {
  return {
    sla: { mode: 'unlimited' },
    knowledgeVersionCap: { mode: 'unlimited' },
    databaseProductCap: { mode: 'unlimited' },
    monthlyInvokes: { mode: 'unlimited' },
    rpm: { mode: 'unlimited' },
    knowledgeStorageGb: { mode: 'unlimited' },
    initialWalletCredit: { mode: 'none' },
    maxConcurrentPerIdentity: { mode: 'unlimited' },
    maxActiveApiKeysPerModel: { mode: 'unlimited' },
  }
}

function asNumeric(raw: unknown, fallbackLimited?: number): NumericCapacityDim {
  if (raw && typeof raw === 'object' && 'mode' in raw) {
    const m = raw as { mode: string; value?: number }
    if (m.mode === 'unlimited') return { mode: 'unlimited' }
    if (m.mode === 'limited' && typeof m.value === 'number') {
      return { mode: 'limited', value: m.value }
    }
  }
  if (typeof raw === 'number') return { mode: 'limited', value: raw }
  if (raw === null && fallbackLimited != null) {
    return { mode: 'limited', value: fallbackLimited }
  }
  return { mode: 'unlimited' }
}

function asWallet(raw: unknown, legacyIrr?: unknown): WalletCreditDim {
  if (raw && typeof raw === 'object' && 'mode' in raw) {
    const m = raw as { mode: string; value?: number }
    if (m.mode === 'none' || m.mode === 'unlimited') return { mode: 'none' }
    if (m.mode === 'limited' && typeof m.value === 'number') {
      return m.value > 0 ? { mode: 'limited', value: m.value } : { mode: 'none' }
    }
  }
  const n = typeof legacyIrr === 'number' ? legacyIrr : typeof raw === 'number' ? raw : 0
  return n > 0 ? { mode: 'limited', value: n } : { mode: 'none' }
}

/** نرمال‌سازی دادهٔ قدیمی (number|null / initialWalletCreditIrr) برای persist */
export function normalizeReportBuilderCapacity(
  raw: Partial<ReportBuilderServicePlanCapacity> & {
    initialWalletCreditIrr?: number
  },
): ReportBuilderServicePlanCapacity {
  const empty = emptyReportBuilderCapacity()
  return {
    sla:
      raw.sla && typeof raw.sla === 'object' && 'mode' in raw.sla
        ? raw.sla
        : empty.sla,
    knowledgeVersionCap: asNumeric(raw.knowledgeVersionCap),
    databaseProductCap: asNumeric(raw.databaseProductCap),
    monthlyInvokes: asNumeric(raw.monthlyInvokes),
    rpm: asNumeric(raw.rpm),
    knowledgeStorageGb: asNumeric(raw.knowledgeStorageGb),
    initialWalletCredit: asWallet(raw.initialWalletCredit, raw.initialWalletCreditIrr),
    maxConcurrentPerIdentity: asNumeric(
      raw.maxConcurrentPerIdentity,
      REPORT_BUILDER_PLATFORM_DEFAULTS.maxConcurrentPerIdentity,
    ),
    maxActiveApiKeysPerModel: asNumeric(
      raw.maxActiveApiKeysPerModel,
      REPORT_BUILDER_PLATFORM_DEFAULTS.maxActiveApiKeysPerModel,
    ),
  }
}

function formatNumeric(dim: NumericCapacityDim, unitSuffix: string): string {
  if (dim.mode === 'unlimited') return `نامحدود${unitSuffix ? ` (${unitSuffix})` : ''}`
  return `${dim.value.toLocaleString('fa-IR')}${unitSuffix ? ` ${unitSuffix}` : ''}`
}

export function formatReportBuilderCapacitySummary(
  cap: ReportBuilderServicePlanCapacity,
): string {
  const c = normalizeReportBuilderCapacity(cap)
  const parts: string[] = []

  if (c.sla.mode === 'unlimited') parts.push('توافق سطح خدمت: نامحدود')
  else if (c.sla.value.trim()) parts.push(`توافق سطح خدمت: ${c.sla.value.trim()}`)

  parts.push(`نسخه دانش: ${formatNumeric(c.knowledgeVersionCap, '')}`)
  parts.push(`دیتابیس/محصول: ${formatNumeric(c.databaseProductCap, '')}`)
  parts.push(`سقف شمارنده درخواست: ${formatNumeric(c.monthlyInvokes, 'درخواست')}`)
  parts.push(`نرخ در دقیقه: ${formatNumeric(c.rpm, '')}`)
  parts.push(`فضای دانش: ${formatNumeric(c.knowledgeStorageGb, 'گیگابایت')}`)

  if (c.initialWalletCredit.mode === 'none') {
    parts.push('شارژ اولیه کیف پول: بدون شارژ')
  } else {
    parts.push(
      `شارژ اولیه کیف پول: ${c.initialWalletCredit.value.toLocaleString('fa-IR')} ریال`,
    )
  }

  parts.push(`هم‌زمانی: ${formatNumeric(c.maxConcurrentPerIdentity, '')}`)
  parts.push(`کلید فعال: ${formatNumeric(c.maxActiveApiKeysPerModel, '')}`)

  return parts.join(' · ')
}
