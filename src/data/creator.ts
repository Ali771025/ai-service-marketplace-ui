import {
  formatReportBuilderCapacitySummary,
  type ReportBuilderServicePlanCapacity,
} from './reportBuilderPlanCapacity'

export type CreatorPlanCatalogItem = {
  id: string
  serviceName: string
  name: string
  capacitySummary: string
  priceIrr: number
  status: 'available' | 'sold-out'
}

export type CreatorPlanInstance = {
  id: string
  serviceName: string
  planName: string
  purchasedAt: string
  status: 'active' | 'expiring' | 'expired'
  linkedModelId?: string
  linkedModelName?: string
  expiresAt?: string
  /** آدرس اختصاصی زیر دامنه پلتفرم نمونه — مثلاً reporter-behsaz → /service/reporter-behsaz */
  pathSlug: string
}

export type CreatorModelRow = {
  id: string
  name: string
  instanceId: string
  publishStatus: 'published' | 'draft'
  hasSupportPlans: boolean
  markupIrr: number
  baseIrr: number
  rating: number
  reviewCount: number
}

export type CreatorSupportPlan = {
  id: string
  modelId: string
  modelName: string
  name: string
  kind: 'per-ticket' | 'monthly'
  priceIrr: number
  durationLabel: string
  status: 'active' | 'inactive'
}

export type CreatorEarningRow = {
  id: string
  at: string
  source: 'usage-markup' | 'support'
  label: string
  amountIrr: number
  ref: string
}

export type CreatorPayoutRow = {
  id: string
  at: string
  method: 'sheba' | 'wallet'
  amountIrr: number
  status: 'done' | 'pending'
}

export type CreatorInvoice = {
  id: string
  at: string
  planName: string
  amountIrr: number
  status: 'paid' | 'pending'
}

export type CreatorTicket = {
  id: string
  modelName: string
  consumerName: string
  subject: string
  status: 'open' | 'waiting' | 'closed'
  updatedAt: string
  supportPlan?: string
}

export const CREATOR_DASHBOARD = {
  revenueTodayIrr: 1_240_000,
  revenueMonthIrr: 18_650_000,
  fromUsageIrr: 12_100_000,
  fromSupportIrr: 6_550_000,
  activeInstances: 3,
  openTickets: 2,
  expiringPlans: 1,
}

