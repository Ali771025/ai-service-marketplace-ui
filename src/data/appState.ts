import type { Model, ReportRequest, UsageRow, WalletState, DemoWalletScenario } from './types'
import type {
  PlatformService,
  PlatformServicePlan,
  SupportFrameworkField,
  PayoutRule,
  PlatformOrder,
  AuditEvent,
} from './platform'
import type {
  CreatorPlanInstance,
  CreatorModelRow,
  CreatorSupportPlan,
  CreatorEarningRow,
  CreatorPayoutRow,
  CreatorInvoice,
  CreatorTicket,
} from './creator'
import type { ConsumerInvoice, SupportTicket } from './consumerExtras'

export type ExceptionKind =
  | 'access'
  | 'purchase-failed'
  | 'wallet-debt'
  | 'other'

export type ExceptionTicket = {
  id: string
  kind: ExceptionKind
  subject: string
  body: string
  requesterName: string
  requesterUserId: string
  status: 'open' | 'in-progress' | 'resolved' | 'rejected'
  createdAt: string
  updatedAt: string
  /** fake invoice image as data URL for purchase-failed */
  invoiceImageDataUrl?: string
  invoiceFileName?: string
  /** target plan / entitlement to activate manually */
  targetPlanName?: string
  targetServiceName?: string
  platformNote?: string
  /** mock flag set when platform grants access */
  accessGranted?: boolean
  /** set when platform manually activates entitlement */
  manuallyActivated?: boolean
  messages: { id: string; from: 'user' | 'platform'; at: string; body: string }[]
}

export type ProvisionJob = {
  id: string
  serviceName: string
  versionLabel: string
  status: 'draft' | 'installing' | 'active' | 'failed' | 'disabled'
  createdAt: string
  updatedAt: string
  /** آدرس پایه سرور سرویس (Remote) */
  baseUrl?: string
  /** @deprecated use baseUrl — نگه‌داشته برای سازگاری state قدیمی */
  endpoint?: string
  contractVersion?: string
  healthPath?: string
  connectionId?: string
  /** فقط یک‌بار پس از صدور نمایش داده می‌شود در UI */
  connectionSecretOnce?: string
  timeoutSec?: number
  environment?: 'staging' | 'production'
  lastHealthAt?: string
  healthStatus?: 'ok' | 'degraded' | 'down' | 'unknown'
  consumerSurface?: 'api-key-only' | 'embedded-ui' | 'hybrid'
  region?: string
  apiMode?: string
  notes?: string
  lastError?: string
  /** اگر پلن فعال دارد، حذف سخت ممنوع — فقط غیرفعال نرم */
  blockHardDelete?: boolean
}

export type AppPersistedState = {
  version: 4
  models: Model[]
  requests: ReportRequest[]
  usage: UsageRow[]
  wallet: WalletState
  walletScenario: DemoWalletScenario
  consumerInvoices: ConsumerInvoice[]
  consumerTickets: SupportTicket[]
  services: PlatformService[]
  servicePlans: PlatformServicePlan[]
  supportFrameworkFields: SupportFrameworkField[]
  payoutRules: PayoutRule[]
  platformOrders: PlatformOrder[]
  auditEvents: AuditEvent[]
  provisionJobs: ProvisionJob[]
  exceptionTickets: ExceptionTicket[]
  creatorInstances: CreatorPlanInstance[]
  creatorModels: CreatorModelRow[]
  creatorSupportPlans: CreatorSupportPlan[]
  creatorEarnings: CreatorEarningRow[]
  creatorPayouts: CreatorPayoutRow[]
  creatorInvoices: CreatorInvoice[]
  creatorTickets: CreatorTicket[]
  creatorEarningsAvailableIrr: number
  complaints: {
    id: string
    modelId: string
    modelName: string
    reason: string
    body: string
    at: string
    status: 'submitted' | 'reviewed'
  }[]
}
