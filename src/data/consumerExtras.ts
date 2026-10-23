export type ConsumerInvoice = {
  id: string
  at: string
  modelName: string
  planName: string
  amountIrr: number
  status: 'paid' | 'pending' | 'failed'
}

export type SupportTicket = {
  id: string
  modelId: string
  modelName: string
  subject: string
  status: 'open' | 'waiting' | 'closed'
  createdAt: string
  updatedAt: string
  messages: { id: string; from: 'consumer' | 'creator' | 'system'; at: string; body: string }[]
}

export type BuyableSupportPlan = {
  id: string
  modelId: string
  name: string
  kind: 'per-ticket' | 'monthly'
  priceIrr: number
  durationLabel: string
  responseSla: string
  ticketCap?: number
}

export const CONSUMER_INVOICES: ConsumerInvoice[] = [
  {
    id: 'inv-c-1001',
    at: '۱۴۰۴/۰۵/۱۲',
    modelName: 'کوئری‌ساز نمونه پارس',
    planName: 'پشتیبانی ماهانه استاندارد',
    amountIrr: 2_500_000,
    status: 'paid',
  },
  {
    id: 'inv-c-1002',
    at: '۱۴۰۴/۰۶/۰۱',
    modelName: 'کوئری‌ساز حساب‌یار',
    planName: 'پشتیبانی per-ticket',
    amountIrr: 450_000,
    status: 'paid',
  },
  {
    id: 'inv-c-1003',
    at: '۱۴۰۴/۰۶/۱۸',
    modelName: 'کوئری‌ساز نمونه پارس',
    planName: 'تمدید پشتیبانی ماهانه',
    amountIrr: 2_500_000,
    status: 'pending',
  },
]

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-c-01',
    modelId: 'mdl-behsaz-rb',
    modelName: 'کوئری‌ساز نمونه پارس',
    subject: 'خطا در بازگشت کوئری برای فیلد تاریخ',
    status: 'open',
    createdAt: '۱۴۰۴/۰۶/۲۰',
    updatedAt: '۱۴۰۴/۰۶/۲۱',
    messages: [
      {
        id: 'm1',
        from: 'consumer',
        at: '۱۴۰۴/۰۶/۲۰ ۱۰:۱۲',
        body: 'برای سوال «فروش ماه گذشته» کوئری فیلد تاریخ را اشتباه برمی‌گرداند.',
      },
      {
        id: 'm2',
        from: 'creator',
        at: '۱۴۰۴/۰۶/۲۰ ۱۶:۴۰',
        body: 'نسخه دانش را بررسی می‌کنیم. لطفاً شناسه درخواست را بفرستید.',
      },
      {
        id: 'm3',
        from: 'consumer',
        at: '۱۴۰۴/۰۶/۲۱ ۰۹:۰۵',
        body: 'شناسه درخواست: req-1002',
      },
    ],
  },
  {
    id: 'tkt-c-02',
    modelId: 'mdl-hesab-rb',
    modelName: 'کوئری‌ساز حساب‌یار',
    subject: 'درخواست راهنمایی اتصال کلید دسترسی',
    status: 'closed',
    createdAt: '۱۴۰۴/۰۵/۰۸',
    updatedAt: '۱۴۰۴/۰۵/۱۰',
    messages: [
      {
        id: 'm1',
        from: 'consumer',
        at: '۱۴۰۴/۰۵/۰۸',
        body: 'کلید دسترسی در نرم‌افزار محلی کجا تنظیم می‌شود؟',
      },
      {
        id: 'm2',
        from: 'creator',
        at: '۱۴۰۴/۰۵/۰۹',
        body: 'در تنظیمات یکپارچه‌سازی → پلتفرم نمونه → کلید سرویس.',
      },
      {
        id: 'm3',
        from: 'system',
        at: '۱۴۰۴/۰۵/۱۰',
        body: 'تیکت توسط مصرف‌کننده بسته شد.',
      },
    ],
  },
]

export const BUYABLE_SUPPORT_PLANS: BuyableSupportPlan[] = [
  {
    id: 'bsp-1',
    modelId: 'mdl-behsaz-rb',
    name: 'پشتیبانی ماهانه استاندارد',
    kind: 'monthly',
    priceIrr: 2_500_000,
    durationLabel: '۳۰ روز',
    responseSla: 'پاسخ تا ۲۴ ساعت کاری',
    ticketCap: 20,
  },
  {
    id: 'bsp-2',
    modelId: 'mdl-hesab-rb',
    name: 'پشتیبانی per-ticket',
    kind: 'per-ticket',
    priceIrr: 450_000,
    durationLabel: 'تا بسته‌شدن تیکت',
    responseSla: 'پاسخ تا ۴۸ ساعت کاری',
    ticketCap: 1,
  },
  {
    id: 'bsp-3',
    modelId: 'mdl-behsaz-rb',
    name: 'پشتیبانی per-ticket',
    kind: 'per-ticket',
    priceIrr: 450_000,
    durationLabel: 'تا بسته‌شدن تیکت',
    responseSla: 'پاسخ تا ۴۸ ساعت کاری',
    ticketCap: 1,
  },
]
