import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../../data/MockStore'
import {
  DIRECTORY_USERS,
  MANIFEST_VERSIONS,
  OPERATIONAL_REPORT_META,
  OPS_REPORT_ROWS,
  ORG_PEER_MEMBERS,
  PLATFORM_SUPPORT_TICKETS,
  REMOTE_EXECUTION_METRICS,
  RICH_AUDIT_EVENTS,
  type AuditEntityType,
  type ExecutionMetricHealth,
  type OperationalReportKind,
  type OrgPeerMember,
  type PlatformSupportTicket,
} from '../../data/platformOpsExtras'
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  StatusBanner,
  Tabs,
} from '../../components/ui/Primitives'
import { ReportFilterBar } from '../../components/ReportFilterBar'
import { formatIrr } from '../../lib/format'
import {
  defaultReportDateFilter,
  isAtInDateFilter,
  periodLabelForFilter,
} from '../../lib/reportFilters'

const PRIORITY_LABEL: Record<PlatformSupportTicket['priority'], string> = {
  low: 'کم',
  normal: 'عادی',
  high: 'بالا',
  urgent: 'فوری',
}

const STATUS_LABEL: Record<PlatformSupportTicket['status'], string> = {
  open: 'باز',
  'in-progress': 'در حال بررسی',
  waiting: 'در انتظار',
  resolved: 'حل‌شده',
}

const ENTITY_LABEL: Record<AuditEntityType, string> = {
  service: 'سرویس',
  plan: 'پلن',
  user: 'کاربر',
  model: 'مدل',
  wallet: 'کیف پول',
  order: 'سفارش',
  ticket: 'تیکت',
}

function toneForTicketStatus(s: PlatformSupportTicket['status']) {
  if (s === 'resolved') return 'ok' as const
  if (s === 'waiting') return 'muted' as const
  if (s === 'in-progress') return 'warn' as const
  return 'info' as const
}

