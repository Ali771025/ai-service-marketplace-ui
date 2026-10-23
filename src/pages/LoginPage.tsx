import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { homeForUser, ROLE_LABEL } from '../auth/types'
import { SEED_USERS, findUserByLogin } from '../auth/users'

export function LoginPage() {
  const { login, isAuthenticated, homePath } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [loginValue, setLoginValue] = useState('contractor@example.invalid')
  const [password, setPassword] = useState('Demo123!')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to={from && from !== '/login' ? from : homePath} replace />
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const result = login(loginValue, password)
    if (!result.ok) {
      setError(result.message)
      return
    }
    const user = findUserByLogin(loginValue, password)
    const target =
      from && from !== '/login' ? from : user ? homeForUser(user) : '/account'
    navigate(target, { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>پلتفرم نمونه</h1>
          <p>پلتفرم سرویس هوش مصنوعی · دمو UI (mock)</p>
        </div>

        <div className="banner banner-info">
          پس از ورود به <strong>میز کار حساب</strong> می‌روید: از آنجا سرویس خریداری‌شده یا مدل در
          حال استفاده را انتخاب کنید. مدیرعامل وارد فضای پلتفرم می‌شود.
        </div>

        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="login">ایمیل یا نام کاربری</label>
            <input
              id="login"
              autoComplete="username"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder="contractor@example.invalid"
            />
          </div>
          <div className="field">
            <label htmlFor="password">رمز عبور</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <div className="banner banner-danger">{error}</div> : null}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            ورود
          </button>
        </form>

        <p className="meta" style={{ textAlign: 'center', margin: 0 }}>
          حساب ندارید؟ <Link to="/register">ثبت‌نام</Link>
        </p>

        <section className="login-hint panel">
          <h2 className="panel-title">حساب‌های دمو</h2>
          <p className="meta" style={{ marginTop: 0 }}>
            رمز همه: <code className="mono">Demo123!</code>
          </p>
          <ul className="demo-users">
            {SEED_USERS.filter((u) =>
              ['u-ceo', 'u-contractor', 'u-user'].includes(u.id),
            ).map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className="btn btn-ghost demo-user-btn"
                  onClick={() => {
                    setLoginValue(u.email)
                    setPassword(u.password)
                    setError(null)
                  }}
                >
                  <strong>{u.displayName}</strong>
                  <span className="meta">
                    {u.email} · {u.roles.map((r) => ROLE_LABEL[r]).join('، ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
