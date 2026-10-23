import type { AppPersistedState } from './appState'
import { MODELS } from './models'
import { INITIAL_REQUESTS } from './requests'
import { INITIAL_USAGE, INITIAL_WALLET } from './wallet'
import {
  PLATFORM_SERVICES,
  PLATFORM_SERVICE_PLANS,
  SUPPORT_FRAMEWORK,
  PAYOUT_RULES,
  PLATFORM_ORDERS,
  AUDIT_EVENTS,
} from './platform'
import {
  CREATOR_INSTANCES,
  CREATOR_MODELS,
  CREATOR_SUPPORT_PLANS,
  CREATOR_EARNINGS,
  CREATOR_PAYOUTS,
  CREATOR_INVOICES,
  CREATOR_TICKETS,
  CREATOR_EARNINGS_SUMMARY,
} from './creator'
import { CONSUMER_INVOICES, SUPPORT_TICKETS } from './consumerExtras'
import type { ExceptionTicket, ProvisionJob } from './appState'

const SEED_EXCEPTIONS: ExceptionTicket[] = [
  {
    id: 'exc-01',
    kind: 'access',
    subject: 'عدم دسترسی به مدل پس از خرید پشتیبانی',
    body: 'پس از خرید پلن، دکمه درخواست همچنان غیرفعال است.',
    requesterName: 'پیمانکار دمو',
    requesterUserId: 'u-contractor',
    status: 'open',
    createdAt: '۱۴۰۴/۰۶/۲۰',
    updatedAt: '۱۴۰۴/۰۶/۲۰',
    accessGranted: false,
    messages: [
      {
        id: 'em1',
        from: 'user',
        at: '۱۴۰۴/۰۶/۲۰',
        body: 'لطفاً دسترسی مصرف را بررسی کنید.',
      },
    ],
  },
  {
    id: 'exc-02',
    kind: 'purchase-failed',
    subject: 'خرید پلن نقره‌ای ناموفق — درخواست فعال‌سازی دستی',
    body: 'پرداخت در درگاه قطع شد؛ رسید بانکی پیوست است.',
    requesterName: 'پیمانکار دمو',
    requesterUserId: 'u-contractor',
    status: 'open',
    createdAt: '۱۴۰۴/۰۶/۲۱',
    updatedAt: '۱۴۰۴/۰۶/۲۱',
    targetPlanName: 'پلن نقره‌ای',
    targetServiceName: 'کوئری‌ساز',
    manuallyActivated: false,
    messages: [
      {
        id: 'em2',
        from: 'user',
        at: '۱۴۰۴/۰۶/۲۱',
        body: 'تصویر فاکتور/رسید را بارگذاری کردم.',
      },
    ],
  },
]

const SEED_PROVISION: ProvisionJob[] = [
  {
    id: 'prov-01',
    serviceName: 'کوئری‌ساز',
    versionLabel: 'v1.2',
    status: 'active',
    createdAt: '۱۴۰۴/۰۵/۰۱',
    updatedAt: '۱۴۰۴/۰۵/۰۲',
    baseUrl: 'https://svc-report.portfolio.local',
    endpoint: 'https://svc-report.portfolio.local',
    contractVersion: 'portfolio-integration-1',
    healthPath: '/health',
    connectionId: 'conn-report-01',
    timeoutSec: 30,
    environment: 'production',
    lastHealthAt: 'همین الان (mock)',
    healthStatus: 'ok',
    consumerSurface: 'api-key-only',
    region: 'تهران',
    apiMode: 'api-key-only',
    notes: 'نصب دمو — فقط پلتفرم نمونه با رمز اتصال فراخوانی می‌کند',
    blockHardDelete: true,
  },
  {
    id: 'prov-02',
    serviceName: 'چت سازمانی',
    versionLabel: 'v0.1-draft',
    status: 'draft',
    createdAt: '۱۴۰۴/۰۶/۱۸',
    updatedAt: '۱۴۰۴/۰۶/۱۸',
    baseUrl: '',
    endpoint: '',
    contractVersion: 'portfolio-integration-1',
    healthPath: '/health',
    timeoutSec: 20,
    environment: 'staging',
    healthStatus: 'unknown',
    consumerSurface: 'hybrid',
    region: 'تهران',
    apiMode: 'interactive',
    notes: 'هنوز منتشر نشده',
    blockHardDelete: false,
  },
]

export function createInitialAppState(): AppPersistedState {
  return {
    version: 4,
    models: MODELS.map((m) => ({
      ...m,
      reviews: [...m.reviews],
      docVersions: [...m.docVersions],
    })),
    requests: [...INITIAL_REQUESTS],
    usage: [...INITIAL_USAGE],
    wallet: { ...INITIAL_WALLET, topUpHistory: [...INITIAL_WALLET.topUpHistory], activeReservations: [...INITIAL_WALLET.activeReservations] },
    walletScenario: 'healthy',
    consumerInvoices: [...CONSUMER_INVOICES],
    consumerTickets: SUPPORT_TICKETS.map((t) => ({
      ...t,
      messages: [...t.messages],
    })),
    services: PLATFORM_SERVICES.map((s) => ({
      ...s,
      meters: [...s.meters],
      baseByMeterIrr: { ...s.baseByMeterIrr },
    })),
    servicePlans: [...PLATFORM_SERVICE_PLANS],
    supportFrameworkFields: [...SUPPORT_FRAMEWORK.fields],
    payoutRules: [...PAYOUT_RULES],
    platformOrders: [...PLATFORM_ORDERS],
    auditEvents: [...AUDIT_EVENTS],
    provisionJobs: [...SEED_PROVISION],
    exceptionTickets: SEED_EXCEPTIONS.map((e) => ({
      ...e,
      messages: [...e.messages],
    })),
    creatorInstances: [...CREATOR_INSTANCES],
    creatorModels: [...CREATOR_MODELS],
    creatorSupportPlans: [...CREATOR_SUPPORT_PLANS],
    creatorEarnings: [...CREATOR_EARNINGS],
    creatorPayouts: [...CREATOR_PAYOUTS],
    creatorInvoices: [...CREATOR_INVOICES],
    creatorTickets: [...CREATOR_TICKETS],
    creatorEarningsAvailableIrr: CREATOR_EARNINGS_SUMMARY.availableIrr,
    complaints: [],
  }
}
