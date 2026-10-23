/**
 * داشبورد نزدیک‌به‌سقف (#۱۰) — فاصلهٔ ایستا تا سقف‌های ثابت.
 * متمایز از SHORT_TERM_CAPACITY (#۸ سری زمانی) و بنرهای هشدار بودجه (#۹).
 * مرجع: Report-Builder Confirmed §۱۱ · Consumer-Surface
 */

import { REPORT_BUILDER_PLATFORM_DEFAULTS } from './reportBuilderPlanCapacity'
import { keysForModelOrFallback, type ConsumerApiKeyRow } from './consumerApiKeys'

export type HeadroomTone = 'ok' | 'warn' | 'danger' | 'muted'

export type HeadroomMeter = {
  id: string
  label: string
  /** مقدار مصرف‌شده / اشغال‌شده */
  used: number
  /** null = نامحدود */
  cap: number | null
  unit: string
  hint?: string
}

export type ModelHeadroomSnapshot = {
  modelId: string
  modelName: string
  /** هم‌زمانی هویت خریدار — سقف ثابت ۳ */
  concurrency: HeadroomMeter
  /** کلید فعال — سقف ثابت ۲۰ */
  apiKeys: HeadroomMeter
  /** ابعاد ظرفیت پلن (فقط محدودها در UI برجسته‌اند) */
  planDims: HeadroomMeter[]
  /** بودجه کلی per کلید — میلهٔ فاصله؛ جایگزین بنر #۹ نیست */
  keyBudgets: HeadroomMeter[]
}

export type InstanceHeadroomStrip = {
  instanceId: string
  planName: string
  meters: HeadroomMeter[]
}

export function headroomPct(used: number, cap: number | null): number | null {
  if (cap == null || cap <= 0) return null
  return Math.min(100, Math.round((used / cap) * 1000) / 10)
}

export function headroomTone(used: number, cap: number | null): HeadroomTone {
  const pct = headroomPct(used, cap)
  if (pct == null) return 'muted'
  if (pct >= 100) return 'danger'
  if (pct >= 85) return 'warn'
  if (pct >= 70) return 'warn'
  return 'ok'
}

function keyBudgetMeters(keys: ConsumerApiKeyRow[]): HeadroomMeter[] {
  return keys
    .filter((k) => k.status === 'active')
    .map((k) => ({
      id: `budget-${k.id}`,
      label: k.label,
      used: k.spentIrr,
      cap: k.overallBudgetCapIrr,
      unit: 'ریال',
      hint:
        k.overallBudgetCapIrr == null
          ? 'بدون سقف کلید'
          : k.spentIrr >= k.overallBudgetCapIrr
            ? 'پر — متوقف'
            : 'سقف کلی تجمعی',
    }))
}

/** snapshot mock per مدل مصرف‌کننده */
export const MODEL_HEADROOM: Record<string, Omit<ModelHeadroomSnapshot, 'keyBudgets'>> = {
  'mdl-behsaz-rb': {
    modelId: 'mdl-behsaz-rb',
    modelName: 'کوئری‌ساز نمونه پارس',
    concurrency: {
      id: 'concurrency',
      label: 'هم‌زمانی هویت',
      used: 2,
      cap: REPORT_BUILDER_PLATFORM_DEFAULTS.maxConcurrentPerIdentity,
      unit: 'درخواست',
      hint: 'صف به ازای هویت خریدار',
    },
    apiKeys: {
      id: 'api-keys',
      label: 'کلید فعال',
      used: 3,
      cap: REPORT_BUILDER_PLATFORM_DEFAULTS.maxActiveApiKeysPerModel,
      unit: 'کلید',
      hint: 'سقف ۲۰ به ازای مدل',
    },
    planDims: [
      {
        id: 'knowledge-versions',
        label: 'نسخه دانش',
        used: 3,
        cap: 5,
        unit: 'نسخه',
        hint: 'پلن نقره‌ای',
      },
      {
        id: 'monthly-invokes',
        label: 'فراخوانی ماهانه',
        used: 412,
        cap: 1000,
        unit: 'درخواست',
      },
      {
        id: 'rpm',
        label: 'نرخ در دقیقه',
        used: 18,
        cap: 30,
        unit: 'در دقیقه',
        hint: 'اوج فعلی',
      },
      {
        id: 'knowledge-gb',
        label: 'فضای دانش',
        used: 1.2,
        cap: 2,
        unit: 'گیگابایت',
      },
    ],
  },
  'mdl-hesab-rb': {
    modelId: 'mdl-hesab-rb',
    modelName: 'کوئری‌ساز حساب‌یار',
    concurrency: {
      id: 'concurrency',
      label: 'هم‌زمانی هویت',
      used: 1,
      cap: REPORT_BUILDER_PLATFORM_DEFAULTS.maxConcurrentPerIdentity,
      unit: 'درخواست',
    },
    apiKeys: {
      id: 'api-keys',
      label: 'کلید فعال',
      used: 1,
      cap: REPORT_BUILDER_PLATFORM_DEFAULTS.maxActiveApiKeysPerModel,
      unit: 'کلید',
    },
    planDims: [
      {
        id: 'knowledge-versions',
        label: 'نسخه دانش',
        used: 2,
        cap: 5,
        unit: 'نسخه',
      },
      {
        id: 'monthly-invokes',
        label: 'فراخوانی ماهانه',
        used: 180,
        cap: 1000,
        unit: 'درخواست',
      },
      {
        id: 'rpm',
        label: 'نرخ در دقیقه',
        used: 8,
        cap: 30,
        unit: 'در دقیقه',
      },
      {
        id: 'knowledge-gb',
        label: 'فضای دانش',
        used: 0.6,
        cap: 2,
        unit: 'گیگابایت',
      },
    ],
  },
  default: {
    modelId: 'default',
    modelName: 'مدل',
    concurrency: {
      id: 'concurrency',
      label: 'هم‌زمانی هویت',
      used: 0,
      cap: REPORT_BUILDER_PLATFORM_DEFAULTS.maxConcurrentPerIdentity,
      unit: 'درخواست',
    },
    apiKeys: {
      id: 'api-keys',
      label: 'کلید فعال',
      used: 1,
      cap: REPORT_BUILDER_PLATFORM_DEFAULTS.maxActiveApiKeysPerModel,
      unit: 'کلید',
    },
    planDims: [
      {
        id: 'monthly-invokes',
        label: 'فراخوانی ماهانه',
        used: 40,
        cap: 1000,
        unit: 'درخواست',
      },
    ],
  },
}

