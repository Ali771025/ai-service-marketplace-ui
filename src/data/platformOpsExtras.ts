/**
 * Seedهای نمایشی برای گسترش منوی اپراتور / حساب — بخشی OPEN یا «پیش‌نویس UX».
 * قوانین مالی ADR-010/011 را جعل نمی‌کند.
 */

export type AuditEntityType =
  | 'service'
  | 'plan'
  | 'user'
  | 'model'
  | 'wallet'
  | 'order'
  | 'ticket'

export type RichAuditEvent = {
  id: string
  at: string
  actor: string
  action: string
  entity: string
  entityType: AuditEntityType
  correlationId: string
  category: 'financial' | 'catalog' | 'identity' | 'ops'
  beforeJson?: string
  afterJson?: string
}

export const RICH_AUDIT_EVENTS: RichAuditEvent[] = [
  {
    id: 'raud-1',
    at: '۱۴۰۴/۰۶/۲۲ ۱۴:۱۲',
    actor: 'سارا اپراتور',
    action: 'به‌روزرسانی قیمت پایه',
    entity: 'Service: کوئری‌ساز',
    entityType: 'service',
    correlationId: 'corr-a91f',
    category: 'catalog',
    beforeJson: '{\n  "basePriceIrr": 75000\n}',
    afterJson: '{\n  "basePriceIrr": 80000\n}',
  },
  {
    id: 'raud-2',
    at: '۱۴۰۴/۰۶/۲۲ ۱۱:۰۵',
    actor: 'سیستم',
    action: 'تسویه قیمت پایه ثبت شد',
    entity: 'Ledger Entry LE-4421',
    entityType: 'wallet',
    correlationId: 'corr-b12c',
    category: 'financial',
    beforeJson: '{\n  "status": "reserved"\n}',
    afterJson: '{\n  "status": "settled",\n  "baseIrr": 12450\n}',
  },
  {
    id: 'raud-3',
    at: '۱۴۰۴/۰۶/۲۱ ۱۸:۴۰',
    actor: 'علی مدل‌ساز',
    action: 'خرید پلن سرویس',
    entity: 'Order ord-901',
    entityType: 'order',
    correlationId: 'corr-c77e',
    category: 'financial',
    afterJson: '{\n  "plan": "پلن طلایی",\n  "amountIrr": 42000000,\n  "paymentStatus": "paid"\n}',
  },
  {
    id: 'raud-4',
    at: '۱۴۰۴/۰۶/۲۰ ۰۹:۱۸',
    actor: 'سارا اپراتور',
    action: 'تعلیق سرویس',
    entity: 'Service: بینایی صنعتی',
    entityType: 'service',
    correlationId: 'corr-d04a',
    category: 'catalog',
    beforeJson: '{\n  "status": "published"\n}',
    afterJson: '{\n  "status": "suspended"\n}',
  },
  {
    id: 'raud-5',
    at: '۱۴۰۴/۰۶/۱۹ ۱۶:۲۲',
    actor: 'سیستم',
    action: 'ورود ناموفق (قفل موقت)',
    entity: 'Identity: unknown@example.invalid',
    entityType: 'user',
    correlationId: 'corr-e55b',
    category: 'identity',
  },
  {
    id: 'raud-6',
    at: '۱۴۰۴/۰۶/۱۸ ۱۲:۰۰',
    actor: 'پیمانکار دمو',
    action: 'ایجاد مدل روی نمونه',
    entity: 'Model: کوئری‌ساز نمونه',
    entityType: 'model',
    correlationId: 'corr-f81a',
    category: 'catalog',
    afterJson: '{\n  "pathSlug": "reporter-behsaz",\n  "status": "published"\n}',
  },
  {
    id: 'raud-7',
    at: '۱۴۰۴/۰۶/۱۷ ۰۸:۳۰',
    actor: 'سارا اپراتور',
    action: 'فعال‌سازی دستی entitlement',
    entity: 'Ticket exc-02',
    entityType: 'ticket',
    correlationId: 'corr-g22b',
    category: 'ops',
    beforeJson: '{\n  "manuallyActivated": false\n}',
    afterJson: '{\n  "manuallyActivated": true,\n  "status": "resolved"\n}',
  },
  {
    id: 'raud-8',
    at: '۱۴۰۴/۰۶/۱۶ ۱۵:۱۰',
    actor: 'مدیرعامل پلتفرم نمونه',
    action: 'تغییر ظرفیت پلن',
    entity: 'Plan: پلن نقره‌ای',
    entityType: 'plan',
    correlationId: 'corr-h33c',
    category: 'catalog',
    beforeJson: '{\n  "monthlyInvokes": 800\n}',
    afterJson: '{\n  "monthlyInvokes": 1000\n}',
  },
]

