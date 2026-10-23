/**

 * API Key مصرف‌کننده — mock برای حالت الف/ب، سقف بودجه کلی، Usage per کلید، هشدار چندآستانه.

 * منبع حقیقت دامنه: Report-Builder Confirmed §۷ / ۷‑ب / ۷‑ج / ۷‑د.

 */



import {

  budgetAlertLevel,

  usagePct,

  type BudgetAlertLevel,

} from './wallet'



export type ApiKeyIssueMode = 'self' | 'org-admin'



export type ConsumerApiKeyRow = {

  id: string

  modelId: string

  label: string

  /** حالت صدور: الف = self · ب = org-admin */

  issueMode: ApiKeyIssueMode

  status: 'active' | 'revoked'

  maskedSecret: string

  /** سقف بودجه کلی تجمعی (ریال) — null = بدون سقف کلید */

  overallBudgetCapIrr: number | null

  /** مصرف تجمعی زیر این کلید (mock) */

  spentIrr: number

  /**

   * آستانه هشدار نرم (٪) — null = ارث از تنظیمات حساب (Wallet).

   * پیش‌فرض حساب: ۷۰

   */

  warnPctSoft: number | null

  /** آستانه نزدیک سقف (٪) — null = ارث از حساب (پیش‌فرض ۹۰) */

  warnPctElevated: number | null

  requestsMonth: number

  tokensMonth: number

  createdAt: string

}



export type AccountBudgetWarnDefaults = {

  budgetWarnPctSoft: number

  budgetWarnPctElevated: number

}



export const DEFAULT_BUDGET_WARN: AccountBudgetWarnDefaults = {

  budgetWarnPctSoft: 70,

  budgetWarnPctElevated: 90,

}



/** کلیدهای نمونه برای مدل نمونه — حالت ب (چند کلید زیر یک ادمین) */

export const SEED_API_KEYS: ConsumerApiKeyRow[] = [

  {

    id: 'key-behsaz-admin',

    modelId: 'mdl-behsaz-rb',

    label: 'کلید ادمین سازمان',

    issueMode: 'org-admin',

    status: 'active',

    maskedSecret: 'portfolio_live_••••••••adm1',

    overallBudgetCapIrr: 5_000_000,

    /** ~۹۲٪ — هشدار ۹۰٪؛ هنوز قابل‌استفاده */

    spentIrr: 4_600_000,

    warnPctSoft: null,

    warnPctElevated: null,

    requestsMonth: 28,

    tokensMonth: 82_100,

    createdAt: '۱۴۰۴/۰۵/۰۱',

  },

  {

    id: 'key-behsaz-desk',

    modelId: 'mdl-behsaz-rb',

    label: 'میز فروش (کارمند)',

    issueMode: 'org-admin',

    status: 'active',

    maskedSecret: 'portfolio_live_••••••••desk',

    overallBudgetCapIrr: 1_500_000,

    /** ~۷۳٪ — هشدار ۷۰٪ */

    spentIrr: 1_100_000,

    warnPctSoft: null,

    warnPctElevated: null,

    requestsMonth: 14,

    tokensMonth: 41_200,

    createdAt: '۱۴۰۴/۰۵/۱۲',

  },

  {

    id: 'key-behsaz-finance',

    modelId: 'mdl-behsaz-rb',

    label: 'واحد مالی',

    issueMode: 'org-admin',

    status: 'active',

    maskedSecret: 'portfolio_live_••••••••fin',

    overallBudgetCapIrr: 2_000_000,

    spentIrr: 2_000_000,

    warnPctSoft: null,

    warnPctElevated: null,

    requestsMonth: 9,

    tokensMonth: 22_400,

    createdAt: '۱۴۰۴/۰۶/۰۲',

  },

  {

    id: 'key-hesab-self',

    modelId: 'mdl-hesab-rb',

    label: 'کلید شخصی من',

    issueMode: 'self',

    status: 'active',

    maskedSecret: 'portfolio_live_••••••••hesab',

    overallBudgetCapIrr: null,

    spentIrr: 420_000,

    warnPctSoft: null,

    warnPctElevated: null,

    requestsMonth: 11,

    tokensMonth: 31_800,

    createdAt: '۱۴۰۴/۰۴/۲۰',

  },

]



export function keysForModel(modelId: string, all: ConsumerApiKeyRow[] = SEED_API_KEYS) {

  return all.filter((k) => k.modelId === modelId)

}



/** اگر seed نداشت، یک کلید الف شخصی mock می‌سازد */