export function getModelHeadroom(
  modelId: string,
  maskedSecretFallback = 'portfolio_live_••••••••',
): ModelHeadroomSnapshot {
  const base = MODEL_HEADROOM[modelId] ?? {
    ...MODEL_HEADROOM.default,
    modelId,
  }
  const keys = keysForModelOrFallback(modelId, maskedSecretFallback)
  const active = keys.filter((k) => k.status === 'active').length
  return {
    ...base,
    apiKeys: {
      ...base.apiKeys,
      used: Math.max(base.apiKeys.used, active),
    },
    keyBudgets: keyBudgetMeters(keys),
  }
}

/** نوار سبک سازنده روی خانهٔ Instance */
export const INSTANCE_HEADROOM_STRIP: Record<string, InstanceHeadroomStrip> = {
  'inst-01': {
    instanceId: 'inst-01',
    planName: 'پلن نقره‌ای',
    meters: [
      { id: 'kv', label: 'نسخه دانش', used: 3, cap: 5, unit: '' },
      { id: 'inv', label: 'فراخوانی ماه', used: 412, cap: 1000, unit: '' },
      { id: 'rpm', label: 'نرخ در دقیقه', used: 18, cap: 30, unit: '' },
      { id: 'gb', label: 'دانش', used: 1.2, cap: 2, unit: 'GB' },
    ],
  },
  'inst-02': {
    instanceId: 'inst-02',
    planName: 'پلن نقره‌ای',
    meters: [
      { id: 'kv', label: 'نسخه دانش', used: 2, cap: 5, unit: '' },
      { id: 'inv', label: 'فراخوانی ماه', used: 180, cap: 1000, unit: '' },
      { id: 'rpm', label: 'نرخ در دقیقه', used: 8, cap: 30, unit: '' },
    ],
  },
  'inst-03': {
    instanceId: 'inst-03',
    planName: 'پلن طلایی',
    meters: [
      { id: 'db', label: 'دیتابیس', used: 2, cap: 5, unit: '' },
      { id: 'inv', label: 'فراخوانی ماه', used: 920, cap: 5000, unit: '' },
      { id: 'rpm', label: 'نرخ در دقیقه', used: 40, cap: 120, unit: '' },
      { id: 'kv', label: 'نسخه دانش', used: 8, cap: null, unit: '', hint: 'نامحدود' },
    ],
  },
}

export function getInstanceHeadroomStrip(instanceId: string): InstanceHeadroomStrip | null {
  return INSTANCE_HEADROOM_STRIP[instanceId] ?? null
}

/** فشرده‌ترین «نزدیک‌ترین به سقف» برای ویجت هاب */
export function worstHeadroomMeter(snapshot: ModelHeadroomSnapshot): HeadroomMeter | null {
  const all = [
    snapshot.concurrency,
    snapshot.apiKeys,
    ...snapshot.planDims,
    ...snapshot.keyBudgets.filter((m) => m.cap != null),
  ]
  let worst: HeadroomMeter | null = null
  let worstPct = -1
  for (const m of all) {
    const pct = headroomPct(m.used, m.cap)
    if (pct != null && pct > worstPct) {
      worstPct = pct
      worst = m
    }
  }
  return worst
}
