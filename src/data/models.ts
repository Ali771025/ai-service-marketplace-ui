import type { Model } from './types'

export const MODELS: Model[] = [
  {
    id: 'mdl-behsaz-rb',
    name: 'کوئری‌ساز نمونه پارس',
    creatorName: 'پارس‌نرم',
    serviceCode: 'ERP-RB',
    serviceLabel: 'کوئری‌ساز',
    summary: 'تولید کوئری SQL استاندارد برای سامانه نمونه؛ اجرا در نرم‌افزار محلی سازنده.',
    description:
      'این مدل دانش ساختار دیتابیس نسخه‌های نمونه را نگه می‌دارد. مصرف‌کننده درخواست گزارش را از طریق نرم‌افزار مقصد (با کلید دسترسی) ارسال می‌کند؛ پلتفرم کوئری را برمی‌گرداند و نرم‌افزار سازنده آن را اجرا و نتیجه را تحویل می‌دهد. منوی تست در رابط برای خریدار مدل نهایی وجود ندارد.',
    rating: 4.6,
    reviewCount: 18,
    reviews: [
      {
        id: 'rev-1',
        author: 'شرکت آریا',
        rating: 5,
        at: '۱۴۰۴/۱۱/۲۰',
        body: 'کوئری‌ها دقیق و قابل اجرا روی نسخه ۳.۲ نمونه بودند.',
      },
      {
        id: 'rev-2',
        author: 'مهدی ک.',
        rating: 4,
        at: '۱۴۰۴/۱۰/۰۸',
        body: 'پشتیبانی مدل‌ساز سریع بود؛ قیمت مصرف شفاف است.',
      },
    ],
    basePriceIrr: 8500,
    markupIrr: 2500,
    markupKind: 'fixed',
    supportRequired: true,
    supportPlanStatus: 'active',
    supportPlanName: 'پشتیبانی ماهانه استاندارد',
    supportExpiresAt: '۱۴۰۵/۰۱/۱۵',
    autoRenew: true,
    consumerSurface: 'api-key-only',
    apiKeyPlaceholder: 'portfolio_live_••••••••behsaz',
    inMyModels: true,
    publishStatus: 'published',
    docVersions: [
      {
        id: 'ver-behsaz-3.2',
        label: 'نسخه دانش ۳.۲',
        productName: 'نمونه مالی',
        publishedAt: '۱۴۰۴/۱۱/۰۲',
        status: 'published',
        note: 'جداول فروش، انبار و فاکتور به‌روز شد.',
      },
      {
        id: 'ver-behsaz-3.1',
        label: 'نسخه دانش ۳.۱',
        productName: 'نمونه مالی',
        publishedAt: '۱۴۰۴/۰۸/۲۰',
        status: 'published',
        note: 'اصلاح روابط مشتریان و سفارشات.',
      },
    ],
  },
  {
    id: 'mdl-hesab-rb',
    name: 'کوئری‌ساز حساب‌یار',
    creatorName: 'حساب‌یار تک',
    serviceCode: 'ERP-RB',
    serviceLabel: 'کوئری‌ساز',
    summary: 'کوئری‌های مالی و دفترکل برای محصول حساب‌یار؛ تحویل از طریق نرم‌افزار مقصد.',
    description:
      'مدل بر اساس مستندات نسخه‌بندی‌شده دیتابیس حساب‌یار ساخته شده است. جریان مصرف: کلید دسترسی در نرم‌افزار سازنده → ارسال سؤال → دریافت کوئری → اجرای محلی و تحویل نتیجه.',
    rating: 4.2,
    reviewCount: 9,
    reviews: [
      {
        id: 'rev-3',
        author: 'واحد مالی سپهر',
        rating: 4,
        at: '۱۴۰۴/۰۹/۱۵',
        body: 'برای دفترکل خوب کار می‌کند؛ پلن پشتیبانی ما منقضی شده و درخواست جدید مسدود است.',
      },
    ],
    basePriceIrr: 7200,
    markupIrr: 1800,
    markupKind: 'fixed',
    supportRequired: true,
    supportPlanStatus: 'expired',
    supportPlanName: 'پشتیبانی به ازای تیکت',
    supportExpiresAt: '۱۴۰۴/۱۰/۰۱',
    autoRenew: false,
    consumerSurface: 'api-key-only',
    apiKeyPlaceholder: 'portfolio_live_••••••••hesab',
    inMyModels: true,
    publishStatus: 'published',
    docVersions: [
      {
        id: 'ver-hesab-2.0',
        label: 'نسخه دانش ۲.۰',
        productName: 'حساب‌یار سازمانی',
        publishedAt: '۱۴۰۴/۰۹/۱۲',
        status: 'published',
        note: 'دفترکل و مراکز هزینه.',
      },
    ],
  },
  {
    id: 'mdl-anbar-rb',
    name: 'گزارش انبار هوشمند',
    creatorName: 'انبارپرداز',
    serviceCode: 'ERP-RB',
    serviceLabel: 'کوئری‌ساز',
    summary: 'گزارش موجودی، رزرو و گردش انبار؛ بدون پیش‌نیاز پلن پشتیبانی.',
    description:
      'این مدل پلن پشتیبانی تعریف نکرده است — مصرف با کیف پول کافی مجاز است. خروجی سرویس کوئری است که نرم‌افزار محلی سازنده اجرا می‌کند. محیط آزمایشی رایگان وجود ندارد؛ هر مصرف هزینه‌دار است.',
    rating: 4.0,
    reviewCount: 5,
    reviews: [
      {
        id: 'rev-4',
        author: 'انبار مرکزی',
        rating: 4,
        at: '۱۴۰۴/۱۲/۰۵',
        body: 'بدون خرید پشتیبانی هم قابل استفاده بود — دقیقاً همان‌طور که در کاتالوگ نوشته شده.',
      },
    ],
    basePriceIrr: 6000,
    markupIrr: 1500,
    markupKind: 'percent',
    markupPercent: 25,
    supportRequired: false,
    supportPlanStatus: 'not-required',
    consumerSurface: 'api-key-only',
    apiKeyPlaceholder: 'portfolio_live_••••••••anbar',
    inMyModels: false,
    publishStatus: 'published',
    docVersions: [
      {
        id: 'ver-anbar-1.4',
        label: 'نسخه دانش ۱.۴',
        productName: 'انبارپرداز',
        publishedAt: '۱۴۰۴/۱۲/۰۱',
        status: 'published',
        note: 'جدول Stock و Warehouse.',
      },
    ],
  },
  {
    id: 'mdl-own-demo',
    name: 'کوئری‌ساز من (دمو مالک)',
    creatorName: 'کاربر ثبت‌نام‌شده',
    serviceCode: 'ERP-RB',
    serviceLabel: 'کوئری‌ساز',
    summary: 'مدل متعلق به شما — در مصرف، حاشیه مدل‌ساز اعمال نمی‌شود (فقط قیمت پایه).',
    description:
      'این مدل برای نمایش قاعده «مصرف مدل خود توسط مدل‌ساز = فقط قیمت پایه» است. وقتی مالک مدل هستید، حاشیه به خودتان اعمال نمی‌شود؛ فقط سهم پایه پلتفرم از کیف پول کم می‌شود.',
    rating: 0,
    reviewCount: 0,
    reviews: [],
    basePriceIrr: 8500,
    markupIrr: 3000,
    markupKind: 'fixed',
    supportRequired: false,
    supportPlanStatus: 'not-required',
    consumerSurface: 'api-key-only',
    apiKeyPlaceholder: 'portfolio_live_••••••••own',
    inMyModels: true,
    ownedByCurrentUser: true,
    publishStatus: 'published',
    docVersions: [
      {
        id: 'ver-own-1.0',
        label: 'نسخه دانش ۱.۰',
        productName: 'دمو مالک',
        publishedAt: '۱۴۰۴/۱۲/۱۰',
        status: 'published',
        note: 'نسخه نمونه برای دمو RFP.',
      },
    ],
  },
]

export function effectiveMarkup(model: Model): number {
  if (model.ownedByCurrentUser) return 0
  if (model.markupKind === 'percent' && model.markupPercent != null) {
    return Math.round((model.basePriceIrr * model.markupPercent) / 100)
  }
  return model.markupIrr
}

export function estimateCharge(model: Model): { base: number; markup: number; total: number } {
  const base = model.basePriceIrr
  const markup = effectiveMarkup(model)
  return { base, markup, total: base + markup }
}

export function getModel(id: string, list: Model[] = MODELS): Model | undefined {
  return list.find((m) => m.id === id)
}
