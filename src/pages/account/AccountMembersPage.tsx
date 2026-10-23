import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ORG_PEER_MEMBERS,
  type OrgPeerMember,
} from '../../data/platformOpsExtras'
import {
  PageHeader,
  StatusBadge,
  StatusBanner,
} from '../../components/ui/Primitives'

/** اعضای دسترسی هم‌سطح — MVP-demo؛ جزئیات org sharing OPEN */
export function AccountMembersPage() {
  const [members, setMembers] = useState<OrgPeerMember[]>(ORG_PEER_MEMBERS)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/account">حساب</Link>
        <span>/</span>
        <span>اعضای دسترسی</span>
      </div>
      <PageHeader
        eyebrow="تیم"
        title="اعضای دسترسی"
        description="پیش‌نویس UX / مطابق الگو — دعوت عضو با نقش viewer/admin برای دمو سازمان"
      />
      <StatusBanner tone="warn">
        برچسب MVP-demo: قواعد واقعی اشتراک سازمان، صندلی، و entitlement هنوز OPEN است.
      </StatusBanner>
      {msg ? <StatusBanner tone="ok">{msg}</StatusBanner> : null}

      <div className="detail-grid two">
        <section className="panel stack">
          <h2 className="panel-title">دعوت عضو</h2>
          <div className="field">
            <label htmlFor="acc-inv-email">ایمیل</label>
            <input
              id="acc-inv-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.invalid"
            />
          </div>
          <div className="field">
            <label htmlFor="acc-inv-role">نقش</label>
            <select
              id="acc-inv-role"
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
                  id: `acc-peer-${Date.now()}`,
                  displayName: email.trim().split('@')[0] ?? 'عضو',
                  email: email.trim(),
                  role,
                  status: 'invited',
                  invitedAt: 'امروز (mock)',
                },
              ])
              setMsg(`دعوت برای ${email.trim()} ارسال شد (mock).`)
              setEmail('')
            }}
          >
            ارسال دعوت
          </button>
        </section>

        <section className="panel table-wrap">
          <h2 className="panel-title">اعضای فعلی</h2>
          <table className="data">
            <thead>
              <tr>
                <th>عضو</th>
                <th>نقش</th>
                <th>وضعیت</th>
                <th>دعوت</th>
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
                      {m.role}
                    </StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={m.status === 'active' ? 'ok' : 'warn'}>
                      {m.status === 'active' ? 'فعال' : 'دعوت‌شده'}
                    </StatusBadge>
                  </td>
                  <td className="meta">{m.invitedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <p className="meta" style={{ marginTop: '0.9rem' }}>
        تیکت به پلتفرم جداست:{' '}
        <Link to="/account/exceptions">تیکت به پلتفرم</Link> · تیکت مدل داخل فضای سرویس/مدل.
      </p>
    </div>
  )
}