export function keysForModelOrFallback(

  modelId: string,

  maskedSecret: string,

  all: ConsumerApiKeyRow[] = SEED_API_KEYS,

): ConsumerApiKeyRow[] {

  const found = keysForModel(modelId, all)

  if (found.length > 0) return found

  return [

    {

      id: `key-fallback-${modelId}`,

      modelId,

      label: 'کلید شخصی من',

      issueMode: 'self',

      status: 'active',

      maskedSecret,

      overallBudgetCapIrr: null,

      spentIrr: 180_000,

      warnPctSoft: null,

      warnPctElevated: null,

      requestsMonth: 6,

      tokensMonth: 14_200,

      createdAt: '۱۴۰۴/۰۶/۰۱',

    },

  ]

}



export function remainingBudgetIrr(key: ConsumerApiKeyRow): number | null {

  if (key.overallBudgetCapIrr == null) return null

  return Math.max(0, key.overallBudgetCapIrr - key.spentIrr)

}



export function resolveKeyWarnThresholds(

  key: ConsumerApiKeyRow,

  account: AccountBudgetWarnDefaults = DEFAULT_BUDGET_WARN,

): { soft: number; elevated: number } {

  return {

    soft: key.warnPctSoft ?? account.budgetWarnPctSoft,

    elevated: key.warnPctElevated ?? account.budgetWarnPctElevated,

  }

}



export function keyBudgetUsagePct(key: ConsumerApiKeyRow): number | null {

  return usagePct(key.spentIrr, key.overallBudgetCapIrr)

}



export function keyBudgetAlert(

  key: ConsumerApiKeyRow,

  account: AccountBudgetWarnDefaults = DEFAULT_BUDGET_WARN,

): { level: BudgetAlertLevel; pct: number | null; soft: number; elevated: number } {

  const { soft, elevated } = resolveKeyWarnThresholds(key, account)

  return {

    level: budgetAlertLevel(key.spentIrr, key.overallBudgetCapIrr, soft, elevated),

    pct: keyBudgetUsagePct(key),

    soft,

    elevated,

  }

}



/** headroom کوتاه‌مدت — درصد پر بودن ظرفیت (بالاتر = نزدیک‌تر به سقف) */

export type CapacityBar = {

  label: string

  /** ۰–۱۰۰ مصرف نسبی نسبت به سقف هم‌زمانی/نرخ */

  usedPct: number

  hint: string

}



export const SHORT_TERM_CAPACITY: Record<string, CapacityBar[]> = {

  default: [

    { label: '۲س اخیر', usedPct: 35, hint: 'هم‌زمانی ۱ از ۳' },

    { label: '۶س', usedPct: 52, hint: 'اوج ظهر' },

    { label: '۱۲س', usedPct: 28, hint: 'عصر آرام' },

    { label: '۲۴س', usedPct: 61, hint: 'نزدیک اوج' },

    { label: '۲روز', usedPct: 44, hint: 'میانگین' },

    { label: '۷روز', usedPct: 38, hint: 'پایدار' },

  ],

  'mdl-behsaz-rb': [

    { label: '۲س اخیر', usedPct: 67, hint: 'هم‌زمانی ۲ از ۳' },

    { label: '۶س', usedPct: 81, hint: 'اوج صف' },

    { label: '۱۲س', usedPct: 45, hint: 'کاهش' },

    { label: '۲۴س', usedPct: 72, hint: 'نزدیک سقف' },

    { label: '۲روز', usedPct: 58, hint: 'میانگین' },

    { label: '۷روز', usedPct: 49, hint: 'پایدار' },

  ],

}



/** محتوای راهنمای اتصال — mock contribution سرویس کوئری‌ساز (نه متن ثابت هسته) */

export function reportBuilderConnectGuideMarkdown(pathSlug: string, modelName: string): string {

  return `## اتصال به مدل «${modelName}»



محتوای این بخش از **سرویس کوئری‌ساز** تأمین شده است. پلتفرم نمونه فقط پوسته را میزبانی و مقادیر پلتفرم را تزریق می‌کند.



### پایهٔ فراخوانی (تزریق‌شده توسط پلتفرم نمونه)



\`\`\`

https://api.example.invalid/service/${pathSlug}/v1/invoke

\`\`\`



\`pathSlug\` یکتای این مدل/نمونه: \`${pathSlug}\`



### نمونه هدر (محتوای سرویس)



\`\`\`http

POST /service/${pathSlug}/v1/invoke HTTP/1.1

Host: api.example.invalid

Authorization: Bearer <API_KEY>

Content-Type: application/json

\`\`\`



### بدنهٔ نمونه



\`\`\`json

{

  "question": "موجودی کالاهای انبار مرکزی را بده",

  "docVersionId": "ver-behsaz-3.2"

}

\`\`\`



### نکتهٔ یکپارچه‌سازی



قرار دادن کلید دسترسی داخل نرم‌افزار مقصد (مثلاً حسابداری) **وظیفهٔ یکپارچه‌ساز / مدل‌ساز** است — پلتفرم نمونه کلید را در نرم‌افزار شما نصب نمی‌کند.

`

}