/** صف تیکت‌های پلتفرم + ارجاع به مدل‌ساز — مکمل صندوق استثناها */
export function PlatformTicketsQueuePage() {
  const [status, setStatus] = useState<'all' | PlatformSupportTicket['status']>('all')
  const [priority, setPriority] = useState<'all' | PlatformSupportTicket['priority']>('all')
  const [assignee, setAssignee] = useState('all')
  const [selectedId, setSelectedId] = useState(PLATFORM_SUPPORT_TICKETS[0]?.id ?? '')

  const assignees = useMemo(
    () => ['all', ...Array.from(new Set(PLATFORM_SUPPORT_TICKETS.map((t) => t.assignee)))],
    [],
  )

  const rows = useMemo(
    () =>
      PLATFORM_SUPPORT_TICKETS.filter((t) => {
        if (status !== 'all' && t.status !== status) return false
        if (priority !== 'all' && t.priority !== priority) return false
        if (assignee !== 'all' && t.assignee !== assignee) return false
        return true
      }),
    [status, priority, assignee],
  )

  const selected = PLATFORM_SUPPORT_TICKETS.find((t) => t.id === selectedId) ?? rows[0]

  return (
    <div>
      <PageHeader
        eyebrow="پشتیبانی"
        title="صف تیکت پشتیبانی"
        description="صندوق پشتیبانی سطح پلتفرم نمونه — جدا از تیکت مدل‌ساز؛ ارجاع و شکایت قابل پیگیری است"
      />
      <StatusBanner tone="info">
        استثناهای entitlement را در{' '}
        <Link to="/platform/exceptions">صندوق استثناها</Link> ببینید. این صف برای پشتیبانی عمومی و
        ارجاع تیکت مدل است.
      </StatusBanner>
      <div className="filter-bar panel">
        <div className="field" style={{ maxWidth: 180 }}>
          <label htmlFor="pt-st">وضعیت</label>
          <select
            id="pt-st"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">همه</option>
            <option value="open">باز</option>
            <option value="in-progress">در حال بررسی</option>
            <option value="waiting">در انتظار</option>
            <option value="resolved">حل‌شده</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="pt-pr">اولویت</label>
          <select
            id="pt-pr"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
          >
            <option value="all">همه</option>
            <option value="urgent">فوری</option>
            <option value="high">بالا</option>
            <option value="normal">عادی</option>
            <option value="low">کم</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label htmlFor="pt-as">مسئول</label>
          <select
            id="pt-as"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a === 'all' ? 'همه' : a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="تیکتی با این فیلتر نیست" hint="فیلتر را باز کنید یا صف استثناها را ببینید." />
      ) : (
        <div className="detail-grid two">
          <section className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>موضوع</th>
                  <th>اولویت</th>
                  <th>مسئول</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      cursor: 'pointer',
                      background: selected?.id === t.id ? 'var(--primary-soft)' : undefined,
                    }}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <td>
                      {t.subject}
                      <div className="meta">{t.requesterName}</div>
                    </td>
                    <td>
                      <StatusBadge
                        tone={
                          t.priority === 'urgent' || t.priority === 'high' ? 'danger' : 'muted'
                        }
                      >
                        {PRIORITY_LABEL[t.priority]}
                      </StatusBadge>
                    </td>
                    <td className="meta">{t.assignee}</td>
                    <td>
                      <StatusBadge tone={toneForTicketStatus(t.status)}>
                        {STATUS_LABEL[t.status]}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {selected ? (
            <section className="panel stack drawer-panel">
              <h2 className="panel-title">{selected.subject}</h2>
              <p className="meta" style={{ margin: 0 }}>
                {selected.id} · کانال:{' '}
                {selected.channel === 'exception'
                  ? 'استثنا'
                  : selected.channel === 'complaint-escalation'
                    ? 'ارجاع شکایت / مدل'
                    : 'صندوق پلتفرم'}
              </p>
              {selected.relatedModelName ? (
                <StatusBanner tone="warn">
                  ارجاع به تیکت مدل «{selected.relatedModelName}» — مدل‌ساز:{' '}
                  {selected.relatedCreatorName ?? '—'}
                </StatusBanner>
              ) : null}
              <h3 className="panel-title" style={{ fontSize: '0.95rem' }}>
                تایم‌لاین
              </h3>
              {selected.timeline.map((m) => (
                <div key={m.id} className="ticket-msg">
                  <div className="meta">
                    {m.actor} · {m.at}
                  </div>
                  <p style={{ margin: '0.25rem 0 0' }}>{m.body}</p>
                </div>
              ))}
              <div className="btn-row">
                <button type="button" className="btn btn-secondary btn-sm" disabled>
                  ارجاع به مدل‌ساز (mock)
                </button>
                <Link className="btn btn-ghost btn-sm" to="/platform/exceptions">
                  باز کردن استثناها
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function PlatformUsersPage() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<'all' | 'consumer' | 'creator' | 'platform'>('all')
  const [status, setStatus] = useState<'all' | 'active' | 'suspended' | 'invited'>('all')

  const rows = useMemo(
    () =>
      DIRECTORY_USERS.filter((u) => {
        if (role !== 'all' && !u.roles.includes(role)) return false
        if (status !== 'all' && u.status !== status) return false
        const hay = `${u.displayName} ${u.email} ${u.orgName ?? ''}`.toLowerCase()
        if (q.trim() && !hay.includes(q.trim().toLowerCase())) return false
        return true
      }),
    [q, role, status],
  )

  return (
    <div>
      <PageHeader
        eyebrow="هویت"
        title="مدیریت کاربران"
        description="فهرست IAM-lite — نقش‌های مصرف‌کننده / مدل‌ساز / پلتفرم · مدیریت پیشرفته سازمان OPEN"
      />
      <div className="filter-bar panel">
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <label htmlFor="uq">جستجو</label>
          <input
            id="uq"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="نام، ایمیل، سازمان…"
          />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="ur">نقش</label>
          <select id="ur" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="all">همه</option>
            <option value="consumer">مصرف‌کننده</option>
            <option value="creator">مدل‌ساز</option>
            <option value="platform">پلتفرم</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="us">وضعیت</label>
          <select
            id="us"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">همه</option>
            <option value="active">فعال</option>
            <option value="invited">دعوت‌شده</option>
            <option value="suspended">تعلیق</option>
          </select>
        </div>
      </div>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>کاربر</th>
              <th>نقش‌ها</th>
              <th>سازمان</th>
              <th>وضعیت</th>
              <th>آخرین فعالیت</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.displayName}
                  <div className="meta mono">{u.email}</div>
                </td>
                <td>
                  <div className="badge-row">
                    {u.roles.map((r) => (
                      <StatusBadge key={r} tone={r === 'platform' ? 'info' : 'muted'}>
                        {r === 'consumer' ? 'مصرف' : r === 'creator' ? 'مدل‌ساز' : 'پلتفرم'}
                      </StatusBadge>
                    ))}
                  </div>
                </td>
                <td className="meta">{u.orgName ?? '—'}</td>
                <td>
                  <StatusBadge
                    tone={
                      u.status === 'active' ? 'ok' : u.status === 'invited' ? 'warn' : 'danger'
                    }
                  >
                    {u.status === 'active'
                      ? 'فعال'
                      : u.status === 'invited'
                        ? 'دعوت‌شده'
                        : 'تعلیق'}
                  </StatusBadge>
                </td>
                <td className="meta">{u.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <EmptyState title="کاربری یافت نشد" /> : null}
      </div>
    </div>
  )
}

