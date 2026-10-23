export type SupportPlanStatus = 'active' | 'expired' | 'none' | 'not-required'

export type RequestStatus =
  | 'submitted'
  | 'processing'
  | 'query-ready'
  | 'delivered'
  | 'failed'

export type ModelReview = {
  id: string
  author: string
  rating: number
  at: string
  body: string
}

export type Model = {
  id: string
  name: string
  creatorName: string
  serviceCode: string
  serviceLabel: string
  summary: string
  description: string
  rating: number
  reviewCount: number
  reviews: ModelReview[]
  basePriceIrr: number
  /** مبلغ ثابت Markup (ریال) — اگر markupKind=percent از درصد محاسبه می‌شود برای نمایش */
  markupIrr: number
  markupKind: 'fixed' | 'percent'
  markupPercent?: number
  supportRequired: boolean
  supportPlanStatus: SupportPlanStatus
  supportPlanName?: string
  supportExpiresAt?: string
  /** تمدید خودکار فقط برای پلن ماهانه فعال — انتخاب کاربر */
  autoRenew?: boolean
  consumerSurface: 'api-key-only'
  docVersions: DocVersion[]
  apiKeyPlaceholder: string
  inMyModels: boolean
  /** اگر true، مصرف‌کننده فعلی مالک مدل است → فقط Base */
  ownedByCurrentUser?: boolean
  /**
   * دروازه انتشار سازنده برای کشف — draft در کاتالوگ کشف دیده نمی‌شود.
   * با CreatorModelRow.publishStatus همگام می‌شود.
   */
  publishStatus: 'published' | 'draft'
}

export type DocVersion = {
  id: string
  label: string
  productName: string
  publishedAt: string
  status: 'published' | 'draft'
  note: string
}

export type ReportRequest = {
  id: string
  modelId: string
  question: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
  docVersionId: string
  returnedQuery?: string
  deliveryNote?: string
  baseIrr: number
  markupIrr: number
  errorMessage?: string
}

export type WalletState = {
  postedIrr: number
  reservedIrr: number
  lowBalanceThresholdIrr: number
  monthlyBudgetCapIrr: number | null
  monthlySpentIrr: number
  /** آستانه هشدار نرم اول بودجه ماهانه (٪ از سقف) — پیش‌فرض ۷۰ */
  budgetWarnPctSoft: number
  /** آستانه هشدار نزدیک سقف (٪) — پیش‌فرض ۹۰؛ هنوز قابل‌استفاده تا ۱۰۰٪ */
  budgetWarnPctElevated: number
  topUpHistory: { id: string; amountIrr: number; at: string; method: string }[]
  activeReservations: { id: string; label: string; amountIrr: number; at: string }[]
}

export type DemoWalletScenario = 'healthy' | 'low' | 'debt'

export type UsageRow = {
  id: string
  at: string
  modelId: string
  requestId: string
  status: 'success' | 'error'
  baseIrr: number
  markupIrr: number
  snapshotRef: string
  note?: string
}
