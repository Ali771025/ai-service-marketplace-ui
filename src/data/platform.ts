import type { ReportBuilderServicePlanCapacity } from './reportBuilderPlanCapacity'
import { formatReportBuilderCapacitySummary } from './reportBuilderPlanCapacity'

export type { ReportBuilderServicePlanCapacity }

/** Meterهای قابل اعلام در کاتالوگ سرویس (دمو) */
export const PLATFORM_METER_OPTIONS = [
  { key: 'AI.Token', label: 'توکن' },
  { key: 'Request', label: 'درخواست' },
  { key: 'Page', label: 'صفحه' },
  { key: 'Document', label: 'سند' },
  { key: 'Image', label: 'تصویر' },
  { key: 'Second', label: 'ثانیه' },
] as const

export type PlatformService = {
  id: string
  name: string
  status: 'published' | 'draft' | 'suspended'
  planCount: number
  updatedAt: string
  description: string
  /**
   * Meterهای اعلام‌شدهٔ سرویس.
   * آرایه خالی = «بدون Meter مصرف» (سرویس خودش تصمیم می‌گیرد؛ شارژ مصرفی Base ندارد).
   */
  meters: string[]
  /** Base IRR به ازای واحد هر Meter — فقط برای Meterهای انتخاب‌شدهٔ قیمت‌پذیر */
  baseByMeterIrr: Record<string, number>
  /**
   * نمایش فهرست / سازگاری — برابر Base اولین Meter قیمت‌پذیر، یا ۰ اگر بدون Meter مصرف.
   * ≠ قیمت خرید Service Plan.
   */
  basePriceIrr: number
}

/** Base نمایشی از پیکربندی Meter */
export function primaryServiceBaseIrr(
  meters: string[],
  baseByMeterIrr: Record<string, number>,
): number {
  if (meters.length === 0) return 0
  for (const m of meters) {
    const v = baseByMeterIrr[m]
    if (v != null && v > 0) return v
  }
  return baseByMeterIrr[meters[0]!] ?? 0
}

export type PlatformServicePlan = {
  id: string
  serviceId: string
  serviceName: string
  name: string
  priceIrr: number
  status: 'active' | 'inactive'
  capacitySummary: string
  /** فقط کوئری‌ساز — ابعاد Capacity-Plan-Params (اختیاری / قابل نامحدود) */
  reportBuilderCapacity?: ReportBuilderServicePlanCapacity
}

export type SupportFrameworkField = {
  id: string
  label: string
  requiredPerService: boolean
  note: string
}

export type PayoutRule = {
  serviceId: string
  serviceName: string
  minAmountIrr: number
  minDays: number
}

export type PlatformOrder = {
  id: string
  at: string
  buyer: string
  planName: string
  amountIrr: number
  paymentStatus: 'paid' | 'failed' | 'pending'
}

export type AuditEvent = {
  id: string
  at: string
  actor: string
  action: string
  entity: string
  correlationId: string
  category: 'financial' | 'catalog' | 'identity'
}

export const PLATFORM_DASHBOARD = {
  baseRevenueMonthIrr: 42_800_000,
  planSalesCount: 17,
  planSalesAmountIrr: 256_000_000,
  failedPayments: 2,
  openDebts: 3,
  activeModels: 48,
  activeInstances: 61,
}

export const PLATFORM_SERVICES: PlatformService[] = [
  {
    id: 'svc-report',
    name: 'کوئری‌ساز',
    status: 'published',
    planCount: 3,
    updatedAt: '۱۴۰۴/۰۶/۱۲',
    description: 'سرویس تولید کوئری گزارش از روی نسخه‌های دانش و کلید دسترسی.',
    /** فقط Meter قیمت؛ Request سقف شمارنده روی پلن است نه Base */
    meters: ['AI.Token'],
    baseByMeterIrr: { 'AI.Token': 8_500 },
    basePriceIrr: 8_500,
  },
  {
    id: 'svc-doc',
    name: 'تحلیل اسناد',
    status: 'published',
    planCount: 1,
    updatedAt: '۱۴۰۴/۰۵/۲۸',
    description:
      'استخراج و خلاصه‌سازی اسناد سازمانی — بدون متر مصرف؛ درآمد از خرید پلن ظرفیت است نه قیمت پایه مصرف.',
    meters: [],
    baseByMeterIrr: {},
    basePriceIrr: 0,
  },
  {
    id: 'svc-chat',
    name: 'چت سازمانی',
    status: 'draft',
    planCount: 0,
    updatedAt: '۱۴۰۴/۰۶/۲۰',
    description: 'پیش‌نویس سرویس گفتگوی سازمانی — صورتحساب مصرف فقط بر اساس درخواست.',
    meters: ['Request'],
    baseByMeterIrr: { Request: 12_000 },
    basePriceIrr: 12_000,
  },
  {
    id: 'svc-vision',
    name: 'بینایی صنعتی',
    status: 'suspended',
    planCount: 1,
    updatedAt: '۱۴۰۴/۰۴/۰۱',
    description: 'تعلیق موقت به‌دلیل تغییر قرارداد ارائه‌دهنده.',
    meters: ['Image', 'Second'],
    baseByMeterIrr: { Image: 95_000, Second: 1_500 },
    basePriceIrr: 95_000,
  },
]

