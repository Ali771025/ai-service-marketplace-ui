import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useMockStore } from '../../data/MockStore'
import { PageHeader, StatusBadge, StatusBanner, EmptyState } from '../../components/ui/Primitives'
import { formatIrr, supportLabel } from '../../lib/format'
import { CREATOR_PLAN_CATALOG } from '../../data/creator'
import { getModelHeadroom } from '../../data/headroom'
import { HeadroomAccountWidget } from '../../components/HeadroomDashboard'

export function AccountHubPage() {
  const { user } = useAuth()
  const {
    creatorInstances,
    models,
    availableIrr,
    exceptionTickets,
    wallet,
    resetDemoData,
  } = useMockStore()

  const myModels = models.filter((m) => m.inMyModels)
  const openExceptions = exceptionTickets.filter(
    (t) => t.status === 'open' || t.status === 'in-progress',
  ).length
  const isPlatform = user?.roles.includes('platform')
  const hubModel = myModels.find((m) => m.id === 'mdl-behsaz-rb') ?? myModels[0]
  const hubHeadroom = hubModel
    ? getModelHeadroom(hubModel.id, hubModel.apiKeyPlaceholder)
    : null

  return (
    <div>
      <PageHeader
        eyebrow="فضای حساب"
        title="میز کار"
        description={`${user?.displayName ?? ''} — کیف پول، نمونه‌های سرویس، مدل‌های در حال استفاده`}
      />

      <StatusBanner tone="info">
        چهار فضای محصول: <strong>حساب</strong> (اینجا) · <strong>نمونه سرویس</strong> (مدیریت
        نمونه) · <strong>استفاده از مدل</strong> (مصرف‌کننده؛ کوئری‌ساز = کلید دسترسی) ·{' '}
        <strong>اپراتور پلتفرم</strong> (مدیرعامل).
      </StatusBanner>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="meta">موجودی کیف پول</span>
          <strong>{formatIrr(availableIrr)}</strong>
          <Link className="meta" to="/account/wallet">
            مدیریت کیف پول
          </Link>
        </div>
        <div className="stat-card">
          <span className="meta">نمونه‌های سرویس</span>
          <strong>{creatorInstances.length}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">مدل‌های در حال استفاده</span>
          <strong>{myModels.length}</strong>
        </div>
        <div className="stat-card">
          <span className="meta">تیکت باز به پلتفرم</span>
          <strong>{openExceptions}</strong>
          <Link className="meta" to="/account/exceptions">
            درخواست به پلتفرم نمونه
          </Link>
        </div>
      </div>

      {availableIrr < 0 ? (
        <StatusBanner tone="danger">
          بدهی کیف پول — مصرف جدید مسدود است.{' '}
          <Link to="/account/wallet">شارژ / تسویه</Link>
        </StatusBanner>
      ) : null}
      {wallet.postedIrr - wallet.reservedIrr < wallet.lowBalanceThresholdIrr &&
      availableIrr >= 0 ? (
        <StatusBanner tone="warn">
          هشدار موجودی کم — <Link to="/account/wallet">کیف پول</Link>
        </StatusBanner>
      ) : null}

      {hubHeadroom && hubModel ? (
        <HeadroomAccountWidget
          snapshot={hubHeadroom}
          detailTo={`/account/models/${hubModel.id}/usage`}
        />
      ) : null}

      <section className="panel" style={{ marginTop: '0.5rem' }}>
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="panel-title" style={{ margin: 0 }}>
            سرویس‌های خریداری‌شده (نمونه پلن)
          </h2>
            <Link className="btn btn-primary btn-sm" to="/account/buy-plans">
              خرید پلن سرویس
            </Link>
        </div>
        <p className="meta">
          هر نمونه را انتخاب کنید تا وارد فضای مدیریت همان سرویس شوید (مدل، حاشیه، پشتیبانی،
          دانش…).
        </p>
        {creatorInstances.length === 0 ? (
          <EmptyState
            title="هنوز نمونه سرویسی ندارید"
            hint="با خرید پلن سرویس از کاتالوگ پلتفرم نمونه، یک نمونه پلن جدا ساخته می‌شود."
            action={
              <Link className="btn btn-primary" to="/account/buy-plans">
                خرید پلن سرویس
              </Link>
            }
          />
        ) : (
          <div className="grid-cards">
            {creatorInstances.map((i) => (
              <article key={i.id} className="catalog-card">
                <h3>{i.planName}</h3>
                <span className="meta">{i.serviceName}</span>
                <StatusBadge
                  tone={
                    i.status === 'active' ? 'ok' : i.status === 'expiring' ? 'warn' : 'muted'
                  }
                >
                  {i.status === 'active'
                    ? 'فعال'
                    : i.status === 'expiring'
                      ? 'رو به انقضا'
                      : 'منقضی'}
                </StatusBadge>
                <p className="meta" style={{ margin: 0 }}>
                  مدل متصل: {i.linkedModelName ?? 'بدون مدل — می‌توانید مستقر کنید'}
                </p>
                <p className="mono meta" style={{ margin: 0 }}>
                  /service/{i.pathSlug}
                </p>
                <div className="btn-row">
                  <Link className="btn btn-primary" to={`/account/services/${i.id}`}>
                    مدیریت این سرویس
                  </Link>
                  <Link className="btn btn-secondary" to={`/service/${i.pathSlug}`}>
                    آدرس اختصاصی
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="panel-title" style={{ margin: 0 }}>
            مدل‌هایی که استفاده می‌کنم
          </h2>
          <Link className="btn btn-secondary btn-sm" to="/account/discover">
            کشف مدل‌ها
          </Link>
        </div>
        <p className="meta">
          انتخاب مدل → فضای استفاده: برای کوئری‌ساز کار اصلی کلید دسترسی است؛ تاریخچه/پشتیبانی در کنار آن.
        </p>
        {myModels.length === 0 ? (
          <EmptyState
            title="مدلی در فهرست استفاده نیست"
            hint="از کشف مدل‌ها یک مدل را انتخاب کنید. برای کوئری‌ساز کار اصلی داخل پلتفرم نمونه مدیریت کلید دسترسی است."
            action={
              <Link className="btn btn-secondary" to="/account/discover">
                کشف مدل‌ها
              </Link>
            }
          />
        ) : (
          <div className="grid-cards">
            {myModels.map((m) => (
              <article key={m.id} className="catalog-card">
                <h3>{m.name}</h3>
                <span className="meta">{m.creatorName}</span>
                <StatusBadge
                  tone={
                    m.supportPlanStatus === 'active'
                      ? 'ok'
                      : m.supportPlanStatus === 'expired'
                        ? 'warn'
                        : 'info'
                  }
                >
                  {supportLabel(m.supportPlanStatus)}
                </StatusBadge>
                <Link className="btn btn-primary" to={`/account/models/${m.id}`}>
                  استفاده و مدیریت
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">اقدامات سریع حساب</h2>
        <div className="btn-row">
          <Link className="btn btn-secondary" to="/account/wallet">
            کیف پول
          </Link>
          <Link className="btn btn-secondary" to="/account/invoices">
            صورت‌حساب‌ها
          </Link>
          <Link className="btn btn-secondary" to="/account/exceptions">
            تیکت به پلتفرم / فعال‌سازی دستی
          </Link>
          <Link className="btn btn-secondary" to="/account/buy-plans">
            خرید پلن ({CREATOR_PLAN_CATALOG.filter((p) => p.status === 'available').length}{' '}
            موجود)
          </Link>
          {isPlatform ? (
            <Link className="btn btn-primary" to="/platform">
              ورود به فضای اپراتور پلتفرم
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 8 }}
          onClick={() => {
            if (confirm('بازنشانی داده‌های دمو؟')) resetDemoData()
          }}
        >
          بازنشانی داده‌های دمو
        </button>
      </section>
    </div>
  )
}

export function AccountProfilePage() {
  const { user } = useAuth()
  return (
    <div>
      <PageHeader title="پروفایل / سازمان" description="اطلاعات حساب (mock)" />
      <section className="panel stack">
        <p style={{ margin: 0 }}>
          <strong>نام:</strong> {user?.displayName}
        </p>
        <p style={{ margin: 0 }}>
          <strong>ایمیل:</strong> {user?.email}
        </p>
        <p style={{ margin: 0 }}>
          <strong>نام کاربری:</strong> {user?.username}
        </p>
        <p className="meta">
          نقش‌های محصول: مصرف‌کننده و مدل‌ساز با یک ثبت‌نام در دسترس‌اند — از میز کار به هر دو مسیر
          وارد می‌شوید. جزئیات تفاوت فرد/سازمان: OPEN.
        </p>
      </section>
    </div>
  )
}
