import { NavLink, Outlet, Link, useNavigate, useLocation, useParams, matchPath } from 'react-router-dom'
import { LogOut, Wallet, Home } from 'lucide-react'
import { useMockStore } from '../../data/MockStore'
import { useAuth } from '../../auth/AuthContext'
import {
  ACCOUNT_NAV_GROUPS,
  PLATFORM_NAV_GROUPS,
  serviceNavGroups,
  platformServiceNavGroups,
  modelUseNavGroups,
  type NavGroup,
} from '../../nav'
import { formatIrr } from '../../lib/format'

type ShellMode = 'account' | 'service' | 'model' | 'platform' | 'platform-service'

function detectMode(pathname: string): {
  mode: ShellMode
  instanceId?: string
  modelId?: string
  serviceId?: string
} {
  const svc =
    matchPath('/account/services/:instanceId/*', pathname) ??
    matchPath('/account/services/:instanceId', pathname)
  if (svc?.params.instanceId) {
    return { mode: 'service', instanceId: svc.params.instanceId }
  }
  const mdl =
    matchPath('/account/models/:modelId/*', pathname) ??
    matchPath('/account/models/:modelId', pathname)
  if (mdl?.params.modelId) {
    return { mode: 'model', modelId: mdl.params.modelId }
  }
  const platSvc =
    matchPath('/platform/services/:serviceId/*', pathname) ??
    matchPath('/platform/services/:serviceId', pathname)
  if (platSvc?.params.serviceId && platSvc.params.serviceId !== undefined) {
    return { mode: 'platform-service', serviceId: platSvc.params.serviceId }
  }
  if (pathname.startsWith('/platform')) return { mode: 'platform' }
  return { mode: 'account' }
}

function NavGroups({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      {groups.map((group, gi) => (
        <div key={group.label ?? `g-${gi}`} className="nav-group">
          {group.label ? <p className="nav-group-label">{group.label}</p> : null}
          {group.items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </>
  )
}

export function AppShell() {
  const { availableIrr, creatorInstances, models, services } = useMockStore()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const { mode, instanceId, modelId, serviceId } = detectMode(location.pathname)
  const instance = instanceId
    ? creatorInstances.find((i) => i.id === instanceId)
    : undefined
  const model = modelId ? models.find((m) => m.id === modelId) : undefined
  const platformService = serviceId
    ? services.find((s) => s.id === serviceId)
    : undefined

  let navGroups: NavGroup[] = ACCOUNT_NAV_GROUPS
  let brandSub = 'فضای حساب کاربری'
  let spaceChip = 'حساب'
  if (mode === 'platform-service' && serviceId) {
    navGroups = platformServiceNavGroups(serviceId)
    brandSub = platformService
      ? `مدیریت سرویس · ${platformService.name}`
      : 'مدیریت سرویس'
    spaceChip = 'پنل سرویس'
  } else if (mode === 'platform') {
    navGroups = PLATFORM_NAV_GROUPS
    brandSub = 'اپراتور پلتفرم پلتفرم نمونه'
    spaceChip = 'پلتفرم'
  } else if (mode === 'service' && instanceId) {
    navGroups = serviceNavGroups(instanceId)
    brandSub = instance
      ? `${instance.serviceName} · ${instance.planName}`
      : 'مدیریت نمونه سرویس'
    spaceChip = 'نمونه سرویس'
  } else if (mode === 'model' && modelId) {
    navGroups = modelUseNavGroups(modelId)
    brandSub = model ? `مدل: ${model.name}` : 'مصرف مدل'
    spaceChip = 'مصرف مدل'
  }

  const isPlatformUser = user.roles.includes('platform')
  const isMarketUser =
    user.roles.includes('consumer') || user.roles.includes('creator')

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <p className="brand-name">پلتفرم نمونه</p>
          <p className="brand-sub">{brandSub}</p>
        </div>
        {(mode === 'service' || mode === 'model') && (
          <Link to="/account" className="btn btn-secondary btn-sm" style={{ marginInline: 4 }}>
            <Home size={14} />
            بازگشت به میز کار
          </Link>
        )}
        {mode === 'platform-service' ? (
          <Link
            to="/platform/services"
            className="btn btn-secondary btn-sm"
            style={{ marginInline: 4 }}
          >
            <Home size={14} />
            بازگشت به فهرست سرویس‌ها
          </Link>
        ) : null}
        <nav className="nav">
          <NavGroups groups={navGroups} />
        </nav>
        {isPlatformUser && mode !== 'platform' && mode !== 'platform-service' ? (
          <Link to="/platform" className="btn btn-secondary btn-sm" style={{ margin: 4 }}>
            فضای پلتفرم
          </Link>
        ) : null}
        {isMarketUser && (mode === 'platform' || mode === 'platform-service') ? (
          <Link to="/account" className="btn btn-secondary btn-sm" style={{ margin: 4 }}>
            فضای حساب
          </Link>
        ) : null}
        <div className="sidebar-foot">دمو UI — بدون backend واقعی</div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <span className="space-chip">{spaceChip}</span>
            <span className="topbar-hint">
              {user.displayName}
              <span className="demo-tag">MOCK</span>
            </span>
            {mode === 'service' && instance ? (
              <span className="meta">
                حساب › {instance.serviceName} › {instance.planName}
              </span>
            ) : null}
            {mode === 'model' && model ? (
              <span className="meta">حساب › مدل › {model.name}</span>
            ) : null}
            {mode === 'platform-service' && platformService ? (
              <span className="meta">پلتفرم › سرویس‌ها › {platformService.name}</span>
            ) : null}
          </div>
          <div className="topbar-actions">
            {mode !== 'platform' && mode !== 'platform-service' ? (
              <Link to="/account/wallet" className="wallet-chip" title="موجودی قابل‌استفاده">
                <Wallet size={14} />
                {formatIrr(availableIrr)}
              </Link>
            ) : null}
            <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>
              <LogOut size={14} />
              خروج
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function useShellParams() {
  return useParams()
}
