/**
 * گزارش مصرف توکن per سرویس / per نمونه — mock UI
 * کوئری‌ساز: تفکیک binding داخلی / خارجی (§۱۳) — صورتحساب داخلی OPEN (O7)
 */

import {
  mockPersianDateFromOffset,
  type BindingFilter,
  type ReportDateFilter,
  isDayOffsetInFilter,
  periodLabelForFilter,
} from '../lib/reportFilters'

export type ModelBindingKind = 'internal' | 'external'

export type TokenUsageDailyRow = {
  id: string
  at: string
  /** ۰ = امروز دمو؛ منفی = روزهای قبل — برای فیلتر بازه */
  dayOffset: number
  /** درخواست‌های موفق در آن روز (شمارنده ظرفیت؛ Meter قیمت نیست) */
  requests: number
  tokensInternal: number
  tokensExternal: number
  /** برآورد سهم Base فقط روی توکن‌هایی که مسیر Wallet دارند (دمو: خارجی) */
  baseIrrApprox: number
}

export type TokenUsageByModelRow = {
  modelId: string
  modelName: string
  tokensInternal: number
  tokensExternal: number
  requests: number
}

export type ServiceTokenUsageReport = {
  serviceId: string
  serviceName: string
  periodLabel: string
  /** جمع توکن ماه (داخلی + خارجی) — Meter قیمت همچنان AI.Token */
  tokensTotal: number
  tokensInternal: number
  tokensExternal: number
  requestsMonth: number
  baseIrrApprox: number
  dualModel: boolean
  daily: TokenUsageDailyRow[]
  byModel: TokenUsageByModelRow[]
  /** یادداشت محصول برای O7 */
  billingNote: string
}

function buildDailySeries(
  days: number,
  scale: { req: number; tin: number; tex: number; base: number },
): TokenUsageDailyRow[] {
  const rows: TokenUsageDailyRow[] = []
  for (let off = -(days - 1); off <= 0; off++) {
    const wave = 0.75 + ((off + days) % 5) * 0.08
    const weekendDip = Math.abs(off) % 7 === 0 ? 0.7 : 1
    const f = wave * weekendDip
    rows.push({
      id: `d${off}`,
      at: mockPersianDateFromOffset(off),
      dayOffset: off,
      requests: Math.max(1, Math.round(scale.req * f)),
      tokensInternal: Math.round(scale.tin * f),
      tokensExternal: Math.round(scale.tex * f),
      baseIrrApprox: Math.round(scale.base * f),
    })
  }
  return rows
}

const RB_DAILY = buildDailySeries(30, {
  req: 52,
  tin: 240_000,
  tex: 380_000,
  base: 3_230_000,
})

const RB_BY_MODEL: TokenUsageByModelRow[] = [
  {
    modelId: 'mdl-behsaz-rb',
    modelName: 'کوئری‌ساز نمونه پارس',
    tokensInternal: 4_800_000,
    tokensExternal: 7_600_000,
    requests: 268,
  },
  {
    modelId: 'mdl-hesab-rb',
    modelName: 'کوئری‌ساز حساب‌یار',
    tokensInternal: 2_320_000,
    tokensExternal: 3_920_000,
    requests: 144,
  },
]

function sumDaily(daily: TokenUsageDailyRow[]) {
  return daily.reduce(
    (acc, d) => ({
      requests: acc.requests + d.requests,
      tin: acc.tin + d.tokensInternal,
      tex: acc.tex + d.tokensExternal,
      base: acc.base + d.baseIrrApprox,
    }),
    { requests: 0, tin: 0, tex: 0, base: 0 },
  )
}

const rbTotals = sumDaily(RB_DAILY)

const REPORT_BUILDER_USAGE: ServiceTokenUsageReport = {
  serviceId: 'svc-report',
  serviceName: 'کوئری‌ساز',
  periodLabel: '۳۰ روز اخیر (دمو)',
  tokensTotal: rbTotals.tin + rbTotals.tex,
  tokensInternal: rbTotals.tin,
  tokensExternal: rbTotals.tex,
  requestsMonth: rbTotals.requests,
  baseIrrApprox: rbTotals.base,
  dualModel: true,
  billingNote:
    'تفکیک داخلی/خارجی برای حسابرسی و عملیات است. Meter قیمت فقط توکن است. صورتحساب توکن مدل داخلی نسبت به کیف پول مصرف‌کننده هنوز باز است (O7) — در این دمو شارژ کیف برای داخلی نشان داده نمی‌شود.',
  daily: RB_DAILY,
  byModel: RB_BY_MODEL,
}

const GENERIC_DAILY = buildDailySeries(30, {
  req: 12,
  tin: 0,
  tex: 42_000,
  base: 357_000,
})

/** گزارش سطح پلتفرم به ازای شناسه سرویس */
export function getPlatformServiceTokenUsage(
  serviceId: string,
  serviceName: string,
): ServiceTokenUsageReport {
  if (serviceId === 'svc-report' || /کوئری[\u200c\s-]*ساز/.test(serviceName)) {
    return { ...REPORT_BUILDER_USAGE, serviceId, serviceName }
  }
  const t = sumDaily(GENERIC_DAILY)
  return {
    serviceId,
    serviceName,
    periodLabel: '۳۰ روز اخیر (دمو)',
    tokensTotal: t.tex,
    tokensInternal: 0,
    tokensExternal: t.tex,
    requestsMonth: t.requests,
    baseIrrApprox: t.base,
    dualModel: false,
    billingNote: 'این سرویس در دمو تفکیک مدل داخلی/خارجی ندارد — فقط جمع مصرف متر اعلام‌شده.',
    daily: GENERIC_DAILY.map((d) => ({ ...d, id: `${serviceId}-${d.id}` })),
    byModel: [
      {
        modelId: 'mdl-generic',
        modelName: `مدل نمونه · ${serviceName}`,
        tokensInternal: 0,
        tokensExternal: t.tex,
        requests: t.requests,
      },
    ],
  }
}