const REPORT_SILVER_CAPACITY: ReportBuilderServicePlanCapacity = {
  sla: { mode: 'text', value: 'پاسخ تا ۸ ساعت کاری' },
  knowledgeVersionCap: { mode: 'limited', value: 5 },
  databaseProductCap: { mode: 'limited', value: 1 },
  monthlyInvokes: { mode: 'limited', value: 1000 },
  rpm: { mode: 'limited', value: 30 },
  knowledgeStorageGb: { mode: 'limited', value: 2 },
  initialWalletCredit: { mode: 'limited', value: 500_000 },
  maxConcurrentPerIdentity: { mode: 'limited', value: 3 },
  maxActiveApiKeysPerModel: { mode: 'limited', value: 20 },
}

const REPORT_GOLDEN_CAPACITY: ReportBuilderServicePlanCapacity = {
  sla: { mode: 'text', value: 'پاسخ تا ۲ ساعت کاری' },
  knowledgeVersionCap: { mode: 'unlimited' },
  databaseProductCap: { mode: 'limited', value: 5 },
  monthlyInvokes: { mode: 'limited', value: 5000 },
  rpm: { mode: 'limited', value: 120 },
  knowledgeStorageGb: { mode: 'unlimited' },
  initialWalletCredit: { mode: 'limited', value: 2_000_000 },
  maxConcurrentPerIdentity: { mode: 'limited', value: 3 },
  maxActiveApiKeysPerModel: { mode: 'limited', value: 20 },
}

