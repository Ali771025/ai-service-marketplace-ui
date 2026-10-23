import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Wallet,
  FileText,
  AlertTriangle,
  Compass,
  Layers,
  Server,
  Headset,
  ClipboardList,
  Inbox,
  Banknote,
  BarChart3,
  Shield,
  Boxes,
  BadgePercent,
  LifeBuoy,
  KeyRound,
  Receipt,
  BookOpen,
  ShoppingCart,
  User,
  Users,
  Settings,
  Package,
  GitBranch,
  Ticket,
  Activity,
  HandCoins,
  Gauge,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}

/**
 * حساب — الگوی marketplace workspace
 * میز کار · بازار · مالی · پشتیبانی · تیم · حساب
 */
export const ACCOUNT_NAV_GROUPS: NavGroup[] = [
  {
    items: [{ to: '/account', label: 'میز کار', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'بازار',
    items: [
      { to: '/account/discover', label: 'کشف مدل‌ها', icon: Compass },
      { to: '/account/buy-plans', label: 'خرید پلن سرویس', icon: ShoppingCart },
    ],
  },
  {
    label: 'مالی',
    items: [
      { to: '/account/wallet', label: 'کیف پول', icon: Wallet },
      { to: '/account/invoices', label: 'صورت‌حساب‌ها', icon: FileText },
    ],
  },
  {
    label: 'پشتیبانی',
    items: [
      { to: '/account/exceptions', label: 'درخواست به پلتفرم نمونه', icon: AlertTriangle },
    ],
  },
  {
    label: 'تیم',
    items: [{ to: '/account/members', label: 'اعضای دسترسی', icon: Users }],
  },
  {
    label: 'حساب',
    items: [{ to: '/account/profile', label: 'پروفایل', icon: User }],
  },
]

/** سازگاری با importهای قدیمی */
export const ACCOUNT_NAV: NavItem[] = ACCOUNT_NAV_GROUPS.flatMap((g) => g.items)

/**
 * نمونه سرویس (Plan Instance) — محصول · عملیات · مالی
 */
export function serviceNavGroups(instanceId: string): NavGroup[] {
  const base = `/account/services/${instanceId}`
  return [
    {
      items: [{ to: base, label: 'نمای کلی', icon: Layers, end: true }],
    },
    {
      label: 'محصول',
      items: [
        { to: `${base}/models`, label: 'مدیریت مدل', icon: Boxes },
        { to: `${base}/markup`, label: 'تعریف Markup', icon: BadgePercent },
        { to: `${base}/support-plans`, label: 'تعریف پلن پشتیبانی', icon: Headset },
        { to: `${base}/knowledge`, label: 'دانش و ZIP', icon: BookOpen },
      ],
    },
    {
      label: 'عملیات',
      items: [
        { to: `${base}/sql-tester`, label: 'تست کوئری سازنده', icon: Receipt },
        { to: `${base}/tickets`, label: 'صندوق تیکت مشتری', icon: LifeBuoy },
        { to: `${base}/usage`, label: 'مصرف توکن', icon: Activity },
      ],
    },
    {
      label: 'مالی',
      items: [{ to: `${base}/earnings`, label: 'درآمد و وصول', icon: Banknote }],
    },
  ]
}

/**
 * هاب مدیریت یک سرویس در فضای پلتفرم — منوی اختصاصی همان سرویس
 * (جدا از ناوبری سراسری کاتالوگ / مالی / بینش)
 */
export function platformServiceNavGroups(serviceId: string): NavGroup[] {
  const base = `/platform/services/${serviceId}`
  return [
    {
      items: [{ to: base, label: 'نمای کلی', icon: Layers, end: true }],
    },
    {
      label: 'پیکربندی',
      items: [
        { to: `${base}/pricing`, label: 'قیمت پایه و متر', icon: BadgePercent },
        { to: `${base}/plans`, label: 'تعریف پلن‌ها', icon: Package },
        { to: `${base}/provision`, label: 'نصب راه دور', icon: GitBranch },
        { to: `${base}/payout`, label: 'قواعد وصول', icon: HandCoins },
      ],
    },
    {
      label: 'بینش سرویس',
      items: [{ to: `${base}/usage`, label: 'مصرف توکن', icon: Activity }],
    },
  ]
}

export function serviceNav(instanceId: string): NavItem[] {
  return serviceNavGroups(instanceId).flatMap((g) => g.items)
}

/**
 * فضای استفاده از مدل — کلید دسترسی کار اصلی کوئری‌ساز است
 */
export function modelUseNavGroups(modelId: string): NavGroup[] {
  const base = `/account/models/${modelId}`
  return [
    {
      items: [{ to: base, label: 'نمای کلی', icon: Boxes, end: true }],
    },
    {
      label: 'یکپارچه‌سازی',
      items: [
        { to: `${base}/how-it-works`, label: 'مدیریت کلید دسترسی', icon: KeyRound },
        { to: `${base}/connect-guide`, label: 'راهنمای اتصال', icon: BookOpen },
      ],
    },
    {
      label: 'مصرف',
      items: [
        { to: `${base}/usage`, label: 'خلاصه مصرف', icon: Activity },
        { to: `${base}/history`, label: 'تاریخچه فراخوانی', icon: FileText },
      ],
    },
    {
      label: 'پشتیبانی',
      items: [
        { to: `${base}/support`, label: 'تیکت به مدل‌ساز', icon: LifeBuoy },
        { to: `${base}/buy-support`, label: 'خرید پلن پشتیبانی', icon: ShoppingCart },
        { to: `${base}/complaint`, label: 'ثبت شکایت', icon: AlertTriangle },
      ],
    },
    {
      label: 'ارائه',
      items: [
        { to: `${base}/request`, label: 'شبیه‌ساز غیررسمی', icon: Receipt },
      ],
    },
  ]
}

export function modelUseNav(modelId: string): NavItem[] {
  return modelUseNavGroups(modelId).flatMap((g) => g.items)
}

/**
 * اپراتور پلتفرم — الگوی Stripe / AWS console / marketplace ops:
 * داشبورد · کاتالوگ · بازرگانی · پشتیبانی · هویت · مالی · بینش · تنظیمات
 *
 * درآمد Base فقط زیر گروه مالی (کنار قواعد وصول) — نه سطح اول و نه بینش/داشبورد.
 */
export const PLATFORM_NAV_GROUPS: NavGroup[] = [
  {
    items: [{ to: '/platform', label: 'داشبورد', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'کاتالوگ',
    items: [
      { to: '/platform/services', label: 'مدیریت سرویس‌ها', icon: Server },
      { to: '/platform/plans', label: 'فهرست پلن‌ها', icon: Package },
      { to: '/platform/versions', label: 'نسخه‌ها و Manifest', icon: GitBranch },
    ],
  },
  {
    label: 'بازرگانی',
    items: [
      { to: '/platform/orders', label: 'سفارش‌های پلن سرویس', icon: ClipboardList },
    ],
  },
  {
    label: 'پشتیبانی',
    items: [
      { to: '/platform/exceptions', label: 'صندوق استثناها', icon: Inbox },
      { to: '/platform/tickets', label: 'صف تیکت پشتیبانی', icon: Ticket },
    ],
  },
  {
    label: 'هویت',
    items: [
      { to: '/platform/users', label: 'مدیریت کاربران', icon: Users },
      { to: '/platform/org-peers', label: 'اعضای سازمان', icon: User },
    ],
  },
  {
    label: 'مالی',
    items: [
      { to: '/platform/revenue', label: 'درآمد Base', icon: Banknote },
      { to: '/platform/payouts', label: 'قواعد وصول مدل‌ساز', icon: HandCoins },
    ],
  },
  {
    label: 'بینش',
    items: [
      { to: '/platform/reports', label: 'گزارش‌های عملیاتی', icon: BarChart3 },
      { to: '/platform/execution-metrics', label: 'متریک اجرا', icon: Gauge },
      { to: '/platform/audit', label: 'ردپای حسابرسی', icon: Shield },
    ],
  },
  {
    label: 'تنظیمات',
    items: [{ to: '/platform/settings', label: 'تنظیمات پلتفرم', icon: Settings }],
  },
]

/** سازگاری با importهای قدیمی — از گروه‌ها مشتق می‌شود */
export const PLATFORM_NAV: NavItem[] = PLATFORM_NAV_GROUPS.flatMap((g) => g.items)