/** گزارش سطح نمونه مدل‌ساز — فقط مدل‌های همان نمونه */
export function getCreatorInstanceTokenUsage(
  instanceId: string,
  serviceName: string,
): ServiceTokenUsageReport {
  const isRb = /کوئری[\u200c\s-]*ساز/.test(serviceName)
  if (isRb) {
    const models =
      instanceId === 'inst-02'
        ? [REPORT_BUILDER_USAGE.byModel[1]!]
        : [REPORT_BUILDER_USAGE.byModel[0]!]
    const factor = instanceId === 'inst-02' ? 0.34 : 0.66
    const daily = REPORT_BUILDER_USAGE.daily.map((d) => ({
      ...d,
      id: `${instanceId}-${d.id}`,
      requests: Math.max(1, Math.round(d.requests * factor)),
      tokensInternal: Math.round(d.tokensInternal * factor),
      tokensExternal: Math.round(d.tokensExternal * factor),
      baseIrrApprox: Math.round(d.baseIrrApprox * factor),
    }))
    const t = sumDaily(daily)
    return {
      serviceId: 'svc-report',
      serviceName,
      periodLabel: '۳۰ روز اخیر · همین نمونه (دمو)',
      tokensTotal: t.tin + t.tex,
      tokensInternal: t.tin,
      tokensExternal: t.tex,
      requestsMonth: t.requests,
      baseIrrApprox: t.base,
      dualModel: true,
      billingNote: REPORT_BUILDER_USAGE.billingNote,
      daily,
      byModel: models.map((m) => ({
        ...m,
        tokensInternal: Math.round(m.tokensInternal * (factor / 0.5) * 0.5),
        tokensExternal: Math.round(m.tokensExternal * (factor / 0.5) * 0.5),
        requests: Math.round(m.requests * factor),
      })),
    }
  }
  const daily = GENERIC_DAILY.map((d) => ({
    ...d,
    id: `${instanceId}-${d.id}`,
    requests: Math.max(1, Math.round(d.requests * 0.4)),
    tokensExternal: Math.round(d.tokensExternal * 0.4),
    baseIrrApprox: Math.round(d.baseIrrApprox * 0.4),
  }))
  const t = sumDaily(daily)
  return {
    serviceId: `inst-${instanceId}`,
    serviceName,
    periodLabel: '۳۰ روز اخیر · همین نمونه (دمو)',
    tokensTotal: t.tex,
    tokensInternal: 0,
    tokensExternal: t.tex,
    requestsMonth: t.requests,
    baseIrrApprox: t.base,
    dualModel: false,
    billingNote: 'مصرف همین نمونه پلن — جدا از نمونه‌های دیگر.',
    daily,
    byModel: [
      {
        modelId: `mdl-${instanceId}`,
        modelName: `مدل روی نمونه`,
        tokensInternal: 0,
        tokensExternal: t.tex,
        requests: t.requests,
      },
    ],
  }
}

export function bindingLabel(kind: ModelBindingKind): string {
  return kind === 'internal' ? 'مدل داخلی (منابع پلتفرم نمونه)' : 'مدل خارجی (مثل OpenAI)'
}

export type TokenUsageViewFilter = {
  date: ReportDateFilter
  binding: BindingFilter
  modelQuery: string
}

/** اعمال فیلتر روی گزارش — totals و جداول هم‌راستا با فیلتر فعال */
export function applyTokenUsageFilters(
  report: ServiceTokenUsageReport,
  filter: TokenUsageViewFilter,
): ServiceTokenUsageReport {
  const dailyRaw = report.daily.filter((d) => isDayOffsetInFilter(d.dayOffset, filter.date))

  const daily = dailyRaw.map((d) => {
    if (filter.binding === 'internal') {
      return {
        ...d,
        tokensExternal: 0,
        baseIrrApprox: 0,
      }
    }
    if (filter.binding === 'external') {
      return {
        ...d,
        tokensInternal: 0,
      }
    }
    return d
  })

  const t = sumDaily(daily)
  const q = filter.modelQuery.trim()

  let byModel = report.byModel
    .map((m) => {
      if (filter.binding === 'internal') {
        return { ...m, tokensExternal: 0 }
      }
      if (filter.binding === 'external') {
        return { ...m, tokensInternal: 0 }
      }
      return m
    })
    .filter((m) => {
      if (q && !m.modelName.includes(q)) return false
      if (filter.binding === 'internal' && m.tokensInternal <= 0) return false
      if (filter.binding === 'external' && m.tokensExternal <= 0) return false
      return true
    })

  /* مقیاس تقریبی byModel نسبت به سهم بازه از کل روزانهٔ خام */
  const full = sumDaily(report.daily)
  const ratio =
    full.tin + full.tex > 0 ? (t.tin + t.tex) / (full.tin + full.tex) : 1
  byModel = byModel.map((m) => ({
    ...m,
    tokensInternal: Math.round(m.tokensInternal * ratio),
    tokensExternal: Math.round(m.tokensExternal * ratio),
    requests: Math.max(0, Math.round(m.requests * ratio)),
  }))

  return {
    ...report,
    periodLabel: periodLabelForFilter(filter.date),
    tokensTotal: t.tin + t.tex,
    tokensInternal: t.tin,
    tokensExternal: t.tex,
    requestsMonth: t.requests,
    baseIrrApprox: t.base,
    daily,
    byModel,
  }
}