export type PlatformSupportTicket = {
  id: string
  subject: string
  requesterName: string
  status: 'open' | 'in-progress' | 'waiting' | 'resolved'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignee: string
  channel: 'platform-inbox' | 'exception' | 'complaint-escalation'
  relatedModelName?: string
  relatedCreatorName?: string
  createdAt: string
  updatedAt: string
  timeline: { id: string; at: string; actor: string; body: string }[]
}

export const PLATFORM_SUPPORT_TICKETS: PlatformSupportTicket[] = [
  {
    id: 'ptk-01',
    subject: 'سوال درباره امضای اتصال راه دور',
    requesterName: 'علی مدل‌ساز',
    status: 'in-progress',
    priority: 'normal',
    assignee: 'سارا اپراتور',
    channel: 'platform-inbox',
    createdAt: '۱۴۰۴/۰۶/۲۰',
    updatedAt: '۱۴۰۴/۰۶/۲۲',
    timeline: [
      {
        id: 'pt1',
        at: '۱۴۰۴/۰۶/۲۰ ۱۰:۰۰',
        actor: 'علی مدل‌ساز',
        body: 'پس از چرخش connection secret، health چک ۴۰۱ می‌دهد.',
      },
      {
        id: 'pt2',
        at: '۱۴۰۴/۰۶/۲۱ ۰۹:۱۵',
        actor: 'سارا اپراتور',
        body: 'نسخه قرارداد و clock skew را بررسی کردیم — در صف ارجاع فنی.',
      },
    ],
  },
  {
    id: 'ptk-02',
    subject: 'ارجاع تیکت مدل — عدم پاسخ مدل‌ساز',
    requesterName: 'مریم مصرف‌کننده',
    status: 'open',
    priority: 'high',
    assignee: 'بدون مسئول',
    channel: 'complaint-escalation',
    relatedModelName: 'کوئری‌ساز نمونه',
    relatedCreatorName: 'پیمانکار دمو',
    createdAt: '۱۴۰۴/۰۶/۲۱',
    updatedAt: '۱۴۰۴/۰۶/۲۱',
    timeline: [
      {
        id: 'pt3',
        at: '۱۴۰۴/۰۶/۲۱ ۱۶:۴۰',
        actor: 'مریم مصرف‌کننده',
        body: 'تیکت مدل ۴۸ ساعت بدون پاسخ؛ شکایت ثبت شد و به صف پلتفرم ارجاع شد.',
      },
    ],
  },
  {
    id: 'ptk-03',
    subject: 'درخواست مشاهده وضعیت نصب سرویس',
    requesterName: 'استودیو داده پارس',
    status: 'waiting',
    priority: 'low',
    assignee: 'سارا اپراتور',
    channel: 'platform-inbox',
    createdAt: '۱۴۰۴/۰۶/۱۸',
    updatedAt: '۱۴۰۴/۰۶/۱۹',
    timeline: [
      {
        id: 'pt4',
        at: '۱۴۰۴/۰۶/۱۸ ۱۱:۲۰',
        actor: 'استودیو داده پارس',
        body: 'آیا نصب کوئری‌ساز روی محیط آزمایشی آماده است؟',
      },
      {
        id: 'pt5',
        at: '۱۴۰۴/۰۶/۱۹ ۱۴:۰۰',
        actor: 'سارا اپراتور',
        body: 'منتظر تأیید health از تیم نصب — وضعیت به «در انتظار» رفت.',
      },
    ],
  },
  {
    id: 'ptk-04',
    subject: 'پیگیری استثنای خرید ناموفق',
    requesterName: 'پیمانکار دمو',
    status: 'resolved',
    priority: 'urgent',
    assignee: 'مدیرعامل پلتفرم نمونه',
    channel: 'exception',
    createdAt: '۱۴۰۴/۰۶/۱۹',
    updatedAt: '۱۴۰۴/۰۶/۲۰',
    timeline: [
      {
        id: 'pt6',
        at: '۱۴۰۴/۰۶/۱۹ ۱۷:۰۰',
        actor: 'سیستم',
        body: 'لینک از صندوق استثناها (exc-02) ساخته شد.',
      },
      {
        id: 'pt7',
        at: '۱۴۰۴/۰۶/۲۰ ۱۰:۳۰',
        actor: 'مدیرعامل پلتفرم نمونه',
        body: 'فعال‌سازی دستی انجام و تیکت بسته شد.',
      },
    ],
  },
]