/** نمونه پلن با همه ابعاد نامحدود — نشان‌دهنده اختیاری بودن Capacity-Plan-Params */
const REPORT_UNLIMITED_CAPACITY: ReportBuilderServicePlanCapacity = {
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

export const PLATFORM_SERVICE_PLANS: PlatformServicePlan[] = [
  {
    id: 'psp-1',
    serviceId: 'svc-report',
    serviceName: 'کوئری‌ساز',
    name: 'پلن نقره‌ای',
    priceIrr: 15_000_000,
    status: 'active',
    reportBuilderCapacity: REPORT_SILVER_CAPACITY,
    capacitySummary: formatReportBuilderCapacitySummary(REPORT_SILVER_CAPACITY),
  },
  {
    id: 'psp-2',
    serviceId: 'svc-report',
    serviceName: 'کوئری‌ساز',
    name: 'پلن طلایی',
    priceIrr: 42_000_000,
    status: 'active',
    reportBuilderCapacity: REPORT_GOLDEN_CAPACITY,
    capacitySummary: formatReportBuilderCapacitySummary(REPORT_GOLDEN_CAPACITY),
  },
  {
    id: 'psp-2b',
    serviceId: 'svc-report',
    serviceName: 'کوئری‌ساز',
    name: 'پلن نامحدود (نمایشی)',
    priceIrr: 75_000_000,
    status: 'active',
    reportBuilderCapacity: REPORT_UNLIMITED_CAPACITY,
    capacitySummary: formatReportBuilderCapacitySummary(REPORT_UNLIMITED_CAPACITY),
  },
  {
    id: 'psp-3',
    serviceId: 'svc-doc',
    serviceName: 'تحلیل اسناد',
    name: 'پلن پایه',
    priceIrr: 8_500_000,
    status: 'active',
    capacitySummary: '۵۰۰ سند/ماه',
  },
  {
    id: 'psp-4',
    serviceId: 'svc-vision',
    serviceName: 'بینایی صنعتی',
    name: 'پلن آزمایشی',
    priceIrr: 20_000_000,
    status: 'inactive',
    capacitySummary: '۱۰۰۰۰ تصویر/ماه',
  },
]

export const SUPPORT_FRAMEWORK = {
  pricingModels: ['per تیکت', 'ماهانه'],
  fields: [
    {
      id: 'f1',
      label: 'مدت اعتبار',
      requiredPerService: true,
      note: 'روز / تا بسته‌شدن تیکت',
    },
    {
      id: 'f2',
      label: 'زمان پاسخ (SLA)',
      requiredPerService: true,
      note: 'ساعت کاری',
    },
    {
      id: 'f3',
      label: 'سقف تیکت',
      requiredPerService: false,
      note: 'برای پلن ماهانه اختیاری',
    },
    {
      id: 'f4',
      label: 'کانال پشتیبانی',
      requiredPerService: true,
      note: 'تیکت داخل پلتفرم الزامی است',
    },
  ] as SupportFrameworkField[],
  creatorGuidance:
    'مدل‌ساز می‌تواند فیلدهای مشترک را تکمیل و per سرویس گسترش دهد. اگر هیچ پلنی نسازد، مصرف بدون پیش‌نیاز پشتیبانی مجاز است.',
}

export const PAYOUT_RULES: PayoutRule[] = [
  {
    serviceId: 'svc-report',
    serviceName: 'کوئری‌ساز',
    minAmountIrr: 5_000_000,
    minDays: 14,
  },
  {
    serviceId: 'svc-doc',
    serviceName: 'تحلیل اسناد',
    minAmountIrr: 3_000_000,
    minDays: 21,
  },
  {
    serviceId: 'svc-vision',
    serviceName: 'بینایی صنعتی',
    minAmountIrr: 10_000_000,
    minDays: 30,
  },
]

export const PLATFORM_ORDERS: PlatformOrder[] = [
  {
    id: 'ord-901',
    at: '۱۴۰۴/۰۶/۱۰',
    buyer: 'علی مدل‌ساز',
    planName: 'پلن طلایی کوئری‌ساز',
    amountIrr: 42_000_000,
    paymentStatus: 'paid',
  },
  {
    id: 'ord-902',
    at: '۱۴۰۴/۰۶/۰۸',
    buyer: 'استودیو داده پارس',
    planName: 'پلن نقره‌ای کوئری‌ساز',
    amountIrr: 15_000_000,
    paymentStatus: 'paid',
  },
  {
    id: 'ord-903',
    at: '۱۴۰۴/۰۶/۲۲',
    buyer: 'نوآوران ابری',
    planName: 'پلن پایه تحلیل اسناد',
    amountIrr: 8_500_000,
    paymentStatus: 'pending',
  },
  {
    id: 'ord-904',
    at: '۱۴۰۴/۰۶/۱۹',
    buyer: 'تیم ویژن',
    planName: 'پلن آزمایشی بینایی',
    amountIrr: 20_000_000,
    paymentStatus: 'failed',
  },
]

export const PLATFORM_REVENUE_BY_SERVICE = [
  {
    serviceName: 'کوئری‌ساز',
    baseIrr: 31_200_000,
    settlements: 412,
    /** آخرین فعالیت درآمدی در دمو */
    at: '۱۴۰۴/۱۲/۲۲',
  },
  {
    serviceName: 'تحلیل اسناد',
    baseIrr: 9_400_000,
    settlements: 188,
    at: '۱۴۰۴/۱۲/۲۰',
  },
  {
    serviceName: 'بینایی صنعتی',
    baseIrr: 2_200_000,
    settlements: 24,
    at: '۱۴۰۴/۱۲/۱۰',
  },
  {
    serviceName: 'چت سازمانی',
    baseIrr: 480_000,
    settlements: 12,
    at: '۱۴۰۴/۱۱/۲۸',
  },
]

export const PLATFORM_REPORTS = {
  usageRequestsMonth: 624,
  planSalesMonth: 17,
  walletTopUpsIrr: 128_000_000,
  openNegativeWallets: 3,
  activeInstances: 61,
  activeModels: 48,
}

export const AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'aud-1',
    at: '۱۴۰۴/۰۶/۲۲ ۱۴:۱۲',
    actor: 'سارا اپراتور',
    action: 'به‌روزرسانی قیمت پایه',
    entity: 'Service: کوئری‌ساز',
    correlationId: 'corr-a91f',
    category: 'catalog',
  },
  {
    id: 'aud-2',
    at: '۱۴۰۴/۰۶/۲۲ ۱۱:۰۵',
    actor: 'سیستم',
    action: 'تسویه قیمت پایه ثبت شد',
    entity: 'Ledger Entry LE-4421',
    correlationId: 'corr-b12c',
    category: 'financial',
  },
  {
    id: 'aud-3',
    at: '۱۴۰۴/۰۶/۲۱ ۱۸:۴۰',
    actor: 'علی مدل‌ساز',
    action: 'خرید پلن سرویس',
    entity: 'Order ord-901',
    correlationId: 'corr-c77e',
    category: 'financial',
  },
  {
    id: 'aud-4',
    at: '۱۴۰۴/۰۶/۲۰ ۰۹:۱۸',
    actor: 'سارا اپراتور',
    action: 'تعلیق سرویس',
    entity: 'Service: بینایی صنعتی',
    correlationId: 'corr-d04a',
    category: 'catalog',
  },
  {
    id: 'aud-5',
    at: '۱۴۰۴/۰۶/۱۹ ۱۶:۲۲',
    actor: 'سیستم',
    action: 'ورود ناموفق (قفل موقت)',
    entity: 'Identity: unknown@example.invalid',
    correlationId: 'corr-e55b',
    category: 'identity',
  },
]