export function PlatformOrgPeersPage() {
  const [members, setMembers] = useState<OrgPeerMember[]>(ORG_PEER_MEMBERS)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')

  return (
    <div>
      <PageHeader
        eyebrow="هویت"
        title="اعضای سازمان"
        description="پیش‌نویس UX / مطابق الگو — جزئیات اشتراک سازمان و صندلی‌ها هنوز OPEN است"
      />
      <StatusBanner tone="warn">
        برچسب دمو: دعوت و نقش admin/viewer فقط mock است و تعهد محصولی ایجاد نمی‌کند.
      </StatusBanner>
      <div className="detail-grid two">
        <section className="panel stack">
          <h2 className="panel-title">دعوت عضو (mock)</h2>
          <div className="field">
            <label htmlFor="inv-email">ایمیل</label>
            <input
              id="inv-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.invalid"
            />
          </div>
          <div className="field">
            <label htmlFor="inv-role">نقش</label>
            <select
              id="inv-role"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
            >
              <option value="viewer">ناظر (viewer)</option>
              <option value="admin">مدیر (admin)</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!email.trim()) return
              setMembers((prev) => [
                ...prev,
                {
                  id: `peer-${Date.now()}`,
                  displayName: email.trim().split('@')[0] ?? 'عضو',
                  email: email.trim(),
                  role,
                  status: 'invited',
                  invitedAt: 'امروز (mock)',
                },
              ])
              setEmail('')
            }}
          >
            ارسال دعوت
          </button>
        </section>
        <section className="panel table-wrap">
          <h2 className="panel-title">اعضای سازمان نمونه (دمو)</h2>
          <table className="data">
            <thead>
              <tr>
                <th>عضو</th>
                <th>نقش</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.displayName}
                    <div className="meta mono">{m.email}</div>
                  </td>
                  <td>
                    <StatusBadge tone={m.role === 'admin' ? 'info' : 'muted'}>
                      {m.role === 'admin' ? 'admin' : 'viewer'}
                    </StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={m.status === 'active' ? 'ok' : 'warn'}>
                      {m.status === 'active' ? 'فعال' : 'دعوت‌شده'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

/** نمای کلی پلن‌ها — لینک به هاب سرویس، نه پراکندگی تنظیمات */
export function PlatformPlansOverviewPage() {
  const { servicePlans, services } = useMockStore()
  const [svc, setSvc] = useState('all')

  const rows = servicePlans.filter((p) => (svc === 'all' ? true : p.serviceId === svc))

  return (
    <div>
      <PageHeader
        eyebrow="کاتالوگ"
        title="فهرست پلن‌ها"
        description="مشاهده پلن‌های ظرفیت — تعریف و ویرایش ظرفیت داخل هاب همان سرویس"
      />
      <StatusBanner tone="info">
        برای تغییر ظرفیت یا وضعیت، از لینک «هاب سرویس» استفاده کنید — پلن‌ها را اینجا پراکنده
        ویرایش نکنید.
      </StatusBanner>
      <div className="filter-bar panel">
        <div className="field" style={{ maxWidth: 260 }}>
          <label htmlFor="plan-svc">سرویس</label>
          <select id="plan-svc" value={svc} onChange={(e) => setSvc(e.target.value)}>
            <option value="all">همه سرویس‌ها</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>پلن</th>
              <th>سرویس</th>
              <th>قیمت</th>
              <th>ظرفیت</th>
              <th>وضعیت</th>
              <th>هاب</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.serviceName}</td>
                <td>{formatIrr(p.priceIrr)}</td>
                <td className="meta">{p.capacitySummary}</td>
                <td>
                  <StatusBadge tone={p.status === 'active' ? 'ok' : 'muted'}>
                    {p.status === 'active' ? 'فعال' : 'غیرفعال'}
                  </StatusBadge>
                </td>
                <td>
                  <Link
                    className="btn btn-secondary btn-sm"
                    to={`/platform/services/${p.serviceId}/plans`}
                  >
                    هاب سرویس
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PlatformVersionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="کاتالوگ"
        title="نسخه‌ها و خلاصه Manifest"
        description="خلاصه نسخه سرویس و قرارداد یکپارچه‌سازی — جزئیات نصب در تب Provision هاب سرویس"
      />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>سرویس</th>
              <th>نسخه</th>
              <th>قرارداد</th>
              <th>Meters</th>
              <th>وضعیت</th>
              <th>به‌روز</th>
            </tr>
          </thead>
          <tbody>
            {MANIFEST_VERSIONS.map((v) => (
              <tr key={v.id}>
                <td>{v.serviceName}</td>
                <td className="mono">{v.versionLabel}</td>
                <td className="meta mono">{v.contractVersion}</td>
                <td className="meta">{v.metersSummary}</td>
                <td>
                  <StatusBadge
                    tone={
                      v.status === 'published'
                        ? 'ok'
                        : v.status === 'draft'
                          ? 'warn'
                          : 'muted'
                    }
                  >
                    {v.status === 'published'
                      ? 'منتشر'
                      : v.status === 'draft'
                        ? 'پیش‌نویس'
                        : 'بازنشسته'}
                  </StatusBadge>
                </td>
                <td className="meta">{v.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta">
        نصب Remote و نبض سلامت:{' '}
        <Link to="/platform/services">سرویس‌ها → تب نصب</Link>
      </p>
    </div>
  )
}

export function PlatformSettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="تنظیمات"
        title="تنظیمات پلتفرم"
        description="برند پلتفرم نمونه و سیاست اتصال Remote — stub عملیاتی برای دمو، نه پنل کامل پیکربندی"
      />
      <div className="detail-grid two">
        <section className="panel stack">
          <h2 className="panel-title">برند</h2>
          <p style={{ margin: 0 }}>
            نام محصول در UI: <strong>پلتفرم نمونه</strong>
          </p>
          <p className="meta" style={{ margin: 0 }}>
            تم از توکن‌های `index.css` · تغییر برندینگ کامل خارج از محدوده MVP است.
          </p>
        </section>
        <section className="panel stack">
          <h2 className="panel-title">سیاست اتصال (HMAC)</h2>
          <StatusBanner tone="info">
            فراخوانی Remote فقط با رمز اتصال صادرشده توسط پلتفرم نمونه. Secret پس از صدور فقط یک‌بار در UI
            دیده می‌شود — مطابق Integration Confirmed.
          </StatusBanner>
          <ul className="meta-list">
            <li>قرارداد: portfolio-integration-1</li>
            <li>مسیر سلامت پیش‌فرض: /health</li>
            <li>محیط‌ها: staging / production</li>
          </ul>
          <Link className="btn btn-secondary btn-sm" to="/platform/services">
            مدیریت نصب در هاب سرویس
          </Link>
        </section>
      </div>
      <section className="panel stack" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">محدوده Confirmed</h2>
        <p className="meta" style={{ margin: 0 }}>
          Refund خرید پلن، KYC شبا، و جزئیات صندلی سازمان در ADR هنوز OPEN یا محدودند — این صفحه آن‌ها
          را جعل نمی‌کند.
        </p>
      </section>
    </div>
  )
}

/** نمای کلی قواعد وصول — لینک به تب payout هاب سرویس */
export function PlatformPayoutOverviewPage() {
  const { payoutRules, services } = useMockStore()

  return (
    <div>
      <PageHeader
        eyebrow="مالی"
        title="قواعد وصول مدل‌ساز"
        description="آستانه حداقل مبلغ یا حداقل زمان per سرویس (Confirmed) — ویرایش داخل هاب همان سرویس"
      />
      <StatusBanner tone="info">
        منطق OR: اگر یکی از دو حداقل برقرار باشد، وصول مجاز است. مبدأ شمارش «حداقل زمان» هنوز OPEN
        است. KYC شبا جعل نشده.
      </StatusBanner>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>سرویس</th>
              <th>حداقل مبلغ</th>
              <th>حداقل زمان (روز)</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {payoutRules.map((r) => {
              const svc = services.find((s) => s.id === r.serviceId)
              return (
                <tr key={r.serviceId}>
                  <td>{r.serviceName}</td>
                  <td>{formatIrr(r.minAmountIrr)}</td>
                  <td>{r.minDays}</td>
                  <td>
                    {svc ? (
                      <Link
                        className="btn btn-secondary btn-sm"
                        to={`/platform/services/${svc.id}/payout`}
                      >
                        مدیریت در هاب سرویس
                      </Link>
                    ) : (
                      <span className="meta">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="meta">
        درآمد Base پلتفرم جداست:{' '}
        <Link to="/platform/revenue">مشاهده درآمد Base</Link>
      </p>
    </div>
  )
}

/** پنج گزارش عملیاتی Confirmed از Reporting.md + فیلتر بازه */
export function PlatformOpsReportsPage() {
  const [kind, setKind] = useState<OperationalReportKind>('top-services')
  const [date, setDate] = useState(() => defaultReportDateFilter('30d'))
  const [q, setQ] = useState('')
  const meta = OPERATIONAL_REPORT_META.find((m) => m.id === kind)

  const rows = useMemo(() => {
    const query = q.trim()
    return OPS_REPORT_ROWS[kind].filter((r) => {
      if (!isAtInDateFilter(r.at, date)) return false
      if (query && !`${r.label} ${r.value} ${r.secondary ?? ''}`.includes(query)) return false
      return true
    })
  }, [kind, date, q])

  return (
    <div>
      <PageHeader
        eyebrow="بینش"
        title="گزارش‌های عملیاتی"
        description="بازه زمانی الزامی (Confirmed) · فرمول برخی متریک‌ها OPEN — جدا از ردپای حسابرسی"
      />
      <ReportFilterBar
        date={date}
        onDateChange={setDate}
        search={q}
        onSearchChange={setQ}
        searchLabel="جستجو"
        searchPlaceholder="سرویس / مدل…"
      />
      <Tabs
        ariaLabel="انتخاب گزارش عملیاتی"
        active={kind}
        onChange={setKind}
        items={OPERATIONAL_REPORT_META.map((m) => ({ id: m.id, label: m.title }))}
      />
      <StatusBanner tone="info">
        بازه: {periodLabelForFilter(date)} · {meta?.note}
      </StatusBanner>
      {rows.length === 0 ? (
        <EmptyState title="ردیفی با این فیلتر نیست" hint="بازه یا جستجو را باز کنید." />
      ) : (
        <>
          <div className="chart-mock panel" aria-hidden>
            <div className="chart-mock-bars">
              {rows.map((r, i) => (
                <div
                  key={r.label}
                  className="chart-mock-bar"
                  style={{ height: `${Math.max(18, 72 - i * 14)}%` }}
                  title={r.label}
                />
              ))}
            </div>
            <p className="meta" style={{ margin: '0.5rem 0 0' }}>
              نمودار mock — داده واقعی از رویدادهای دامنه می‌آید
            </p>
          </div>
          <div className="panel table-wrap" style={{ marginTop: '0.9rem' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>مورد</th>
                  <th>مقدار (نمونه)</th>
                  <th>تاریخ نمونه</th>
                  <th>یادداشت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.value}</td>
                    <td className="meta">{r.at}</td>
                    <td className="meta">{r.secondary ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export function PlatformRichAuditPage() {
  const [actor, setActor] = useState('')
  const [entityType, setEntityType] = useState<'all' | AuditEntityType>('all')
  const [actionQ, setActionQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedId, setSelectedId] = useState(RICH_AUDIT_EVENTS[0]?.id ?? '')

  const rows = useMemo(
    () =>
      RICH_AUDIT_EVENTS.filter((e) => {
        if (entityType !== 'all' && e.entityType !== entityType) return false
        if (actor.trim() && !e.actor.includes(actor.trim())) return false
        if (actionQ.trim() && !e.action.includes(actionQ.trim())) return false
        if (from && e.at.localeCompare(from) < 0) return false
        if (to && e.at.localeCompare(to) > 0) return false
        return true
      }),
    [actor, entityType, actionQ, from, to],
  )

  const selected = RICH_AUDIT_EVENTS.find((e) => e.id === selectedId) ?? rows[0]

  return (
    <div>
      <PageHeader
        eyebrow="بینش"
        title="ردپای حسابرسی"
        description="فیلتر بازیگر، نوع موجودیت، اقدام و بازه — جزئیات before/after mock JSON"
      />
      <div className="filter-bar panel">
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="au-actor">بازیگر</label>
          <input
            id="au-actor"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="نام…"
          />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="au-ent">نوع موجودیت</label>
          <select
            id="au-ent"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as typeof entityType)}
          >
            <option value="all">همه</option>
            {(Object.keys(ENTITY_LABEL) as AuditEntityType[]).map((k) => (
              <option key={k} value={k}>
                {ENTITY_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label htmlFor="au-act">اقدام</label>
          <input
            id="au-act"
            value={actionQ}
            onChange={(e) => setActionQ(e.target.value)}
            placeholder="جستجو در اقدام…"
          />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label htmlFor="au-from">از</label>
          <input
            id="au-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="۱۴۰۴/۰۶/…"
          />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label htmlFor="au-to">تا</label>
          <input
            id="au-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="۱۴۰۴/۰۶/…"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="رویدادی با این فیلتر نیست" />
      ) : (
        <div className="detail-grid two">
          <section className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>زمان</th>
                  <th>بازیگر</th>
                  <th>اقدام</th>
                  <th>نوع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.id}
                    style={{
                      cursor: 'pointer',
                      background: selected?.id === e.id ? 'var(--primary-soft)' : undefined,
                    }}
                    onClick={() => setSelectedId(e.id)}
                  >
                    <td className="meta">{e.at}</td>
                    <td>{e.actor}</td>
                    <td>{e.action}</td>
                    <td>
                      <StatusBadge tone="muted">{ENTITY_LABEL[e.entityType]}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {selected ? (
            <section className="panel stack drawer-panel">
              <h2 className="panel-title">{selected.action}</h2>
              <p className="meta" style={{ margin: 0 }}>
                {selected.entity} · {selected.correlationId}
              </p>
              <p className="meta" style={{ margin: 0 }}>
                دسته: {selected.category} · بازیگر: {selected.actor}
              </p>
              <div className="json-split">
                <div>
                  <h3 className="panel-title" style={{ fontSize: '0.9rem' }}>
                    قبل
                  </h3>
                  <pre className="json-block">{selected.beforeJson ?? '— (بدون snapshot)'}</pre>
                </div>
                <div>
                  <h3 className="panel-title" style={{ fontSize: '0.9rem' }}>
                    بعد
                  </h3>
                  <pre className="json-block">{selected.afterJson ?? '— (بدون snapshot)'}</pre>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

const EXEC_HEALTH_LABEL: Record<ExecutionMetricHealth, string> = {
  ok: 'سالم',
  degraded: 'اختلال',
  down: 'قطع',
  unknown: 'نامشخص',
}

function pct(n: number, total: number): string {
  if (total <= 0) return '—'
  return `${((n / total) * 100).toFixed(1)}٪`
}

/** #۱۱ Gaps — پنل Ops متریک اجرا؛ جدا از درآمد Base و Audit دامنه */
export function PlatformExecutionMetricsPage() {
  const [date, setDate] = useState(() => defaultReportDateFilter('30d'))
  const [env, setEnv] = useState<'all' | 'production' | 'staging'>('all')
  const [health, setHealth] = useState<'all' | ExecutionMetricHealth>('all')
  const [outcome, setOutcome] = useState<'all' | 'has-fail' | 'clean'>('all')
  const [q, setQ] = useState('')

  const rows = useMemo(
    () =>
      REMOTE_EXECUTION_METRICS.filter((r) => {
        if (env !== 'all' && r.environment !== env) return false
        if (health !== 'all' && r.healthStatus !== health) return false
        if (outcome === 'has-fail' && r.failCount <= 0) return false
        if (outcome === 'clean' && r.failCount > 0) return false
        if (!isAtInDateFilter(r.lastSampleAt, date)) return false
        if (q.trim() && !`${r.serviceName} ${r.connectionId}`.includes(q.trim())) return false
        return true
      }),
    [env, health, outcome, date, q],
  )

  const totals = useMemo(() => {
    const invokeTotal = rows.reduce((s, r) => s + r.invokeTotal, 0)
    const success = rows.reduce((s, r) => s + r.successCount, 0)
    const fail = rows.reduce((s, r) => s + r.failCount, 0)
    const healthErrors = rows.reduce((s, r) => s + r.healthErrorCount, 0)
    const unhealthy = rows.filter(
      (r) => r.healthStatus === 'degraded' || r.healthStatus === 'down',
    ).length
    return { invokeTotal, success, fail, healthErrors, unhealthy }
  }, [rows])

  return (
    <div>
      <PageHeader
        eyebrow="بینش"
        title="متریک اجرا"
        description="نرخ موفقیت/شکست Invoke، تأخیر، و خطای نبض per سرویس Remote — Observability برای اپراتور؛ نه درآمد Base و نه ردپای حسابرسی"
      />
      <StatusBanner tone="info">
        مکمل نبض نصب در{' '}
        <Link to="/platform/services">هاب سرویس / تب نصب</Link> · جدا از{' '}
        <Link to="/platform/reports">گزارش‌های عملیاتی کسب‌وکار</Link> و{' '}
        <Link to="/platform/audit">Audit</Link> · درآمد Base فقط در{' '}
        <Link to="/platform/revenue">مالی</Link>
      </StatusBanner>

      <ReportFilterBar
        date={date}
        onDateChange={setDate}
        search={q}
        onSearchChange={setQ}
        searchLabel="سرویس"
        searchPlaceholder="نام سرویس / اتصال…"
      >
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="xem-env">محیط</label>
          <select
            id="xem-env"
            value={env}
            onChange={(e) => setEnv(e.target.value as typeof env)}
          >
            <option value="all">همه</option>
            <option value="production">اصلی</option>
            <option value="staging">آزمایشی</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="xem-health">سلامت</label>
          <select
            id="xem-health"
            value={health}
            onChange={(e) => setHealth(e.target.value as typeof health)}
          >
            <option value="all">همه</option>
            <option value="ok">سالم</option>
            <option value="degraded">اختلال</option>
            <option value="down">قطع</option>
            <option value="unknown">نامشخص</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="xem-out">نتیجه Invoke</label>
          <select
            id="xem-out"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as typeof outcome)}
          >
            <option value="all">همه</option>
            <option value="has-fail">دارای شکست</option>
            <option value="clean">بدون شکست</option>
          </select>
        </div>
      </ReportFilterBar>

      <StatusBanner tone="info">
        بازه: {periodLabelForFilter(date)} · داده seed mock — فرمول تجمیع دقیق هنوز OPEN
      </StatusBanner>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="meta">Invoke کل</span>
          <strong>{totals.invokeTotal.toLocaleString('fa-IR')}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">نرخ موفقیت</span>
          <strong>{pct(totals.success, totals.invokeTotal)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">نرخ شکست</span>
          <strong>{pct(totals.fail, totals.invokeTotal)}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">خطای نبض</span>
          <strong>{totals.healthErrors.toLocaleString('fa-IR')}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">سرویس ناسالم</span>
          <strong>{totals.unhealthy.toLocaleString('fa-IR')}</strong>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="متری برای این فیلتر نیست" />
      ) : (
        <div className="panel table-wrap" style={{ marginTop: '0.9rem' }}>
          <table className="data">
            <thead>
              <tr>
                <th>سرویس Remote</th>
                <th>محیط</th>
                <th>موفق</th>
                <th>ناموفق</th>
                <th>P50 / P95</th>
                <th>خطای health</th>
                <th>میانگین retry</th>
                <th>سلامت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.serviceName}
                    <div className="meta mono">{r.connectionId}</div>
                    {r.note ? <div className="meta">{r.note}</div> : null}
                  </td>
                  <td className="meta">
                    {r.environment === 'production' ? 'اصلی' : 'آزمایشی'}
                  </td>
                  <td>
                    {pct(r.successCount, r.invokeTotal)}
                    <div className="meta">
                      {r.successCount.toLocaleString('fa-IR')} /{' '}
                      {r.invokeTotal.toLocaleString('fa-IR')}
                    </div>
                  </td>
                  <td>
                    {pct(r.failCount, r.invokeTotal)}
                    <div className="meta">{r.failCount.toLocaleString('fa-IR')}</div>
                  </td>
                  <td className="mono meta">
                    {r.latencyP50Ms} / {r.latencyP95Ms} ms
                  </td>
                  <td>{r.healthErrorCount.toLocaleString('fa-IR')}</td>
                  <td className="meta">{r.avgRetriesBeforeTicket.toFixed(1)}</td>
                  <td>
                    <StatusBadge
                      tone={
                        r.healthStatus === 'ok'
                          ? 'ok'
                          : r.healthStatus === 'down'
                            ? 'danger'
                            : r.healthStatus === 'degraded'
                              ? 'warn'
                              : 'muted'
                      }
                    >
                      {EXEC_HEALTH_LABEL[r.healthStatus]}
                    </StatusBadge>
                    <div className="meta">{r.lastSampleAt}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