export type DirectoryUser = {
  id: string
  displayName: string
  email: string
  roles: ('consumer' | 'creator' | 'platform')[]
  status: 'active' | 'suspended' | 'invited'
  orgName?: string
  lastSeen: string
}

export const DIRECTORY_USERS: DirectoryUser[] = [
  {
    id: 'u-ceo',
    displayName: 'مدیرعامل پلتفرم نمونه',
    email: 'ceo@example.invalid',
    roles: ['platform'],
    status: 'active',
    lastSeen: 'امروز',
  },
  {
    id: 'u-contractor',
    displayName: 'پیمانکار دمو',
    email: 'contractor@example.invalid',
    roles: ['consumer', 'creator'],
    status: 'active',
    orgName: 'سازمان نمونه (دمو)',
    lastSeen: 'دیروز',
  },
  {
    id: 'u-user',
    displayName: 'کاربر ثبت‌نام‌شده',
    email: 'user@example.invalid',
    roles: ['consumer', 'creator'],
    status: 'active',
    lastSeen: '۳ روز پیش',
  },
  {
    id: 'u-consumer-only',
    displayName: 'مریم (فقط مصرف)',
    email: 'consumer@example.invalid',
    roles: ['consumer'],
    status: 'active',
    lastSeen: '۵ روز پیش',
  },
  {
    id: 'u-creator-only',
    displayName: 'علی (فقط مدل‌ساز)',
    email: 'creator@example.invalid',
    roles: ['creator'],
    status: 'active',
    orgName: 'نوآوران ابری',
    lastSeen: 'هفته پیش',
  },
  {
    id: 'u-inv-01',
    displayName: 'مهمان دعوت‌شده',
    email: 'guest@example.invalid',
    roles: ['consumer'],
    status: 'invited',
    orgName: 'سازمان نمونه (دمو)',
    lastSeen: '—',
  },
  {
    id: 'u-sus-01',
    displayName: 'حساب تعلیق‌شده',
    email: 'blocked@example.invalid',
    roles: ['consumer'],
    status: 'suspended',
    lastSeen: '۱۴۰۴/۰۴/۰۱',
  },
]

/** پیش‌نویس UX — جزئیات اشتراک سازمان OPEN است */
export type OrgPeerMember = {
  id: string
  displayName: string
  email: string
  role: 'admin' | 'viewer'
  status: 'active' | 'invited'
  invitedAt: string
}

export const ORG_PEER_MEMBERS: OrgPeerMember[] = [
  {
    id: 'peer-1',
    displayName: 'پیمانکار دمو',
    email: 'contractor@example.invalid',
    role: 'admin',
    status: 'active',
    invitedAt: '۱۴۰۴/۰۵/۰۱',
  },
  {
    id: 'peer-2',
    displayName: 'ناظر مالی',
    email: 'finance@example.invalid',
    role: 'viewer',
    status: 'active',
    invitedAt: '۱۴۰۴/۰۵/۱۲',
  },
  {
    id: 'peer-3',
    displayName: 'همکار پشتیبانی',
    email: 'support@example.invalid',
    role: 'viewer',
    status: 'invited',
    invitedAt: '۱۴۰۴/۰۶/۱۸',
  },
]

export type OperationalReportKind =
  | 'top-services'
  | 'models-per-service'
  | 'slug-models'
  | 'top-request-models'
  | 'top-token-models'

export const OPERATIONAL_REPORT_META: {
  id: OperationalReportKind
  title: string
  note: string
}[] = [
  {
    id: 'top-services',
    title: 'پرکاربردترین سرویس‌ها',
    note: 'Confirmed نیاز · فرمول «استفاده» هنوز OPEN',
  },
  {
    id: 'models-per-service',
    title: 'تعداد مدل per سرویس',
    note: 'Confirmed نیاز',
  },
  {
    id: 'slug-models',
    title: 'مدل‌ها با آدرس اختصاصی (pathSlug)',
    note: 'Confirmed نیاز',
  },
  {
    id: 'top-request-models',
    title: 'مدل با بیشترین درخواست',
    note: 'Confirmed نیاز · شمارش درخواست در بازه',
  },
  {
    id: 'top-token-models',
    title: 'مدل با بیشترین مصرف توکن',
    note: 'نیاز تأییدشده · مترهایی مثل توکن',
  },
]