const CREATOR_REPORT_SILVER: ReportBuilderServicePlanCapacity = {
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

const CREATOR_REPORT_GOLDEN: ReportBuilderServicePlanCapacity = {
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

const CREATOR_REPORT_UNLIMITED: ReportBuilderServicePlanCapacity = {
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

export const CREATOR_PLAN_CATALOG: CreatorPlanCatalogItem[] = [
  {
    id: 'spc-1',
    serviceName: 'کوئری‌ساز',
    name: 'پلن نقره‌ای',
    capacitySummary: formatReportBuilderCapacitySummary(CREATOR_REPORT_SILVER),
    priceIrr: 15_000_000,
    status: 'available',
  },
  {
    id: 'spc-2',
    serviceName: 'کوئری‌ساز',
    name: 'پلن طلایی',
    capacitySummary: formatReportBuilderCapacitySummary(CREATOR_REPORT_GOLDEN),
    priceIrr: 42_000_000,
    status: 'available',
  },
  {
    id: 'spc-2b',
    serviceName: 'کوئری‌ساز',
    name: 'پلن نامحدود (نمایشی)',
    capacitySummary: formatReportBuilderCapacitySummary(CREATOR_REPORT_UNLIMITED),
    priceIrr: 75_000_000,
    status: 'available',
  },
  {
    id: 'spc-3',
    serviceName: 'تحلیل اسناد',
    name: 'پلن پایه',
    capacitySummary: '۵۰۰ سند/ماه',
    priceIrr: 8_500_000,
    status: 'sold-out',
  },
]

export const CREATOR_INSTANCES: CreatorPlanInstance[] = [
  {
    id: 'inst-01',
    serviceName: 'کوئری‌ساز',
    planName: 'پلن نقره‌ای',
    purchasedAt: '۱۴۰۴/۰۳/۱۵',
    status: 'active',
    linkedModelId: 'mdl-behsaz-rb',
    linkedModelName: 'کوئری‌ساز نمونه پارس',
    expiresAt: '۱۴۰۵/۰۳/۱۵',
    pathSlug: 'reporter-behsaz',
  },
  {
    id: 'inst-02',
    serviceName: 'کوئری‌ساز',
    planName: 'پلن نقره‌ای',
    purchasedAt: '۱۴۰۴/۰۴/۰۲',
    status: 'expiring',
    linkedModelId: 'mdl-hesab-rb',
    linkedModelName: 'کوئری‌ساز حساب‌یار',
    expiresAt: '۱۴۰۴/۰۷/۰۲',
    pathSlug: 'hesab-yar',
  },
  {
    id: 'inst-03',
    serviceName: 'کوئری‌ساز',
    planName: 'پلن طلایی',
    purchasedAt: '۱۴۰۴/۰۶/۱۰',
    status: 'active',
    expiresAt: '۱۴۰۵/۰۶/۱۰',
    pathSlug: 'reporter-gold-demo',
  },
]

export const CREATOR_MODELS: CreatorModelRow[] = [
  {
    id: 'mdl-behsaz-rb',
    name: 'کوئری‌ساز نمونه پارس',
    instanceId: 'inst-01',
    publishStatus: 'published',
    hasSupportPlans: true,
    markupIrr: 2_500,
    baseIrr: 8_500,
    rating: 4.6,
    reviewCount: 18,
  },
  {
    id: 'mdl-hesab-rb',
    name: 'کوئری‌ساز حساب‌یار',
    instanceId: 'inst-02',
    publishStatus: 'published',
    hasSupportPlans: true,
    markupIrr: 1_800,
    baseIrr: 7_200,
    rating: 4.2,
    reviewCount: 9,
  },
]

export const CREATOR_SUPPORT_PLANS: CreatorSupportPlan[] = [
  {
    id: 'csp-1',
    modelId: 'mdl-behsaz-rb',
    modelName: 'کوئری‌ساز نمونه پارس',
    name: 'پشتیبانی ماهانه استاندارد',
    kind: 'monthly',
    priceIrr: 2_500_000,
    durationLabel: '۳۰ روز',
    status: 'active',
  },
  {
    id: 'csp-2',
    modelId: 'mdl-hesab-rb',
    modelName: 'کوئری‌ساز حساب‌یار',
    name: 'پشتیبانی per-ticket',
    kind: 'per-ticket',
    priceIrr: 450_000,
    durationLabel: 'تا بسته‌شدن',
    status: 'active',
  },
]

export const CREATOR_EARNINGS: CreatorEarningRow[] = [
  {
    id: 'earn-1',
    at: '۱۴۰۴/۰۶/۲۲',
    source: 'usage-markup',
    label: 'حاشیه مصرف — نمونه پارس',
    amountIrr: 350_000,
    ref: 'stl-8821',
  },
  {
    id: 'earn-2',
    at: '۱۴۰۴/۰۶/۲۰',
    source: 'support',
    label: 'فروش پلن پشتیبانی ماهانه',
    amountIrr: 2_500_000,
    ref: 'inv-c-1001',
  },
  {
    id: 'earn-3',
    at: '۱۴۰۴/۰۶/۱۸',
    source: 'usage-markup',
    label: 'حاشیه مصرف — حساب‌یار',
    amountIrr: 180_000,
    ref: 'stl-8790',
  },
]

export const CREATOR_PAYOUTS: CreatorPayoutRow[] = [
  {
    id: 'po-1',
    at: '۱۴۰۴/۰۶/۰۱',
    method: 'sheba',
    amountIrr: 8_000_000,
    status: 'done',
  },
  {
    id: 'po-2',
    at: '۱۴۰۴/۰۵/۱۵',
    method: 'wallet',
    amountIrr: 1_200_000,
    status: 'done',
  },
]

export const CREATOR_EARNINGS_SUMMARY = {
  availableIrr: 6_430_000,
  fromUsageIrr: 3_930_000,
  fromSupportIrr: 2_500_000,
  shebaMinAmountIrr: 5_000_000,
  shebaMinDays: 14,
}

export const CREATOR_INVOICES: CreatorInvoice[] = [
  {
    id: 'inv-cr-501',
    at: '۱۴۰۴/۰۳/۱۵',
    planName: 'پلن نقره‌ای کوئری‌ساز',
    amountIrr: 15_000_000,
    status: 'paid',
  },
  {
    id: 'inv-cr-502',
    at: '۱۴۰۴/۰۶/۱۰',
    planName: 'پلن طلایی کوئری‌ساز',
    amountIrr: 42_000_000,
    status: 'paid',
  },
  {
    id: 'inv-cr-503',
    at: '۱۴۰۴/۰۶/۲۵',
    planName: 'پلن نقره‌ای (تمدید)',
    amountIrr: 15_000_000,
    status: 'pending',
  },
]

export const CREATOR_TICKETS: CreatorTicket[] = [
  {
    id: 'tkt-c-01',
    modelName: 'کوئری‌ساز نمونه پارس',
    consumerName: 'مریم مصرف‌کننده',
    subject: 'خطا در بازگشت کوئری برای فیلد تاریخ',
    status: 'open',
    updatedAt: '۱۴۰۴/۰۶/۲۱',
    supportPlan: 'پشتیبانی ماهانه استاندارد',
  },
  {
    id: 'tkt-cr-03',
    modelName: 'کوئری‌ساز نمونه پارس',
    consumerName: 'شرکت آریا',
    subject: 'درخواست نسخه دانش جدید',
    status: 'waiting',
    updatedAt: '۱۴۰۴/۰۶/۱۹',
    supportPlan: 'پشتیبانی ماهانه استاندارد',
  },
  {
    id: 'tkt-c-02',
    modelName: 'کوئری‌ساز حساب‌یار',
    consumerName: 'مریم مصرف‌کننده',
    subject: 'درخواست راهنمایی اتصال کلید دسترسی',
    status: 'closed',
    updatedAt: '۱۴۰۴/۰۵/۱۰',
  },
]
