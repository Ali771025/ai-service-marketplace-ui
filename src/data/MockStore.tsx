import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppPersistedState, ExceptionKind, ExceptionTicket, ProvisionJob } from './appState'
import { createInitialAppState } from './seedState'
import { loadJson, saveJson, uid, nowLabel } from './persist'
import { estimateCharge } from './models'
import { buildMockQuery } from './requests'
import { availableBalance, INITIAL_WALLET } from './wallet'
import { SUPPORT_FRAMEWORK } from './platform'
import type { DemoWalletScenario, Model, WalletState } from './types'
import type { PlatformService, PlatformServicePlan } from './platform'
import type { CreatorPlanInstance, CreatorModelRow, CreatorSupportPlan } from './creator'
import {
  formatReportBuilderCapacitySummary,
  normalizeReportBuilderCapacity,
} from './reportBuilderPlanCapacity'

const STORAGE_KEY = 'portfolio-mock-app-state-v4'
const LEGACY_STORAGE_KEY = 'portfolio-mock-app-state-v3'

function suggestPathSlug(serviceName: string, instanceId: string): string {
  const base = serviceName
    .replace(/(?:گزارش|کوئری)[\u200c\s-]*ساز\s*/g, 'reporter-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .slice(0, 24)
  return `${base || 'service'}-${instanceId.slice(-4)}`.toLowerCase()
}

function migrateLoadedState(raw: AppPersistedState): AppPersistedState {
  return {
    ...raw,
    version: 4,
    wallet: {
      ...raw.wallet,
      budgetWarnPctSoft: raw.wallet.budgetWarnPctSoft ?? 70,
      budgetWarnPctElevated: raw.wallet.budgetWarnPctElevated ?? 90,
    },
    models: raw.models.map((m) => ({
      ...m,
      publishStatus: m.publishStatus ?? 'published',
    })),
    creatorInstances: raw.creatorInstances.map((i) => ({
      ...i,
      pathSlug:
        (i as CreatorPlanInstance).pathSlug ||
        suggestPathSlug(i.serviceName, i.id),
    })),
    services: raw.services.map((s) => {
      const baseByMeterIrr =
        s.baseByMeterIrr && typeof s.baseByMeterIrr === 'object'
          ? { ...s.baseByMeterIrr }
          : s.meters.length > 0 && s.basePriceIrr > 0
            ? { [s.meters[0]!]: s.basePriceIrr }
            : {}
      let meters = [...(s.meters ?? [])]
      // کوئری‌ساز: فقط AI.Token Meter قیمت است؛ Request سقف شمارنده پلن است نه Base
      if (
        s.id === 'svc-report' ||
        /(?:گزارش|کوئری)[\u200c\s-]*ساز/.test(s.name ?? '')
      ) {
        meters = ['AI.Token']
        const tokenBase =
          baseByMeterIrr['AI.Token'] ??
          (typeof s.basePriceIrr === 'number' && s.basePriceIrr > 0 ? s.basePriceIrr : undefined)
        const cleaned: Record<string, number> = {}
        if (tokenBase != null && tokenBase > 0) cleaned['AI.Token'] = tokenBase
        return {
          ...s,
          meters,
          baseByMeterIrr: cleaned,
          basePriceIrr: cleaned['AI.Token'] ?? 0,
        }
      }
      return {
        ...s,
        meters,
        baseByMeterIrr,
        basePriceIrr:
          meters.length === 0
            ? 0
            : s.basePriceIrr ??
              (Object.values(baseByMeterIrr)[0] as number | undefined) ??
              0,
      }
    }),
    servicePlans: raw.servicePlans.map((p) => {
      if (!p.reportBuilderCapacity) return p
      const reportBuilderCapacity = normalizeReportBuilderCapacity(
        p.reportBuilderCapacity as Parameters<typeof normalizeReportBuilderCapacity>[0],
      )
      return {
        ...p,
        reportBuilderCapacity,
        capacitySummary: formatReportBuilderCapacitySummary(reportBuilderCapacity),
      }
    }),
    provisionJobs: raw.provisionJobs.map((j) => ({
      ...j,
      baseUrl: j.baseUrl || j.endpoint || '',
      contractVersion: j.contractVersion || 'portfolio-integration-1',
      healthPath: j.healthPath || '/health',
      timeoutSec: j.timeoutSec ?? 30,
      environment: j.environment || 'production',
      healthStatus: j.healthStatus || 'unknown',
      consumerSurface:
        j.consumerSurface ||
        (j.apiMode === 'api-key-only' ? 'api-key-only' : 'hybrid'),
    })),
  }
}

type MockStore = AppPersistedState & {
  availableIrr: number
  supportFrameworkGuidance: string
  supportPricingModels: string[]
  resetDemoData: () => void
  setWalletScenario: (s: DemoWalletScenario) => void
  mockTopUp: (amountIrr: number) => void
  /** کسر از کیف پول برای تست سازنده / مصرف mock */
  debitWallet: (amountIrr: number, label?: string) => { ok: true } | { ok: false; message: string }
  updateWalletSettings: (patch: {
    lowBalanceThresholdIrr?: number
    monthlyBudgetCapIrr?: number | null
    budgetWarnPctSoft?: number
    budgetWarnPctElevated?: number
  }) => void
  submitRequest: (input: {
    modelId: string
    question: string
    docVersionId: string
  }) => { ok: true; requestId: string } | { ok: false; message: string }
  markDelivered: (requestId: string) => void
  activateSupportPlan: (input: {
    modelId: string
    planName: string
    kind: 'monthly' | 'per-ticket'
    autoRenew: boolean
    priceIrr: number
  }) => void
  setAutoRenew: (modelId: string, autoRenew: boolean) => void
  addReview: (input: {
    modelId: string
    rating: number
    body: string
    author: string
  }) => void
  createConsumerTicket: (input: {
    modelId: string
    modelName: string
    subject: string
    body: string
  }) => string
  addComplaint: (input: {
    modelId: string
    modelName: string
    reason: string
    body: string
  }) => void
  /* Platform catalog */
  upsertService: (
    s: Omit<PlatformService, 'planCount' | 'updatedAt' | 'id'> & { id?: string },
  ) => void
  setServiceStatus: (id: string, status: PlatformService['status']) => void
  upsertServicePlan: (p: Omit<PlatformServicePlan, 'id'> & { id?: string }) => void
  updatePayoutRule: (serviceId: string, minAmountIrr: number, minDays: number) => void
  upsertSupportFrameworkField: (f: {
    id?: string
    label: string
    requiredPerService: boolean
    note: string
  }) => void
  resolvePlatformOrder: (orderId: string, paymentStatus: 'paid' | 'failed' | 'pending') => void
  /* Provisioning */
  upsertProvisionJob: (input: Partial<ProvisionJob> & { serviceName: string; versionLabel: string }) => string
  advanceProvisionJob: (id: string, status: ProvisionJob['status'], lastError?: string) => void
  /* Exceptions */
  createExceptionTicket: (input: {
    kind: ExceptionKind
    subject: string
    body: string
    requesterName: string
    requesterUserId: string
    invoiceImageDataUrl?: string
    invoiceFileName?: string
    targetPlanName?: string
    targetServiceName?: string
  }) => string
  updateExceptionTicket: (input: {
    id: string
    status?: ExceptionTicket['status']
    platformNote?: string
    accessGranted?: boolean
    manuallyActivate?: boolean
    reply?: string
  }) => void
  /* Creator */
  buyCreatorPlan: (input: {
    planId: string
    planName: string
    serviceName: string
    priceIrr: number
    capacitySummary: string
    buyerName: string
  }) => { ok: true; instanceId: string; pathSlug: string } | { ok: false; message: string }
  updateInstancePathSlug: (
    instanceId: string,
    pathSlug: string,
  ) => { ok: true } | { ok: false; message: string }
  createCreatorModel: (input: {
    name: string
    instanceId: string
    description: string
    baseIrr: number
    markupIrr: number
  }) => string
  updateCreatorModel: (input: {
    id: string
    name?: string
    publishStatus?: 'published' | 'draft'
    markupIrr?: number
    baseIrr?: number
  }) => void
  upsertCreatorSupportPlan: (input: Omit<CreatorSupportPlan, 'id'> & { id?: string }) => void
  requestCreatorPayout: (method: 'sheba' | 'wallet', amountIrr: number) => void
  updateCreatorTicketStatus: (
    id: string,
    status: 'open' | 'waiting' | 'closed',
  ) => void
  appendAudit: (action: string, entity: string, category: AuditCategory, actor?: string) => void
}

type AuditCategory = 'financial' | 'catalog' | 'identity'

const MockStoreContext = createContext<MockStore | null>(null)

const SCENARIO_WALLETS: Record<DemoWalletScenario, () => WalletState> = {
  healthy: () => ({
    ...INITIAL_WALLET,
    topUpHistory: [...INITIAL_WALLET.topUpHistory],
    activeReservations: [...INITIAL_WALLET.activeReservations],
  }),
  low: () => ({
    ...INITIAL_WALLET,
    postedIrr: 180_000,
    reservedIrr: 0,
    monthlySpentIrr: 4_200_000,
    activeReservations: [],
    topUpHistory: [...INITIAL_WALLET.topUpHistory],
  }),
  debt: () => ({
    ...INITIAL_WALLET,
    postedIrr: -45_000,
    reservedIrr: 0,
    monthlySpentIrr: 5_100_000,
    activeReservations: [],
    topUpHistory: [...INITIAL_WALLET.topUpHistory],
  }),
}

function loadState(): AppPersistedState {
  const saved = loadJson<AppPersistedState & { version?: number }>(STORAGE_KEY)
  if (saved) {
    if (saved.version === 4 && saved.services?.every((s) => s.baseByMeterIrr != null)) {
      return saved
    }
    return migrateLoadedState(saved as AppPersistedState)
  }
  const legacy = loadJson<AppPersistedState>(LEGACY_STORAGE_KEY)
  if (legacy) return migrateLoadedState(legacy)
  return createInitialAppState()
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppPersistedState>(() => loadState())

  useEffect(() => {
    saveJson(STORAGE_KEY, state)
  }, [state])

  const patch = useCallback((fn: (prev: AppPersistedState) => AppPersistedState) => {
    setState(fn)
  }, [])

  const appendAudit = useCallback(
    (action: string, entity: string, category: AuditCategory, actor = 'مدیرعامل پلتفرم نمونه') => {
      setState((prev) => ({
        ...prev,
        auditEvents: [
          {
            id: uid('aud'),
            at: nowLabel(),
            actor,
            action,
            entity,
            correlationId: uid('corr'),
            category,
          },
          ...prev.auditEvents,
        ],
      }))
    },
    [],
  )

  const resetDemoData = useCallback(() => {
    const next = createInitialAppState()
    setState(next)
    saveJson(STORAGE_KEY, next)
  }, [])

  const setWalletScenario = useCallback((s: DemoWalletScenario) => {
    setState((prev) => ({
      ...prev,
      walletScenario: s,
      wallet: SCENARIO_WALLETS[s](),
    }))
  }, [])

  const mockTopUp = useCallback((amountIrr: number) => {
    if (amountIrr <= 0) return
    setState((prev) => ({
      ...prev,
      walletScenario: 'healthy',
      wallet: {
        ...prev.wallet,
        postedIrr: prev.wallet.postedIrr + amountIrr,
        topUpHistory: [
          {
            id: uid('top'),
            amountIrr,
            at: nowLabel(),
            method: 'درگاه (دمو)',
          },
          ...prev.wallet.topUpHistory,
        ],
      },
    }))
  }, [])

  const debitWallet = useCallback((amountIrr: number, label = 'کسر مصرف (دمو)') => {
    if (amountIrr <= 0) return { ok: false as const, message: 'مبلغ نامعتبر' }
    let failed = false
    setState((prev) => {
      const avail = availableBalance(prev.wallet)
      if (avail < amountIrr) {
        failed = true
        return prev
      }
      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          postedIrr: prev.wallet.postedIrr - amountIrr,
          monthlySpentIrr: prev.wallet.monthlySpentIrr + amountIrr,
          topUpHistory: [
            {
              id: uid('deb'),
              amountIrr: -amountIrr,
              at: nowLabel(),
              method: label,
            },
            ...prev.wallet.topUpHistory,
          ],
        },
      }
    })
    if (failed) return { ok: false as const, message: 'موجودی کافی نیست' }
    return { ok: true as const }
  }, [])

  const updateWalletSettings = useCallback(
    (p: {
      lowBalanceThresholdIrr?: number
      monthlyBudgetCapIrr?: number | null
      budgetWarnPctSoft?: number
      budgetWarnPctElevated?: number
    }) => {
      setState((prev) => ({
        ...prev,
        wallet: { ...prev.wallet, ...p },
      }))
    },
    [],
  )

  const submitRequest = useCallback(
    (input: { modelId: string; question: string; docVersionId: string }) => {
      let result: { ok: true; requestId: string } | { ok: false; message: string } = {
        ok: false,
        message: 'خطا',
      }
      setState((prev) => {
        const model = prev.models.find((m) => m.id === input.modelId)
        if (!model) {
          result = { ok: false, message: 'مدل یافت نشد.' }
          return prev
        }
        if (model.supportRequired && model.supportPlanStatus === 'expired') {
          result = {
            ok: false,
            message: 'پلن پشتیبانی منقضی است — درخواست جدید فوراً مسدود است.',
          }
          return prev
        }
        const avail = availableBalance(prev.wallet)
        if (avail < 0) {
          result = { ok: false, message: 'بدهی کیف پول؛ تا تسویه مصرف جدید ممکن نیست.' }
          return prev
        }
        const { base, markup, total } = estimateCharge(model)
        if (avail < total) {
          result = {
            ok: false,
            message: 'موجودی برای رزرو تخمینی کافی نیست. کیف پول را شارژ کنید.',
          }
          return prev
        }
        if (
          prev.wallet.monthlyBudgetCapIrr != null &&
          prev.wallet.monthlySpentIrr + total > prev.wallet.monthlyBudgetCapIrr
        ) {
          result = { ok: false, message: 'سقف بودجه ماهانه پر شده است.' }
          return prev
        }
        const id = uid('req')
        const now = nowLabel()
        result = { ok: true, requestId: id }
        return {
          ...prev,
          requests: [
            {
              id,
              modelId: input.modelId,
              question: input.question.trim(),
              status: 'query-ready',
              createdAt: now,
              updatedAt: now,
              docVersionId: input.docVersionId,
              returnedQuery: buildMockQuery(input.question),
              deliveryNote:
                'رزرو انجام شد؛ کوئری آماده است. اجرا در نرم‌افزار محلی سازنده.',
              baseIrr: base,
              markupIrr: markup,
            },
            ...prev.requests,
          ],
          usage: [
            {
              id: uid('usg'),
              at: now,
              modelId: input.modelId,
              requestId: id,
              status: 'success',
              baseIrr: base,
              markupIrr: markup,
              snapshotRef: `snap-${input.docVersionId}-${id.slice(-4)}`,
              note: model.ownedByCurrentUser
                ? 'مصرف مدل خود — فقط قیمت پایه؛ حاشیه اعمال نشد'
                : undefined,
            },
            ...prev.usage,
          ],
          wallet: {
            ...prev.wallet,
            postedIrr: prev.wallet.postedIrr - total,
            monthlySpentIrr: prev.wallet.monthlySpentIrr + total,
          },
          creatorEarningsAvailableIrr:
            prev.creatorEarningsAvailableIrr + (model.ownedByCurrentUser ? 0 : markup),
          creatorEarnings:
            markup > 0 && !model.ownedByCurrentUser
              ? [
                  {
                    id: uid('earn'),
                    at: now,
                    source: 'usage-markup' as const,
                    label: `حاشیه مصرف — ${model.name}`,
                    amountIrr: markup,
                    ref: id,
                  },
                  ...prev.creatorEarnings,
                ]
              : prev.creatorEarnings,
        }
      })
      return result
    },
    [],
  )

  const markDelivered = useCallback((requestId: string) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'delivered' as const,
              updatedAt: nowLabel(),
              deliveryNote:
                'شبیه‌سازی: نرم‌افزار محلی سازنده کوئری را اجرا و نتیجه را تحویل داد.',
            }
          : r,
      ),
    }))
  }, [])

  const activateSupportPlan = useCallback(
    (input: {
      modelId: string
      planName: string
      kind: 'monthly' | 'per-ticket'
      autoRenew: boolean
      priceIrr: number
    }) => {
      setState((prev) => {
        const model = prev.models.find((m) => m.id === input.modelId)
        return {
          ...prev,
          models: prev.models.map((m) =>
            m.id === input.modelId
              ? {
                  ...m,
                  supportRequired: true,
                  supportPlanStatus: 'active' as const,
                  supportPlanName: input.planName,
                  supportExpiresAt: '۱۴۰۵/۰۲/۱۵',
                  autoRenew: input.kind === 'monthly' ? input.autoRenew : false,
                  inMyModels: true,
                }
              : m,
          ),
          consumerInvoices: [
            {
              id: uid('inv-c'),
              at: nowLabel(),
              modelName: model?.name ?? input.modelId,
              planName: input.planName,
              amountIrr: input.priceIrr,
              status: 'paid' as const,
            },
            ...prev.consumerInvoices,
          ],
          creatorEarningsAvailableIrr: prev.creatorEarningsAvailableIrr + input.priceIrr,
          creatorEarnings: [
            {
              id: uid('earn'),
              at: nowLabel(),
              source: 'support' as const,
              label: `فروش پلن پشتیبانی — ${input.planName}`,
              amountIrr: input.priceIrr,
              ref: uid('inv'),
            },
            ...prev.creatorEarnings,
          ],
        }
      })
    },
    [],
  )

  const setAutoRenew = useCallback((modelId: string, autoRenew: boolean) => {
    setState((prev) => ({
      ...prev,
      models: prev.models.map((m) => (m.id === modelId ? { ...m, autoRenew } : m)),
    }))
  }, [])

  const addReview = useCallback(
    (input: { modelId: string; rating: number; body: string; author: string }) => {
      setState((prev) => ({
        ...prev,
        models: prev.models.map((m) => {
          if (m.id !== input.modelId) return m
          const reviews = [
            {
              id: uid('rev'),
              author: input.author,
              rating: input.rating,
              at: nowLabel(),
              body: input.body,
            },
            ...m.reviews,
          ]
          const reviewCount = m.reviewCount + 1
          const rating =
            Math.round(
              ((m.rating * m.reviewCount + input.rating) / Math.max(reviewCount, 1)) * 10,
            ) / 10
          return { ...m, reviews, reviewCount, rating }
        }),
      }))
    },
    [],
  )

  const createConsumerTicket = useCallback(
    (input: { modelId: string; modelName: string; subject: string; body: string }) => {
      const id = uid('tkt-c')
      setState((prev) => ({
        ...prev,
        consumerTickets: [
          {
            id,
            modelId: input.modelId,
            modelName: input.modelName,
            subject: input.subject,
            status: 'open',
            createdAt: nowLabel(),
            updatedAt: nowLabel(),
            messages: [
              {
                id: uid('m'),
                from: 'consumer',
                at: nowLabel(),
                body: input.body,
              },
            ],
          },
          ...prev.consumerTickets,
        ],
        creatorTickets: [
          {
            id,
            modelName: input.modelName,
            consumerName: 'مصرف‌کننده',
            subject: input.subject,
            status: 'open',
            updatedAt: nowLabel(),
          },
          ...prev.creatorTickets,
        ],
      }))
      return id
    },
    [],
  )

  const addComplaint = useCallback(
    (input: { modelId: string; modelName: string; reason: string; body: string }) => {
      setState((prev) => ({
        ...prev,
        complaints: [
          {
            id: uid('cmp'),
            ...input,
            at: nowLabel(),
            status: 'submitted',
          },
          ...prev.complaints,
        ],
      }))
    },
    [],
  )

  const upsertService = useCallback(
    (s: Omit<PlatformService, 'planCount' | 'updatedAt' | 'id'> & { id?: string }) => {
      setState((prev) => {
        const id = s.id ?? uid('svc')
        const existing = prev.services.find((x) => x.id === id)
        const next: PlatformService = {
          id,
          name: s.name,
          status: s.status,
          description: s.description,
          meters: s.meters,
          baseByMeterIrr: { ...(s.baseByMeterIrr ?? {}) },
          basePriceIrr: s.basePriceIrr,
          planCount: existing?.planCount ?? 0,
          updatedAt: nowLabel(),
        }
        return {
          ...prev,
          services: existing
            ? prev.services.map((x) => (x.id === id ? next : x))
            : [next, ...prev.services],
          auditEvents: [
            {
              id: uid('aud'),
              at: nowLabel(),
              actor: 'مدیرعامل پلتفرم نمونه',
              action: existing ? 'ویرایش سرویس' : 'ایجاد سرویس',
              entity: `Service: ${s.name}`,
              correlationId: uid('corr'),
              category: 'catalog',
            },
            ...prev.auditEvents,
          ],
        }
      })
    },
    [],
  )

  const setServiceStatus = useCallback((id: string, status: PlatformService['status']) => {
    setState((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === id ? { ...s, status, updatedAt: nowLabel() } : s,
      ),
    }))
  }, [])

  const upsertServicePlan = useCallback(
    (p: Omit<PlatformServicePlan, 'id'> & { id?: string }) => {
      setState((prev) => {
        const id = p.id ?? uid('psp')
        const row: PlatformServicePlan = { ...p, id }
        const exists = prev.servicePlans.some((x) => x.id === id)
        const plans = exists
          ? prev.servicePlans.map((x) => (x.id === id ? row : x))
          : [row, ...prev.servicePlans]
        return {
          ...prev,
          servicePlans: plans,
          services: prev.services.map((s) =>
            s.id === p.serviceId
              ? {
                  ...s,
                  planCount: plans.filter((x) => x.serviceId === s.id).length,
                  updatedAt: nowLabel(),
                }
              : s,
          ),
        }
      })
    },
    [],
  )

  const updatePayoutRule = useCallback(
    (serviceId: string, minAmountIrr: number, minDays: number) => {
      setState((prev) => ({
        ...prev,
        payoutRules: prev.payoutRules.map((r) =>
          r.serviceId === serviceId ? { ...r, minAmountIrr, minDays } : r,
        ),
      }))
    },
    [],
  )

  const upsertSupportFrameworkField = useCallback(
    (f: { id?: string; label: string; requiredPerService: boolean; note: string }) => {
      setState((prev) => {
        const id = f.id ?? uid('f')
        const row = { id, label: f.label, requiredPerService: f.requiredPerService, note: f.note }
        const exists = prev.supportFrameworkFields.some((x) => x.id === id)
        return {
          ...prev,
          supportFrameworkFields: exists
            ? prev.supportFrameworkFields.map((x) => (x.id === id ? row : x))
            : [...prev.supportFrameworkFields, row],
        }
      })
    },
    [],
  )

  const resolvePlatformOrder = useCallback(
    (orderId: string, paymentStatus: 'paid' | 'failed' | 'pending') => {
      setState((prev) => ({
        ...prev,
        platformOrders: prev.platformOrders.map((o) =>
          o.id === orderId ? { ...o, paymentStatus } : o,
        ),
      }))
    },
    [],
  )

  const upsertProvisionJob = useCallback(
    (input: Partial<ProvisionJob> & { serviceName: string; versionLabel: string }) => {
      const id = input.id ?? uid('prov')
      const issuedSecret =
        input.connectionSecretOnce ??
        (input.status === 'draft' && !input.id
          ? `portfolio-sec-${Math.random().toString(36).slice(2, 10)}`
          : undefined)
      setState((prev) => {
        const existing = prev.provisionJobs.find((j) => j.id === id)
        const connectionId =
          input.connectionId ?? existing?.connectionId ?? `conn-${id.slice(-6)}`
        const row: ProvisionJob = {
          id,
          serviceName: input.serviceName,
          versionLabel: input.versionLabel,
          status: input.status ?? existing?.status ?? 'draft',
          createdAt: existing?.createdAt ?? nowLabel(),
          updatedAt: nowLabel(),
          baseUrl: input.baseUrl ?? existing?.baseUrl ?? input.endpoint ?? existing?.endpoint ?? '',
          endpoint:
            input.baseUrl ??
            input.endpoint ??
            existing?.baseUrl ??
            existing?.endpoint ??
            '',
          contractVersion:
            input.contractVersion ?? existing?.contractVersion ?? 'portfolio-integration-1',
          healthPath: input.healthPath ?? existing?.healthPath ?? '/health',
          connectionId,
          connectionSecretOnce:
            issuedSecret ?? existing?.connectionSecretOnce,
          timeoutSec: input.timeoutSec ?? existing?.timeoutSec ?? 30,
          environment: input.environment ?? existing?.environment ?? 'production',
          lastHealthAt: input.lastHealthAt ?? existing?.lastHealthAt,
          healthStatus: input.healthStatus ?? existing?.healthStatus ?? 'unknown',
          consumerSurface:
            input.consumerSurface ?? existing?.consumerSurface ?? 'api-key-only',
          region: input.region ?? existing?.region ?? 'تهران',
          apiMode:
            input.apiMode ??
            existing?.apiMode ??
            (input.consumerSurface === 'api-key-only' ? 'api-key-only' : 'interactive'),
          notes: input.notes ?? existing?.notes ?? '',
          lastError: input.lastError,
          blockHardDelete: input.blockHardDelete ?? existing?.blockHardDelete ?? false,
        }
        return {
          ...prev,
          provisionJobs: existing
            ? prev.provisionJobs.map((j) => (j.id === id ? row : j))
            : [row, ...prev.provisionJobs],
        }
      })
      return id
    },
    [],
  )

  const advanceProvisionJob = useCallback(
    (id: string, status: ProvisionJob['status'], lastError?: string) => {
      setState((prev) => ({
        ...prev,
        provisionJobs: prev.provisionJobs.map((j) =>
          j.id === id
            ? { ...j, status, updatedAt: nowLabel(), lastError: lastError ?? j.lastError }
            : j,
        ),
        auditEvents: [
          {
            id: uid('aud'),
            at: nowLabel(),
            actor: 'مدیرعامل پلتفرم نمونه',
            action: `وضعیت نصب سرویس → ${status}`,
            entity: `Provision: ${id}`,
            correlationId: uid('corr'),
            category: 'catalog',
          },
          ...prev.auditEvents,
        ],
      }))
    },
    [],
  )

  const createExceptionTicket = useCallback(
    (input: {
      kind: ExceptionKind
      subject: string
      body: string
      requesterName: string
      requesterUserId: string
      invoiceImageDataUrl?: string
      invoiceFileName?: string
      targetPlanName?: string
      targetServiceName?: string
    }) => {
      const id = uid('exc')
      setState((prev) => ({
        ...prev,
        exceptionTickets: [
          {
            id,
            kind: input.kind,
            subject: input.subject,
            body: input.body,
            requesterName: input.requesterName,
            requesterUserId: input.requesterUserId,
            status: 'open',
            createdAt: nowLabel(),
            updatedAt: nowLabel(),
            invoiceImageDataUrl: input.invoiceImageDataUrl,
            invoiceFileName: input.invoiceFileName,
            targetPlanName: input.targetPlanName,
            targetServiceName: input.targetServiceName,
            accessGranted: false,
            manuallyActivated: false,
            messages: [
              {
                id: uid('m'),
                from: 'user',
                at: nowLabel(),
                body: input.body,
              },
            ],
          },
          ...prev.exceptionTickets,
        ],
      }))
      return id
    },
    [],
  )

  const updateExceptionTicket = useCallback(
    (input: {
      id: string
      status?: ExceptionTicket['status']
      platformNote?: string
      accessGranted?: boolean
      manuallyActivate?: boolean
      reply?: string
    }) => {
      setState((prev) => {
        const ticket = prev.exceptionTickets.find((t) => t.id === input.id)
        if (!ticket) return prev

        let creatorInstances = prev.creatorInstances
        let creatorInvoices = prev.creatorInvoices
        let platformOrders = prev.platformOrders
        let models = prev.models

        if (input.manuallyActivate && ticket.targetPlanName) {
          const instanceId = uid('inst')
          const serviceName = ticket.targetServiceName ?? 'کوئری‌ساز'
          let pathSlug = suggestPathSlug(serviceName, instanceId)
          let n = 1
          while (prev.creatorInstances.some((i) => i.pathSlug === pathSlug)) {
            pathSlug = `${suggestPathSlug(serviceName, instanceId)}-${n++}`
          }
          const row: CreatorPlanInstance = {
            id: instanceId,
            serviceName,
            planName: ticket.targetPlanName,
            purchasedAt: nowLabel(),
            status: 'active',
            expiresAt: '۱۴۰۵/۰۶/۱۵',
            pathSlug,
          }
          creatorInstances = [row, ...prev.creatorInstances]
          creatorInvoices = [
            {
              id: uid('inv-cr'),
              at: nowLabel(),
              planName: `${ticket.targetPlanName} (فعال‌سازی دستی)`,
              amountIrr: 0,
              status: 'paid',
            },
            ...prev.creatorInvoices,
          ]
          platformOrders = [
            {
              id: uid('ord'),
              at: nowLabel(),
              buyer: ticket.requesterName,
              planName: `${ticket.targetPlanName} (دستی)`,
              amountIrr: 0,
              paymentStatus: 'paid',
            },
            ...prev.platformOrders,
          ]
        }

        if (input.accessGranted) {
          models = prev.models.map((m) =>
            m.inMyModels && m.supportRequired && m.supportPlanStatus === 'expired'
              ? {
                  ...m,
                  supportPlanStatus: 'active' as const,
                  supportExpiresAt: '۱۴۰۵/۰۱/۳۰',
                  supportPlanName: m.supportPlanName ?? 'پشتیبانی فعال‌شده دستی',
                }
              : m,
          )
        }

        return {
          ...prev,
          models,
          creatorInstances,
          creatorInvoices,
          platformOrders,
          exceptionTickets: prev.exceptionTickets.map((t) =>
            t.id === input.id
              ? {
                  ...t,
                  status: input.status ?? t.status,
                  platformNote: input.platformNote ?? t.platformNote,
                  accessGranted: input.accessGranted ?? t.accessGranted,
                  manuallyActivated: input.manuallyActivate
                    ? true
                    : t.manuallyActivated,
                  updatedAt: nowLabel(),
                  messages: input.reply
                    ? [
                        ...t.messages,
                        {
                          id: uid('m'),
                          from: 'platform' as const,
                          at: nowLabel(),
                          body: input.reply,
                        },
                      ]
                    : t.messages,
                }
              : t,
          ),
          auditEvents: [
            {
              id: uid('aud'),
              at: nowLabel(),
              actor: 'مدیرعامل پلتفرم نمونه',
              action: input.manuallyActivate
                ? 'فعال‌سازی دستی پلن'
                : input.accessGranted
                  ? 'اعطای دسترسی دمو'
                  : 'به‌روزرسانی تیکت استثنا',
              entity: `Exception: ${input.id}`,
              correlationId: uid('corr'),
              category: 'identity',
            },
            ...prev.auditEvents,
          ],
        }
      })
    },
    [],
  )

  const buyCreatorPlan = useCallback(
    (input: {
      planId: string
      planName: string
      serviceName: string
      priceIrr: number
      capacitySummary: string
      buyerName: string
    }) => {
      const instanceId = uid('inst')
      const pathSlug = suggestPathSlug(input.serviceName, instanceId)
      setState((prev) => {
        let slug = pathSlug
        let n = 1
        while (prev.creatorInstances.some((i) => i.pathSlug === slug)) {
          slug = `${pathSlug}-${n++}`
        }
        return {
          ...prev,
          creatorInstances: [
            {
              id: instanceId,
              serviceName: input.serviceName,
              planName: input.planName,
              purchasedAt: nowLabel(),
              status: 'active',
              expiresAt: '۱۴۰۵/۰۶/۱۵',
              pathSlug: slug,
            },
            ...prev.creatorInstances,
          ],
          creatorInvoices: [
            {
              id: uid('inv-cr'),
              at: nowLabel(),
              planName: input.planName,
              amountIrr: input.priceIrr,
              status: 'paid',
            },
            ...prev.creatorInvoices,
          ],
          platformOrders: [
            {
              id: uid('ord'),
              at: nowLabel(),
              buyer: input.buyerName,
              planName: input.planName,
              amountIrr: input.priceIrr,
              paymentStatus: 'paid',
            },
            ...prev.platformOrders,
          ],
        }
      })
      return { ok: true as const, instanceId, pathSlug }
    },
    [],
  )

  const updateInstancePathSlug = useCallback(
    (instanceId: string, pathSlug: string) => {
      const cleaned = pathSlug
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
      if (!cleaned || cleaned.length < 3) {
        return { ok: false as const, message: 'نامک حداقل ۳ کاراکتر لاتین/عدد باشد.' }
      }
      let conflict = false
      setState((prev) => {
        if (prev.creatorInstances.some((i) => i.pathSlug === cleaned && i.id !== instanceId)) {
          conflict = true
          return prev
        }
        return {
          ...prev,
          creatorInstances: prev.creatorInstances.map((i) =>
            i.id === instanceId ? { ...i, pathSlug: cleaned } : i,
          ),
        }
      })
      if (conflict) return { ok: false as const, message: 'این آدرس قبلاً گرفته شده است.' }
      return { ok: true as const }
    },
    [],
  )

  const createCreatorModel = useCallback(
    (input: {
      name: string
      instanceId: string
      description: string
      baseIrr: number
      markupIrr: number
    }) => {
      const id = uid('mdl')
      setState((prev) => {
        const catalogModel: Model = {
          id,
          name: input.name,
          creatorName: 'پیمانکار دمو',
          serviceCode: 'ERP-RB',
          serviceLabel: 'کوئری‌ساز',
          summary: input.description.slice(0, 120),
          description: input.description,
          rating: 0,
          reviewCount: 0,
          reviews: [],
          basePriceIrr: input.baseIrr,
          markupIrr: input.markupIrr,
          markupKind: 'fixed',
          supportRequired: false,
          supportPlanStatus: 'not-required',
          consumerSurface: 'api-key-only',
          apiKeyPlaceholder: `portfolio_live_••••••••${id.slice(-4)}`,
          inMyModels: false,
          ownedByCurrentUser: true,
          publishStatus: 'draft',
          docVersions: [
            {
              id: uid('ver'),
              label: 'نسخه دانش ۱.۰',
              productName: input.name,
              publishedAt: nowLabel(),
              status: 'draft',
              note: 'ایجادشده در دمو — پیش‌نویس تا انتشار صریح سازنده',
            },
          ],
        }
        const creatorRow: CreatorModelRow = {
          id,
          name: input.name,
          instanceId: input.instanceId,
          publishStatus: 'draft',
          hasSupportPlans: false,
          markupIrr: input.markupIrr,
          baseIrr: input.baseIrr,
          rating: 0,
          reviewCount: 0,
        }
        return {
          ...prev,
          models: [catalogModel, ...prev.models],
          creatorModels: [creatorRow, ...prev.creatorModels],
          creatorInstances: prev.creatorInstances.map((i) =>
            i.id === input.instanceId
              ? { ...i, linkedModelId: id, linkedModelName: input.name }
              : i,
          ),
        }
      })
      return id
    },
    [],
  )

  const updateCreatorModel = useCallback(
    (input: {
      id: string
      name?: string
      publishStatus?: 'published' | 'draft'
      markupIrr?: number
      baseIrr?: number
    }) => {
      setState((prev) => ({
        ...prev,
        creatorModels: prev.creatorModels.map((m) =>
          m.id === input.id
            ? {
                ...m,
                name: input.name ?? m.name,
                publishStatus: input.publishStatus ?? m.publishStatus,
                markupIrr: input.markupIrr ?? m.markupIrr,
                baseIrr: input.baseIrr ?? m.baseIrr,
              }
            : m,
        ),
        models: prev.models.map((m) =>
          m.id === input.id
            ? {
                ...m,
                name: input.name ?? m.name,
                markupIrr: input.markupIrr ?? m.markupIrr,
                basePriceIrr: input.baseIrr ?? m.basePriceIrr,
                publishStatus: input.publishStatus ?? m.publishStatus,
              }
            : m,
        ),
      }))
    },
    [],
  )

  const upsertCreatorSupportPlan = useCallback(
    (input: Omit<CreatorSupportPlan, 'id'> & { id?: string }) => {
      setState((prev) => {
        const id = input.id ?? uid('csp')
        const row = { ...input, id }
        const exists = prev.creatorSupportPlans.some((x) => x.id === id)
        const plans = exists
          ? prev.creatorSupportPlans.map((x) => (x.id === id ? row : x))
          : [row, ...prev.creatorSupportPlans]
        return {
          ...prev,
          creatorSupportPlans: plans,
          creatorModels: prev.creatorModels.map((m) =>
            m.id === input.modelId ? { ...m, hasSupportPlans: true } : m,
          ),
          models: prev.models.map((m) =>
            m.id === input.modelId
              ? {
                  ...m,
                  supportRequired: true,
                  supportPlanStatus:
                    m.supportPlanStatus === 'not-required' || m.supportPlanStatus === 'none'
                      ? ('none' as const)
                      : m.supportPlanStatus,
                }
              : m,
          ),
        }
      })
    },
    [],
  )

  const requestCreatorPayout = useCallback((method: 'sheba' | 'wallet', amountIrr: number) => {
    setState((prev) => {
      const amt = Math.min(amountIrr, prev.creatorEarningsAvailableIrr)
      if (amt <= 0) return prev
      return {
        ...prev,
        creatorEarningsAvailableIrr: prev.creatorEarningsAvailableIrr - amt,
        creatorPayouts: [
          {
            id: uid('po'),
            at: nowLabel(),
            method,
            amountIrr: amt,
            status: 'done',
          },
          ...prev.creatorPayouts,
        ],
        wallet:
          method === 'wallet'
            ? {
                ...prev.wallet,
                postedIrr: prev.wallet.postedIrr + amt,
                topUpHistory: [
                  {
                    id: uid('top'),
                    amountIrr: amt,
                    at: nowLabel(),
                    method: 'تبدیل از صندوق درآمد',
                  },
                  ...prev.wallet.topUpHistory,
                ],
              }
            : prev.wallet,
      }
    })
  }, [])

  const updateCreatorTicketStatus = useCallback(
    (id: string, status: 'open' | 'waiting' | 'closed') => {
      setState((prev) => ({
        ...prev,
        creatorTickets: prev.creatorTickets.map((t) =>
          t.id === id ? { ...t, status, updatedAt: nowLabel() } : t,
        ),
        consumerTickets: prev.consumerTickets.map((t) =>
          t.id === id ? { ...t, status, updatedAt: nowLabel() } : t,
        ),
      }))
    },
    [],
  )

  const value = useMemo<MockStore>(
    () => ({
      ...state,
      availableIrr: availableBalance(state.wallet),
      supportFrameworkGuidance: SUPPORT_FRAMEWORK.creatorGuidance,
      supportPricingModels: SUPPORT_FRAMEWORK.pricingModels,
      resetDemoData,
      setWalletScenario,
      mockTopUp,
      debitWallet,
      updateWalletSettings,
      submitRequest,
      markDelivered,
      activateSupportPlan,
      setAutoRenew,
      addReview,
      createConsumerTicket,
      addComplaint,
      upsertService,
      setServiceStatus,
      upsertServicePlan,
      updatePayoutRule,
      upsertSupportFrameworkField,
      resolvePlatformOrder,
      upsertProvisionJob,
      advanceProvisionJob,
      createExceptionTicket,
      updateExceptionTicket,
      buyCreatorPlan,
      updateInstancePathSlug,
      createCreatorModel,
      updateCreatorModel,
      upsertCreatorSupportPlan,
      requestCreatorPayout,
      updateCreatorTicketStatus,
      appendAudit,
    }),
    [
      state,
      resetDemoData,
      setWalletScenario,
      mockTopUp,
      debitWallet,
      updateWalletSettings,
      submitRequest,
      markDelivered,
      activateSupportPlan,
      setAutoRenew,
      addReview,
      createConsumerTicket,
      addComplaint,
      upsertService,
      setServiceStatus,
      upsertServicePlan,
      updatePayoutRule,
      upsertSupportFrameworkField,
      resolvePlatformOrder,
      upsertProvisionJob,
      advanceProvisionJob,
      createExceptionTicket,
      updateExceptionTicket,
      buyCreatorPlan,
      updateInstancePathSlug,
      createCreatorModel,
      updateCreatorModel,
      upsertCreatorSupportPlan,
      requestCreatorPayout,
      updateCreatorTicketStatus,
      appendAudit,
      patch,
    ],
  )

  return (
    <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>
  )
}

export function useMockStore() {
  const ctx = useContext(MockStoreContext)
  if (!ctx) throw new Error('useMockStore must be used within MockStoreProvider')
  return ctx
}
