import type { UsageRow, WalletState } from './types'

export const INITIAL_WALLET: WalletState = {
  postedIrr: 2_450_000,
  reservedIrr: 110_000,
  lowBalanceThresholdIrr: 200_000,
  monthlyBudgetCapIrr: 5_000_000,
  /** ~۷۳٪ سقف ماهانه — برای دمو هشدار ۷۰٪ */
  monthlySpentIrr: 3_650_000,
  budgetWarnPctSoft: 70,
  budgetWarnPctElevated: 90,
  topUpHistory: [
    { id: 'top-1', amountIrr: 1_000_000, at: '1404/12/01 — ۱۰:۰۰', method: 'درگاه' },
    { id: 'top-2', amountIrr: 2_000_000, at: '1404/10/15 — ۱۸:۳۰', method: 'درگاه' },
  ],
  activeReservations: [
    {
      id: 'rsv-1',
      label: 'رزرو درخواست کوئری‌ساز نمونه',
      amountIrr: 80_000,
      at: '1404/12/20 — ۰۹:۱۰',
    },
    {
      id: 'rsv-2',
      label: 'رزرو تخمینی مصرف ماهانه',
      amountIrr: 30_000,
      at: '1404/12/19 — ۱۲:۰۰',
    },
  ],
}

export const INITIAL_USAGE: UsageRow[] = [
  {
    id: 'usg-1',
    at: '۱۴۰۴/۱۲/۱۸ — ۱۴:۲۲',
    modelId: 'mdl-behsaz-rb',
    requestId: 'req-1001',
    status: 'success',
    baseIrr: 8500,
    markupIrr: 2500,
    snapshotRef: 'snap-behsaz-3.2-a91',
  },
  {
    id: 'usg-2',
    at: '۱۴۰۴/۱۲/۲۰ — ۰۹:۱۱',
    modelId: 'mdl-behsaz-rb',
    requestId: 'req-1002',
    status: 'success',
    baseIrr: 8500,
    markupIrr: 2500,
    snapshotRef: 'snap-behsaz-3.2-b02',
  },
  {
    id: 'usg-3',
    at: '۱۴۰۴/۱۱/۰۵ — ۱۶:۴۱',
    modelId: 'mdl-hesab-rb',
    requestId: 'req-1003',
    status: 'error',
    baseIrr: 0,
    markupIrr: 0,
    snapshotRef: '—',
  },
  {
    id: 'usg-4',
    at: '۱۴۰۴/۱۲/۲۲ — ۱۱:۰۰',
    modelId: 'mdl-own-demo',
    requestId: 'req-1004',
    status: 'success',
    baseIrr: 8500,
    markupIrr: 0,
    snapshotRef: 'snap-own-1.0-self',
    note: 'مصرف مدل خود — فقط Base؛ Markup اعمال نشد',
  },
  {
    id: 'usg-5',
    at: '۱۴۰۴/۱۲/۲۱ — ۱۸:۴۰',
    modelId: 'mdl-hesab-rb',
    requestId: 'req-1005',
    status: 'success',
    baseIrr: 7200,
    markupIrr: 1800,
    snapshotRef: 'snap-hesab-2.1-c05',
  },
  {
    id: 'usg-6',
    at: '۱۴۰۴/۱۲/۱۵ — ۱۰:۰۵',
    modelId: 'mdl-behsaz-rb',
    requestId: 'req-1006',
    status: 'error',
    baseIrr: 0,
    markupIrr: 0,
    snapshotRef: '—',
    note: 'شکست پس از رزرو — آزادسازی mock',
  },
  {
    id: 'usg-7',
    at: '۱۴۰۴/۱۲/۰۸ — ۱۳:۲۰',
    modelId: 'mdl-own-demo',
    requestId: 'req-1007',
    status: 'success',
    baseIrr: 8500,
    markupIrr: 0,
    snapshotRef: 'snap-own-1.0-d07',
  },
]

export function availableBalance(w: WalletState): number {
  return w.postedIrr - w.reservedIrr
}

export type BudgetAlertLevel = 'none' | 'soft' | 'elevated' | 'capped'

export function usagePct(spent: number, cap: number | null | undefined): number | null {
  if (cap == null || cap <= 0) return null
  return Math.min(100, Math.round((spent / cap) * 1000) / 10)
}

export function budgetAlertLevel(
  spent: number,
  cap: number | null | undefined,
  softPct: number,
  elevatedPct: number,
): BudgetAlertLevel {
  const pct = usagePct(spent, cap)
  if (pct == null) return 'none'
  if (pct >= 100) return 'capped'
  if (pct >= elevatedPct) return 'elevated'
  if (pct >= softPct) return 'soft'
  return 'none'
}

export function walletBudgetAlert(w: WalletState): {
  level: BudgetAlertLevel
  pct: number | null
} {
  return {
    level: budgetAlertLevel(
      w.monthlySpentIrr,
      w.monthlyBudgetCapIrr,
      w.budgetWarnPctSoft,
      w.budgetWarnPctElevated,
    ),
    pct: usagePct(w.monthlySpentIrr, w.monthlyBudgetCapIrr),
  }
}