export type OpsReportRow = {
  label: string
  value: string
  secondary?: string
  /** تاریخ نمونه برای فیلتر بازه */
  at: string
}

export const OPS_REPORT_ROWS: Record<OperationalReportKind, OpsReportRow[]> = {
  'top-services': [
    { label: 'کوئری‌ساز', value: '۴۱۲ تسویه', secondary: 'نمونه متریک باز', at: '۱۴۰۴/۱۲/۲۲' },
    { label: 'تحلیل اسناد', value: '۱۸۸ تسویه', secondary: 'نمونه متریک باز', at: '۱۴۰۴/۱۲/۲۰' },
    { label: 'بینایی صنعتی', value: '۲۴ تسویه', secondary: 'نمونه متریک باز', at: '۱۴۰۴/۱۲/۱۵' },
    { label: 'چت سازمانی', value: '۱۲ تسویه', secondary: 'حجم کم', at: '۱۴۰۴/۱۱/۲۸' },
  ],
  'models-per-service': [
    { label: 'کوئری‌ساز', value: '۳۶ مدل', at: '۱۴۰۴/۱۲/۲۲' },
    { label: 'تحلیل اسناد', value: '۹ مدل', at: '۱۴۰۴/۱۲/۱۸' },
    { label: 'بینایی صنعتی', value: '۳ مدل', at: '۱۴۰۴/۱۲/۱۰' },
    { label: 'چت سازمانی', value: '۱ مدل', at: '۱۴۰۴/۱۱/۲۵' },
  ],
  'slug-models': [
    {
      label: 'reporter-behsaz',
      value: 'کوئری‌ساز نمونه',
      secondary: '/service/reporter-behsaz',
      at: '۱۴۰۴/۱۲/۲۱',
    },
    {
      label: 'doc-pars',
      value: 'تحلیل‌گر پارس',
      secondary: '/service/doc-pars',
      at: '۱۴۰۴/۱۲/۱۹',
    },
    {
      label: 'vision-line1',
      value: 'ویژن خط ۱',
      secondary: '/service/vision-line1',
      at: '۱۴۰۴/۱۲/۰۵',
    },
  ],
  'top-request-models': [
    { label: 'کوئری‌ساز نمونه', value: '۱۸۴ درخواست', at: '۱۴۰۴/۱۲/۲۲' },
    { label: 'تحلیل‌گر پارس', value: '۹۲ درخواست', at: '۱۴۰۴/۱۲/۲۰' },
    { label: 'ویژن خط ۱', value: '۴۱ درخواست', at: '۱۴۰۴/۱۲/۱۲' },
    { label: 'چت پیش‌نویس', value: '۸ درخواست', at: '۱۴۰۴/۱۱/۳۰' },
  ],
  'top-token-models': [
    { label: 'کوئری‌ساز نمونه', value: '۱۲٫۴ میلیون توکن', at: '۱۴۰۴/۱۲/۲۲' },
    { label: 'تحلیل‌گر پارس', value: '۳٫۱ میلیون توکن', at: '۱۴۰۴/۱۲/۱۹' },
    { label: 'ویژن خط ۱', value: '۰٫۴ میلیون توکن', at: '۱۴۰۴/۱۲/۰۸' },
    { label: 'حساب‌یار', value: '۲٫۱ میلیون توکن', at: '۱۴۰۴/۱۲/۱۶' },
  ],
}

export type ManifestVersionRow = {
  id: string
  serviceName: string
  versionLabel: string
  contractVersion: string
  status: 'published' | 'draft' | 'retired'
  metersSummary: string
  updatedAt: string
}

export const MANIFEST_VERSIONS: ManifestVersionRow[] = [
  {
    id: 'mv-1',
    serviceName: 'کوئری‌ساز',
    versionLabel: 'v1.2',
    contractVersion: 'portfolio-integration-1',
    status: 'published',
    metersSummary: 'توکن',
    updatedAt: '۱۴۰۴/۰۵/۰۲',
  },
  {
    id: 'mv-2',
    serviceName: 'کوئری‌ساز',
    versionLabel: 'v1.1',
    contractVersion: 'portfolio-integration-1',
    status: 'retired',
    metersSummary: 'توکن',
    updatedAt: '۱۴۰۴/۰۳/۱۰',
  },
  {
    id: 'mv-3',
    serviceName: 'تحلیل اسناد',
    versionLabel: 'v1.0',
    contractVersion: 'portfolio-integration-1',
    status: 'published',
    metersSummary: 'بدون متر مصرف',
    updatedAt: '۱۴۰۴/۰۵/۲۸',
  },
  {
    id: 'mv-4',
    serviceName: 'چت سازمانی',
    versionLabel: 'v0.1-draft',
    contractVersion: 'portfolio-integration-1',
    status: 'draft',
    metersSummary: 'درخواست',
    updatedAt: '۱۴۰۴/۰۶/۱۸',
  },
]

/** خلاصه مصرف فضای مدل — mock نمایشی */
export const MODEL_USAGE_SUMMARY: Record<
  string,
  { invokesMonth: number; tokensMonth: number; spendIrrApprox: number; lastInvokeAt: string }
> = {
  default: {
    invokesMonth: 42,
    tokensMonth: 128_400,
    spendIrrApprox: 1_850_000,
    lastInvokeAt: '۱۴۰۴/۱۲/۲۲',
  },
}

/**
 * متریک اجرای Remote برای اپراتور (#۱۱ Gaps) — Observability، نه درآمد Base و نه Audit دامنه.
 * مرجع: Reporting · Integration Confirmed §۱۰ · Observability
 */
export type ExecutionMetricHealth = 'ok' | 'degraded' | 'down' | 'unknown'

export type RemoteExecutionMetric = {
  id: string
  serviceName: string
  connectionId: string
  environment: 'production' | 'staging'
  /** تعداد Invoke در بازهٔ نمایشی */
  invokeTotal: number
  successCount: number
  failCount: number
  /** میلی‌ثانیه */
  latencyP50Ms: number
  latencyP95Ms: number
  /** خطاهای نبض / health در بازه */
  healthErrorCount: number
  /** میانگین retry قبل از ثبت تیکت / آزادسازی رزرو (mock) */
  avgRetriesBeforeTicket: number
  healthStatus: ExecutionMetricHealth
  lastSampleAt: string
  note?: string
}

export const REMOTE_EXECUTION_METRICS: RemoteExecutionMetric[] = [
  {
    id: 'xem-1',
    serviceName: 'کوئری‌ساز',
    connectionId: 'conn-rb-prod',
    environment: 'production',
    invokeTotal: 1840,
    successCount: 1792,
    failCount: 48,
    latencyP50Ms: 420,
    latencyP95Ms: 1180,
    healthErrorCount: 2,
    avgRetriesBeforeTicket: 1.4,
    healthStatus: 'ok',
    lastSampleAt: '۱۴۰۴/۱۲/۲۲ ۱۴:۵۰',
  },
  {
    id: 'xem-2',
    serviceName: 'تحلیل اسناد',
    connectionId: 'conn-doc-prod',
    environment: 'production',
    invokeTotal: 612,
    successCount: 548,
    failCount: 64,
    latencyP50Ms: 890,
    latencyP95Ms: 2400,
    healthErrorCount: 11,
    avgRetriesBeforeTicket: 2.1,
    healthStatus: 'degraded',
    lastSampleAt: '۱۴۰۴/۱۲/۲۲ ۱۴:۴۸',
    note: 'نرخ خطا و P95 بالا — قبل از تیکت معمولاً ۲ retry',
  },
  {
    id: 'xem-3',
    serviceName: 'بینایی صنعتی',
    connectionId: 'conn-vis-stg',
    environment: 'staging',
    invokeTotal: 96,
    successCount: 71,
    failCount: 25,
    latencyP50Ms: 610,
    latencyP95Ms: 3100,
    healthErrorCount: 18,
    avgRetriesBeforeTicket: 2.0,
    healthStatus: 'down',
    lastSampleAt: '۱۴۰۴/۱۲/۱۵ ۱۳:۱۰',
    note: 'قطع مکرر health — قاعده «سرویس جواب ندهد»',
  },
  {
    id: 'xem-4',
    serviceName: 'چت سازمانی',
    connectionId: 'conn-chat-draft',
    environment: 'staging',
    invokeTotal: 12,
    successCount: 12,
    failCount: 0,
    latencyP50Ms: 210,
    latencyP95Ms: 480,
    healthErrorCount: 0,
    avgRetriesBeforeTicket: 0,
    healthStatus: 'unknown',
    lastSampleAt: '۱۴۰۴/۱۱/۲۸ ۰۹:۰۰',
    note: 'نصب پیش‌نویس — نمونه کم',
  },
]
